import { NextRequest, NextResponse } from "next/server";
import { ChatOpenAI } from "@langchain/openai";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import {
  Action,
  Analysis,
  analysisSchema,
  FlaggedRow,
  Organization,
  cleanDataSchema,
  organizationSchema,
  ValidationError,
} from "@/utils/schemas";
import { Annotation, Command, END, StateGraph } from "@langchain/langgraph";
import { TokenUsage } from "@/utils/types";

const ParserStateAnnotation = Annotation.Root({
  messages: Annotation<string[]>(),
  organizations: Annotation<Organization[]>(),
  processedOrganizations: Annotation<Organization[]>(),
  columns: Annotation<string[]>(),
  analysis: Annotation<Analysis | null>(),
  actionsPerformed: Annotation<Action[]>(),
  flaggedRows: Annotation<FlaggedRow[]>(),
  validationErrors: Annotation<ValidationError[]>(),
  tokenUsage: Annotation<TokenUsage>(),
  error: Annotation<string | null>(),
});

// Model cost per 1000 tokens (adjust these to match your actual costs)
const MODEL_COSTS = {
  "gpt-4o-2024-08-06": {
    input: 0.01, // $0.01 per 1000 input tokens
    output: 0.03, // $0.03 per 1000 output tokens
  },
};

const estimateTokenCount = (text: string): number => Math.ceil(text.length / 4);

const calculateTokenCost = (
  inputTokens: number,
  outputTokens: number,
  modelName: string,
): number => {
  const modelCost = MODEL_COSTS[modelName as keyof typeof MODEL_COSTS];
  if (!modelCost) return 0;

  const inputCost = (inputTokens / 1000) * modelCost.input;
  const outputCost = (outputTokens / 1000) * modelCost.output;

  return inputCost + outputCost;
};

const baseModel = new ChatOpenAI({
  temperature: 0,
  modelName: "gpt-4o-2024-08-06",
  maxRetries: 3,
  onFailedAttempt: (error) => {
    console.error(error);
  },
  topP: 1,
});

const analysisModel = baseModel.withStructuredOutput(analysisSchema);
const cleaningModel = baseModel.withStructuredOutput(cleanDataSchema);

const validateOrganizations = (organizations: Organization[]) => {
  let validationErrors: ValidationError[] = [];

  for (const organization of organizations) {
    try {
      organizationSchema.parse(organization);
    } catch (error: any) {
      validationErrors.push({
        issues: error.issues,
        organizationIndex: organization.index,
      });
    }
  }
  return validationErrors;
};

const orchestrateCleaning = (state: typeof ParserStateAnnotation.State) => {
  const {
    organizations,
    flaggedRows,
    processedOrganizations,
    analysis,
    tokenUsage,
  } = state;

  const rowsWithIssues = analysis?.issues.flatMap(
    (issue) => issue.affectedRowIndexes || [],
  );

  const unFlaggedOrganizations = organizations.filter(
    (org) => !flaggedRows.some((fr) => fr.rowIndex === org.index),
  );

  const validationErrors = validateOrganizations(unFlaggedOrganizations);
  const problematicRows = organizations.filter(
    (org) =>
      validationErrors.some((ve) => ve.organizationIndex === org.index) ||
      rowsWithIssues?.includes(org.index),
  );
  const properCleanedOrganizations = organizations.filter(
    (org) =>
      !validationErrors.some((ve) => ve.organizationIndex === org.index) &&
      !rowsWithIssues?.includes(org.index),
  );

  console.log(
    `[SERVER] Out of: ${organizations.length} we had: ${properCleanedOrganizations.length} clean organizations, we tested: ${unFlaggedOrganizations.length} unflagged organizations, that produced: ${validationErrors.length} validation errors. Currently we have: ${processedOrganizations.length} processed organizations. Passing ${problematicRows.length} problematic rows to cleaner or analysis`,
  );

  if (rowsWithIssues?.length) {
    return new Command({
      update: {
        organizations: problematicRows,
        processedOrganizations: [
          ...processedOrganizations,
          ...properCleanedOrganizations,
        ],
        validationErrors,
      },
      goto: "clean",
    });
  }

  if (validationErrors.length) {
    return new Command({
      update: {
        validationErrors,
        organizations: problematicRows,
        processedOrganizations: [
          ...processedOrganizations,
          ...properCleanedOrganizations,
        ],
      },
      goto: "analyze",
    });
  }

  return new Command({
    goto: END,
    update: {
      processedOrganizations: [...processedOrganizations, ...organizations],
      tokenUsage: {
        ...tokenUsage,
        totalCost: calculateTokenCost(
          tokenUsage.inputTokens,
          tokenUsage.outputTokens,
          baseModel.model,
        ),
      },
    },
  });
};

