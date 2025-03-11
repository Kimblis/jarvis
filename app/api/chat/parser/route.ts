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

const GameStateAnnotation = Annotation.Root({
  messages: Annotation<string[]>(),
  organizations: Annotation<Organization[]>(),
  processedOrganizations: Annotation<Organization[]>({
    default: () => [],
    reducer: (a, b) => [...a, ...b],
  }),
  columns: Annotation<string[]>(),
  analysis: Annotation<Analysis | null>(),
  actionsPerformed: Annotation<Action[]>({
    default: () => [],
    reducer: (a, b) => [...a, ...b],
  }),
  flaggedRows: Annotation<FlaggedRow[]>({
    default: () => [],
    reducer: (a, b) => [...a, ...b],
  }),
  validationErrors: Annotation<ValidationError[]>(),
});

const baseModel = new ChatOpenAI({
  temperature: 0,
  modelName: "gpt-4o-mini",
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

const shouldSummarizeOrCleanMore = (
  state: typeof GameStateAnnotation.State,
) => {
  console.log(
    `[SERVER] Validating organizations to decide if we should end or clean more`,
  );
  const { organizations, flaggedRows, processedOrganizations } = state;

  const unflaggedOrganizations = organizations.filter(
    (org) => !flaggedRows.some((fr) => fr.rowIndex === org.index),
  );
  const validationErrors = validateOrganizations(unflaggedOrganizations);
  const organizationsWithValidationErrors = unflaggedOrganizations.filter(
    (org) => validationErrors.some((ve) => ve.organizationIndex === org.index),
  );
  const organizationsWithoutValidationErrors = organizations.filter(
    (org) => !validationErrors.some((ve) => ve.organizationIndex === org.index),
  );

  console.log(
    `[SERVER] Out of: ${organizations.length} we had: ${unflaggedOrganizations.length} unflagged organizations, that produced: ${validationErrors.length} validation errors. Currently we have: ${processedOrganizations.length} processed organizations`,
  );
  if (validationErrors.length) {
    return new Command({
      update: {
        validationErrors,
        organizations: organizationsWithValidationErrors,
        processedOrganizations: organizationsWithoutValidationErrors,
      },
      goto: "analyze",
    });
  }

  return new Command({
    goto: END,
    update: {
      processedOrganizations: organizations,
    },
  });
};

/**
 * Analyzes the dataset for quality issues
 */
const analyzeData = async (state: typeof GameStateAnnotation.State) => {
  const { organizations, columns, validationErrors } = state;

  console.log(
    `[SERVER] Starting data analysis for ${organizations.length} rows`,
  );
  console.log(`[SERVER] Dataset columns: ${columns.join(", ")}`);

  // Calculate size metrics
  const dataJsonSize = JSON.stringify(organizations).length;
  const estimatedTokens = dataJsonSize / 4; // Rough approximation: 4 chars ≈ 1 token

  console.log(
    `[SERVER] Dataset size: ${(dataJsonSize / (1024 * 1024)).toFixed(2)}MB, ~${(estimatedTokens / 1000).toFixed(2)}K tokens`,
  );
  console.log(
    `[SERVER] Sending ${organizations.length} rows to model for analysis`,
  );

  const validationErrorIssues = validationErrors.flatMap((ve) => ve.issues);
  console.log(validationErrorIssues);

  // Prepare messages for the model
  const messages = [
    new HumanMessage({
      content: `You are a data scientist tasked with analyzing a dataset for cleaning issues and providing a detailed fix for each issue. Identify quality problems and suggest corrective actions based on the rules below.
      
      Dataset summary:
      - Rows: ${organizations.length}
      - Columns: ${columns.join(", ")}
      
      Complete dataset:
      ${JSON.stringify(organizations, null, 2)}

      ${
        validationErrors?.length
          ? `Validation errors:
      ${JSON.stringify(validationErrors, null, 2)}`
          : ""
      }
      
      This dataset is expected to conform to an organization schema with the following rules:

      1. Only Lithuanian records are supported. Flag rows from other countries with: "Only Lithuania supported".
      2. vatCode must be numeric only (remove any country prefixes such as LT/EE/LV) and can be null.
      3. The country field must be "Lithuania".
      3. Organization type must be one of the following standard organization types: (it can be either organization type like "MB" or the full name like "Mažoji bendrija", however for cleaning it should be always converted to the short version)
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
        
      5. IMPORTANT: Don't fill empty values with "Unknown" or other placeholder values, just leave them empty and flag them with reason: "{columnName} should not be empty"
      
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
      
      If you receive validation errors, suggest fixes if they are simple and obey the rules, otherwise flag them.

      NOTE: Description should be highly detailed and specific, it should not only include the problem but always the exact detailed solution. For example if type should be shortened it should specify to which type it should be shortened. If prefix should be removed it should specify which prefix should be removed.
      `,
    }),
  ];

  // Get analysis from the model
  console.log(`[SERVER] Calling analysis model...`);
  const analysis = await analysisModel.invoke(messages);
  console.log(
    `[SERVER] Analysis complete. Found ${analysis.issues.length} issues`,
  );

  console.log(analysis.issues);

  return new Command({
    update: {
      ...state,
      messages: [
        ...state.messages,
        ...messages,
        new AIMessage({ content: JSON.stringify(analysis) }),
      ],
      analysis,
    },
    goto: analysis.issues.length > 0 ? "clean" : "__end__",
  });
};

const cleanData = async (state: typeof GameStateAnnotation.State) => {
  const { organizations, analysis, validationErrors } = state;

  console.log(`[SERVER] Starting data cleaning`);

  console.log(organizations[0]);
  // Prepare messages for the model
  const messages = [
    new HumanMessage({
      content: `You are a data scientist tasked with cleaning a dataset. 
    
      Dataset:
      ${JSON.stringify(organizations, null, 2)}

      Analysis of the dataset:
      ${JSON.stringify(analysis, null, 2)}

      ${
        validationErrors?.length
          ? `Validation errors:
      ${JSON.stringify(validationErrors, null, 2)}`
          : ""
      }

      Additional notes:
      - If you flag row's columns, keep their original values, don't delete them
      - IMPORTANT: Don't fill empty values with "Unknown" or other placeholder values, just leave them empty and flag them with reason: "{columnName} should not be empty"
      - Don't come up with new values for the columns, if it's invalid just flag them. Fix it only if it's some slight mutation without changing underlying value.
      
      Your response should be structured data with:
      - A list of updated organizations (cleaned and flagged if needed)
      - A list of actions taken to clean the dataset (make sure its super detailed, it should include which rows are affected by which action and what actions were taken precisely)
      - A list of flagged organizations that should be reviewed manually (organizations you could not clean obeying the rules)`,
    }),
  ];

  // Get analysis from the model
  console.log(`[SERVER] Calling cleaning model...`);
  const cleanedData = await cleaningModel.invoke(messages);
  console.log(`[SERVER] Cleaning complete`);
  console.log(cleanedData.actionsPerformed);
  console.log(cleanedData.cleanedData[0]);
  console.log(`[SERVER] Flagged rows: ${cleanedData.flaggedRows.length}`);
  console.log(`[SERVER] Cleaned rows: ${cleanedData.cleanedData.length}`);

  return new Command({
    update: {
      ...state,
      messages: [
        ...state.messages,
        ...messages,
        new AIMessage({ content: JSON.stringify(analysis) }),
      ],
      organizations: cleanedData.cleanedData,
      actionsPerformed: cleanedData.actionsPerformed,
      flaggedRows: cleanedData.flaggedRows,
    },
  });
};

export async function POST(req: NextRequest) {
  console.log(`[SERVER] Received data cleaner request`);

  try {
    const body = await req.json();
    console.log(
      `[SERVER] Request body received: ${JSON.stringify({
        action: body.action,
        dataLength: body.data?.length || 0,
        columns: body.columns?.length || 0,
      })}`,
    );

    const { data, columns } = body;

    // Calculate size metrics for feedback to user
    const dataSize = data ? JSON.stringify(data).length : 0;
    const estimatedTokens = dataSize / 4;
    const isLargeDataset = dataSize > 1024 * 1024 * 2; // 2MB threshold

    console.log(
      `[SERVER] Dataset info: ${data?.length || 0} rows, ${(dataSize / (1024 * 1024)).toFixed(2)}MB`,
    );

    // Provide warning for very large datasets
    if (isLargeDataset) {
      console.warn(
        `[SERVER] Large dataset detected: ${(dataSize / (1024 * 1024)).toFixed(2)}MB, ~${(estimatedTokens / 1000).toFixed(2)}K tokens`,
      );
    }

    console.log(`[SERVER] Performing data cleanup...`);

    const graph = new StateGraph(GameStateAnnotation)
      .addNode("analyze", analyzeData, {})
      .addNode("clean", cleanData, {})
      .addNode("shouldSummarizeOrCleanMore", shouldSummarizeOrCleanMore, {})

      .addEdge("__start__", "analyze")
      .addEdge("analyze", "clean")
      .addEdge("clean", "shouldSummarizeOrCleanMore")
      .compile();

    const result = await graph.invoke({
      messages: [],
      organizations: data,
      columns: columns,
      analysis: null,
      actionsPerformed: [],
      flaggedRows: [],
      validationErrors: [],
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
