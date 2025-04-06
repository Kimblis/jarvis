import fs from "fs";
import path from "path";
import { inngest } from "@/inggest/inngest.client";
import { createClient } from "@supabase/supabase-js";
import { loadAlgebraSessionInfo } from "./syncAlgebraExercises";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { sessionInfoPromptTemplateStr } from "./prompts";
import { ChatOpenAI } from "@langchain/openai";
import { sessionInfoResponseSchema } from "./types";

const supabaseClient = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_PRIVATE_KEY!,
);

export const seedPublicTestSessions = async () => {
  const filePath = path.resolve(
    process.cwd(),
    "test-data/sessionIdsPublicTest.txt",
  );

  const fileContent = fs.readFileSync(filePath, "utf-8");
  const sessionIds = fileContent
    .split("\n")
    .map((id) => id.trim())
    .filter(Boolean);

  const MAX_SESSIONS = 3000;
  const batchSize = 20;

  // Limit sessionIds to the first 3000
  const limitedSessionIds = sessionIds.slice(0, MAX_SESSIONS);
  for (let i = 0; i < limitedSessionIds.length; i += batchSize) {
    const batch = limitedSessionIds.slice(i, i + batchSize);
    console.log(`sending batch ${i} of ${limitedSessionIds.length}`);
    await inngest.send({
      name: "seed/sessions.batch",
      data: { sessionIds: batch },
    });
  }
};

export const seedPublicTestSession = async (sessionId: string) => {
  const sessionInfoElements = await loadAlgebraSessionInfo(sessionId);
  if (!sessionInfoElements.length) return;

  const prompt = ChatPromptTemplate.fromTemplate(sessionInfoPromptTemplateStr);
  const llm = new ChatOpenAI({
    temperature: 0,
    model: "gpt-4o-mini",
  }).withStructuredOutput(sessionInfoResponseSchema, {
    method: "jsonSchema",
    strict: true,
  });
  const chain = prompt.pipe(llm);
  const response = await chain.invoke({ sessionInfo: sessionInfoElements });

  return supabaseClient.from("session").upsert(
    {
      ...response,
      id: sessionId,
    },
    {
      onConflict: "id",
    },
  );
};