/**
 * Analyzes the dataset for quality issues
 */
const analyzeData = async (state: typeof ParserStateAnnotation.State) => {
  const { organizations, validationErrors, tokenUsage } = state;

  console.log(
    `[SERVER] Starting data analysis for ${organizations.length} rows`,
  );

  // Calculate size metrics
  const dataJsonSize = JSON.stringify(organizations).length;
  const estimatedTokens = dataJsonSize / 4; // Rough approximation: 4 chars ≈ 1 token

  console.log(
    `[SERVER] Dataset size: ${(dataJsonSize / (1024 * 1024)).toFixed(2)}MB, ~${(estimatedTokens / 1000).toFixed(2)}K tokens`,
  );

  // Prepare messages for the model
  const messages = [
    new HumanMessage({
      content: `You are a data scientist tasked with analyzing a dataset for cleaning issues and providing a detailed fix for each issue. Identify quality problems and suggest corrective actions based on the rules below.
      
      Dataset:
      ${JSON.stringify(organizations, null, 2)}

      ${
        validationErrors?.length
          ? `Validation errors:
      ${JSON.stringify(validationErrors, null, 2)}`
          : ""
      }
      
      This dataset is expected to conform to an organization schema with the following rules:

      1. Only Lithuanian records are supported. Flag row columns that do not comply to this rule with reason: "Only Lithuania supported".
      2. vatCode must be numeric only (remove any country prefixes such as LT/EE/LV) and can be null.
      3. Organization type must be one of the following standard organization types: (it can be either organization type like "MB" or the full name like "Mažoji bendrija", however for cleaning it should be always converted to the short version)
      Supported types and their short and full versions:
        * AB - Akcinė bendrovė
        * DB - Draudimo bendrovė
        * F - Filialas
        * IĮ - Individuali įmonė
        * PB - Profesinė bendrija
        * SĮ - Savivaldybės įmonė
        * TŪB - Tikroji ūkinė bendrija
        * UAB - Uždaroji akcinė bendrovė
        * MB - Mažoji bendrija
        * VĮ - Valstybės įmonė
        * ŽŪB - Žemės ūkio bendrovė
        * FA - Fizinis Asmuo
       
      4. If there are multiple issues (multiple columns) that should be flagged, make sure you flag them all within same flagged row record.
      5. IMPORTANT: Don't fill empty values with "Unknown" or other placeholder values, leave them empty and flag them with reason: "{columnName} should not be empty". Also, if an issue cannot be fixed with given data, label it for manual review instead of guessing
      6. If it's complete duplicates (all details match except some formatting, for example additional spaces or one has type "UAB" and the other has type "Uždaroji akcinė bendrovė" (which is the same type)) indicate which one should be removed. Also if you suggest some changes always check if after those changes there is not gonna be another duplicate, if so - ask for both- a change and a removal.
  
      
      Analyze for:
      - Missing values and duplicates.
      - Schema non-conformance (invalid organization types, vatCode prefixes, or address issues).
      - Extra spaces and special characters.
      - Any other quality issues.
      
      Your response should be structured data with:
      - A list of issues found
      - Severity of each issue
      - Affected rows and columns
      - For each issue please provide a detailed description on how to fix it. If some certain actions should be taken, please suggest them, if it should be flagged, then tell that it should be flagged. If couple rows have same problem and same fix, or multiple rows are affected because they are duplicates- mention them as one issue, otherwise mention each row as a separate issue and provide a detailed approach on how to fix it (or that it should be flagged).
      - An overall analysis summary
      
      If you receive validation errors, suggest fixes if they are simple and obey the remaining rules, otherwise flag them.

      NOTE: Issue description should be very specific, it should give a direct solution on how it should be fixed. For example if type should be shortened it should specify to which type it should be shortened. If prefix should be removed it should specify which prefix should be removed.

      Misuse prevention: if the dataset is not of desired organizations format return an error saying that it's invalid dataset and that it should be about organizations with proper template.
      `,
    }),
  ];

  const analysis = await analysisModel.invoke(messages);
  console.log(
    `[SERVER] Analysis complete. Found ${analysis.issues.length} issues`,
  );

  const estimatedInputTokens = estimateTokenCount(JSON.stringify(messages[0]));
  const estimatedOutputTokens = estimateTokenCount(JSON.stringify(analysis));
  const updatedInputTokens = tokenUsage.inputTokens + estimatedInputTokens;
  const updatedOutputTokens = tokenUsage.outputTokens + estimatedOutputTokens;

  if (analysis.error) {
    return new Command({
      goto: END,
      update: { error: analysis.error },
    });
  }

  return new Command({
    update: {
      ...state,
      messages: [
        ...state.messages,
        ...messages,
        new AIMessage({ content: JSON.stringify(analysis) }),
      ],
      analysis,
      tokenUsage: {
        ...tokenUsage,
        inputTokens: updatedInputTokens,
        outputTokens: updatedOutputTokens,
      },
    },
  });
};

