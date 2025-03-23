import { Exercise } from "@/components/exercises";
import { evaluateExerciseTemplate } from "@/utils/prompts";
import { evaluateExerciseResponseSchema } from "@/utils/types";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_PRIVATE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

const checkForSimpleAnswer = (exercise: Exercise, answer: string) => {
  return answer === exercise.answer;
};

const checkForMultipleChoiceAnswer = (exercise: Exercise, answer: string) => {
  const studentAnswers = answer
    .split(",")
    .map((a) => a.trim())
    .sort();

  const correctAnswers = exercise.answer
    .split(",")
    .map((a) => a.trim())
    .sort();

  if (studentAnswers.length !== correctAnswers.length) return false;

  return studentAnswers.every((val, index) => val === correctAnswers[index]);
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { exercise, answer } = body;

    const { condition, answer: correctAnswer, type } = exercise as Exercise;
    if (!condition || !answer) {
      return NextResponse.json(
        { error: "Exercise condition and answer are required" },
        { status: 400 },
      );
    }

    // Check if we can determine correctness without using the LLM
    let isCorrect = false;

    const isMultipleChoice = type === "multiple-choice";
    const isChoice = type === "choice";
    if (isMultipleChoice) {
      isCorrect = checkForMultipleChoiceAnswer(exercise, answer);
    } else {
      isCorrect = checkForSimpleAnswer(exercise, answer);

      if (!isCorrect && !isChoice) {
        console.log("Using LLM to evaluate exercise");
        // For complex answers, use LLM evaluation
        const prompt = ChatPromptTemplate.fromTemplate(
          evaluateExerciseTemplate,
        );
        const llm = new ChatGoogleGenerativeAI({
          temperature: 0,
          model: "gemini-2.0-flash",
        }).withStructuredOutput(evaluateExerciseResponseSchema, {
          method: "jsonSchema",
          strict: true,
        });

        const chain = prompt.pipe(llm);
        const response = await chain.invoke({
          condition,
          answer,
          correctAnswer,
        });
        console.log(response);

        isCorrect = response.isCorrect;
      }
    }

    return NextResponse.json({
      success: true,
      isCorrect,
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
