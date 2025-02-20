import { NextRequest, NextResponse } from "next/server";
import { StreamingTextResponse } from "ai";

import { createClient } from "@supabase/supabase-js";

import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { Document } from "@langchain/core/documents";
import { RunnableSequence } from "@langchain/core/runnables";
import {
  BytesOutputParser,
  StringOutputParser,
} from "@langchain/core/output_parsers";
import {
  ANSWER_TEMPLATE,
  ASSESSMENT_TEMPLATE,
  CONDENSE_QUESTION_TEMPLATE,
} from "@/utils/templates";
import { combineDocumentsFn, formatVercelMessages } from "@/utils/messageUtils";
import { AssessmentState } from "@/utils/types";

export const runtime = "edge";

const condenseQuestionPrompt = PromptTemplate.fromTemplate(
  CONDENSE_QUESTION_TEMPLATE,
);

const answerPrompt = PromptTemplate.fromTemplate(ASSESSMENT_TEMPLATE);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages = body.messages ?? [];
    const previousMessages = messages.slice(0, -1);
    const data = body.data ?? {};
    console.log("data", data);
    const grade = data.grade;
    const assessmentState = data.assessmentState;
    console.log("assessmentState", assessmentState);
    const currentMessageContent = messages[messages.length - 1].content;

    const model = new ChatOpenAI({
      model: "gpt-4o-mini",
      temperature: 0.001,
    });

    if (assessmentState === AssessmentState.INITIALIZATION) {
      console.log(" im here");
      return new Response("Please enter your grade (5-12).", {
        headers: {
          "x-message-index": (messages.length + 1).toString(),
        },
      });
    }

    if (assessmentState === AssessmentState.GRADE_SELECTION) {
      if (typeof grade !== "number" || grade < 5 || grade > 12)
        return new Response("Enter a valid grade (5-12).", {
          headers: {
            "x-message-index": (messages.length + 1).toString(),
          },
        });

      return new Response(
        `Great, you are in grade ${grade}. Let's continue with the assessment. Once you're ready just tell me and we gonna get started. When you wanna finish the test just tell me "I'm done" or "I'm finished"`,
        {
          headers: {
            "x-message-index": (messages.length + 1).toString(),
          },
        },
      );
    }

    const client = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PRIVATE_KEY!,
    );
    const exerciseVectorStore = new SupabaseVectorStore(
      new OpenAIEmbeddings(),
      {
        client,
        tableName: "exercise",
        queryName: "match_exercise",
      },
    );

    const exerciseRetriever = exerciseVectorStore.asRetriever();
    const documents: Document[] = await exerciseRetriever.invoke(
      `grade ${grade}`,
    );

    const standaloneQuestionChain = RunnableSequence.from([
      condenseQuestionPrompt,
      model,
      new StringOutputParser(),
    ]);

    const answerChain = RunnableSequence.from([
      {
        context: RunnableSequence.from([
          (input) => input.question,
          exerciseRetriever,
        ]),
        chat_history: (input) => input.chat_history,
        question: (input) => input.question,
      },
      answerPrompt,
      model,
    ]);

    const conversationalRetrievalQAChain = RunnableSequence.from([
      {
        question: standaloneQuestionChain,
        chat_history: (input) => input.chat_history,
      },
      answerChain,
      new BytesOutputParser(),
    ]);

    const stream = await conversationalRetrievalQAChain.stream({
      question: currentMessageContent,
      chat_history: formatVercelMessages(previousMessages),
    });

    const serializedSources = Buffer.from(JSON.stringify(documents)).toString(
      "base64",
    );

    return new StreamingTextResponse(stream, {
      headers: {
        "x-message-index": (previousMessages.length + 1).toString(),
        "x-sources": serializedSources,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 });
  }
}