const cleanData = async (state: typeof ParserStateAnnotation.State) => {
  const { organizations, analysis, flaggedRows, actionsPerformed, tokenUsage } =
    state;

  console.log(
    `[SERVER] Starting data cleaning for ${organizations.length} rows`,
  );

  // Prepare messages for the model
  const messages = [
    new HumanMessage({
      content: `You are a data scientist tasked with cleaning a dataset according to the issues of analysis. 
    
      Dataset:
      ${JSON.stringify(organizations, null, 2)}

      Analysis of the issues found in the dataset:
      ${JSON.stringify(analysis?.issues, null, 2)}

      Additional notes:
      - Don't do anything that analysis didn't suggest
      
      Your response should be structured data with:
      - A list of updated organizations (cleaned and flagged if needed)
      - A list of actions taken to clean the dataset (make sure its super detailed, it should include which rows are affected by which action and what actions were taken precisely)
      - A list of flagged organizations that should be reviewed manually (organizations you could not clean obeying the rules)`,
    }),
  ];

  const cleanedData = await cleaningModel.invoke(messages);
  console.log(`[SERVER] Cleaning complete`);

  const estimatedInputTokens = estimateTokenCount(JSON.stringify(messages[0]));
  const estimatedOutputTokens = estimateTokenCount(JSON.stringify(cleanedData));
  const updatedInputTokens = tokenUsage.inputTokens + estimatedInputTokens;
  const updatedOutputTokens = tokenUsage.outputTokens + estimatedOutputTokens;

  return new Command({
    update: {
      ...state,
      messages: [
        ...state.messages,
        ...messages,
        new AIMessage({ content: JSON.stringify(cleanedData) }),
      ],
      organizations: cleanedData.cleanedData,
      actionsPerformed: [
        ...actionsPerformed,
        ...cleanedData.cleaningActionsPerformed,
      ],
      flaggedRows: [...flaggedRows, ...cleanedData.flaggedRows],
      analysis: null,
      tokenUsage: {
        ...tokenUsage,
        inputTokens: updatedInputTokens,
        outputTokens: updatedOutputTokens,
      },
    },
    goto: "orchestrateCleaning",
  });
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { data, columns } = body;

    // Calculate size metrics for feedback to user
    const dataSize = data ? JSON.stringify(data).length : 0;

    console.log(
      `[SERVER] Dataset info: ${data?.length || 0} rows, ${(dataSize / (1024 * 1024)).toFixed(2)}MB`,
    );

    console.log(`[SERVER] Performing data cleanup...`);

    const graph = new StateGraph(ParserStateAnnotation)
      .addNode("analyze", analyzeData, {
        ends: [END, "orchestrateCleaning"],
      })
      .addNode("clean", cleanData, {
        ends: ["orchestrateCleaning"],
      })
      .addNode("orchestrateCleaning", orchestrateCleaning, {
        ends: [END, "analyze", "clean"],
      })

      .addEdge("__start__", "analyze")
      .compile();

    const result = await graph.invoke({
      messages: [],
      organizations: data,
      processedOrganizations: [],
      columns: columns,
      analysis: null,
      actionsPerformed: [],
      flaggedRows: [],
      validationErrors: [],
      tokenUsage: {
        inputTokens: 0,
        outputTokens: 0,
        totalCost: 0,
      },
      error: null,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in data cleaner:", error);
    return NextResponse.json(
      { message: "An error occurred during data cleaning" },
      { status: 500 },
    );
  }
}
