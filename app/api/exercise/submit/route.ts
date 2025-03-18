import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_PRIVATE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { exerciseId, answer } = body;

    if (!exerciseId || !answer) {
      return NextResponse.json(
        { error: "Exercise ID and answer are required" },
        { status: 400 },
      );
    }

    // Check if the exercise exists
    const { data: exercise, error: exerciseError } = await supabase
      .from("exercise")
      .select("*")
      .eq("id", exerciseId)
      .single();

    if (exerciseError) {
      return NextResponse.json(
        { error: `Exercise not found: ${exerciseError.message}` },
        { status: 404 },
      );
    }

    // Store the user's answer
    // You may want to adjust this based on your actual database schema
    const { data, error } = await supabase
      .from("user_answers")
      .insert({
        exercise_id: exerciseId,
        user_answer: answer,
        submitted_at: new Date().toISOString(),
        // Add user ID if you have authentication
        // user_id: userId
      })
      .select();

    if (error) {
      console.error("Error submitting answer:", error);
      return NextResponse.json(
        { error: `Failed to submit answer: ${error.message}` },
        { status: 500 },
      );
    }

    // Check if the answer is correct (simplified version)
    const isCorrect =
      exercise.answer && answer.trim() === exercise.answer.trim();

    return NextResponse.json({
      success: true,
      submission: data[0],
      isCorrect,
      correctAnswer: isCorrect ? null : exercise.answer, // Only send correct answer if wrong
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
