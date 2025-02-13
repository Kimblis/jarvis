import {
  exercisePromptTemplateStr,
  solutionPromptTemplateStr,
} from "@/utils/prompts";
import {
  initializeAlgebraSession,
  loadAlgebraExerciseText,
  loadAlgebraSolution,
} from "@/utils/syncAlgebraExercises";
import { ExerciseResponse } from "@/utils/types";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { createClient } from "@supabase/supabase-js";
import { NextResponse, NextRequest } from "next/server";

const supabaseClient = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_PRIVATE_KEY!,
);

export const POST = async (
  req: NextRequest,
  { params }: { params: Promise<Record<string, string>> },
) => {
  const { exerciseId } = await params;

  if (!exerciseId || Array.isArray(exerciseId)) {
    return NextResponse.json(
      { error: "Exercise ID is required and must be a single string" },
      { status: 400 },
    );
  }

  try {
    const sessionId = await initializeAlgebraSession(exerciseId);
    console.log(`sessionId: ${sessionId}`);
    const exerciseText = await loadAlgebraExerciseText(sessionId);
    const solutionElementsWithSkills = await loadAlgebraSolution(sessionId);
    let solutionText = "";
    if (solutionElementsWithSkills?.elements.length) {
      const prompt = ChatPromptTemplate.fromTemplate(solutionPromptTemplateStr);
      const llm = new ChatOpenAI({ temperature: 0 });
      const chain = prompt.pipe(llm);
      const response = await chain.invoke({
        sessionJson: JSON.stringify(solutionElementsWithSkills.elements),
      });
      solutionText = response.content as string;
    }
    const prompt = ChatPromptTemplate.fromTemplate(exercisePromptTemplateStr);
    const llm = new ChatOpenAI({ temperature: 0 });
    const chain = prompt.pipe(llm);
    const response = await chain.invoke({ exerciseText });

    const parsedResponse = JSON.parse(response.content as string);
    console.log(parsedResponse);

    // const embeddings = new OpenAIEmbeddings();
    // const embeddingVector = await embeddings.embedQuery(
    //   response.content as string,
    // );

    // await supabaseClient.from("exercise").insert({
    //   ...parsedResponse,
    //   id: exerciseId,
    //   embedding: embeddingVector,
    // });

    return NextResponse.json(
      {
        text: exerciseText,
        solutionText,
        solutionSkills: solutionElementsWithSkills?.skills || "",
        ...parsedResponse,
      } as ExerciseResponse,
      { status: 200 },
    );
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: "An error occurred!" }, { status: 500 });
  }
};
