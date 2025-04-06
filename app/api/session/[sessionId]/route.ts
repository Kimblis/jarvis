import { sessionInfoPromptTemplateStr } from "@/utils/prompts";
import { seedPublicTestSessions } from "@/utils/seedPublicTestSessions";
import { loadAlgebraSessionInfo } from "@/utils/syncAlgebraExercises";
import { sessionInfoResponseSchema } from "@/utils/types";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
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
  const { sessionId } = await params;

  if (!sessionId || Array.isArray(sessionId)) {
    return NextResponse.json(
      { error: "Session ID is required and must be a single string" },
      { status: 400 },
    );
  }

  try {
    const sessionInfoElements = await loadAlgebraSessionInfo(sessionId);
    if (!sessionInfoElements.length) {
      return NextResponse.json(
        { error: "Session info had no elements" },
        { status: 404 },
      );
    }

    const prompt = ChatPromptTemplate.fromTemplate(
      sessionInfoPromptTemplateStr,
    );
    const llm = new ChatOpenAI({
      temperature: 0,
      model: "gpt-4o-mini",
    }).withStructuredOutput(sessionInfoResponseSchema, {
      method: "jsonSchema",
      strict: true,
    });
    const chain = prompt.pipe(llm);
    const response = await chain.invoke({ sessionInfo: sessionInfoElements });

    await supabaseClient.from("session").upsert(
      {
        ...response,
        id: sessionId,
      },
      {
        onConflict: "id",
      },
    );

    await seedPublicTestSessions();

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: "An error occurred!" }, { status: 500 });
  }
};
