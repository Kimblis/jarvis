"use client";

import { MathfieldElement } from "@/utils/types";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

// Import MathLive dynamically with no SSR
const MathLiveImport = dynamic(
  () => import("mathlive").then(() => ({ default: () => null })),
  { ssr: false },
);

const Protau = () => {
  const searchParams = useSearchParams();
  const exerciseId =
    searchParams.get("id") || "1a0e8aab-3c6f-4593-9f48-d3efd3f84ba2";

  // For the exercise content
  const [exercise, setExercise] = useState({ question: "", answers: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // For the user input
  const [value, setValue] = useState("");
  const [inputValue, setInputValue] = useState("");

  // For submission feedback
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    isCorrect?: boolean;
    message: string;
    correctAnswer?: string;
  } | null>(null);

  // Refs for both mathfields
  const exerciseMf = useRef<MathfieldElement>(null);
  const userInputMf = useRef<MathfieldElement>(null);
  const correctAnswerMf = useRef<MathfieldElement>(null);

  // Fetch exercise data
  useEffect(() => {
    const fetchExercise = async () => {
      setLoading(true);
      setError(null);
      setFeedback(null);

      try {
        const response = await fetch(`/api/exercise?id=${exerciseId}`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch exercise");
        }

        const data = await response.json();

        setExercise({
          question: data.condition || "\\text{Question not available}",
          answers: data.answers || "",
        });

        // Set the initial user input to empty
        setValue("");
        setInputValue("");
      } catch (err) {
        console.error("Error in fetching exercise:", err);
        setError(
          err instanceof Error ? err.message : "An unexpected error occurred",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchExercise();
  }, [exerciseId]);

  // Configure mathfields
  useEffect(() => {
    if (loading) return;

    // Exercise mathfield (read-only)
    if (exerciseMf.current) {
      exerciseMf.current.readonly = true;
      exerciseMf.current.smartFence = true;
      exerciseMf.current.smartMode = true;
      exerciseMf.current.smartSuperscript = true;
    }

    // User input mathfield
    if (userInputMf.current) {
      userInputMf.current.smartFence = true;
      userInputMf.current.smartMode = true;
      userInputMf.current.smartSuperscript = true;
    }

    // Correct answer mathfield (if shown)
    if (correctAnswerMf.current) {
      correctAnswerMf.current.readonly = true;
      correctAnswerMf.current.smartFence = true;
      correctAnswerMf.current.smartMode = true;
      correctAnswerMf.current.smartSuperscript = true;
    }
  }, [loading]);

  // Update user input mathfield when the value changes
  useEffect(() => {
    if (!userInputMf.current || value === inputValue) return;
    userInputMf.current.value = value;
  }, [value, inputValue]);

  // Handle user input
  const handleInput = (evt: React.ChangeEvent<HTMLElement>) => {
    const newValue = (evt.target as any).value;
    setInputValue(newValue);
    setValue(newValue);

    // Clear feedback when user starts typing again
    if (feedback) {
      setFeedback(null);
    }
  };

  // Handle answer submission
  const handleSubmit = async () => {
    if (!value.trim()) {
      alert("Please enter your answer");
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/exercise/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exerciseId,
          answer: value,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit answer");
      }

      const result = await response.json();

      setFeedback({
        isCorrect: result.isCorrect,
        message: result.isCorrect
          ? "Correct! Great job! 🎉"
          : "Not quite right. Check the correct answer below:",
        correctAnswer: result.correctAnswer,
      });
    } catch (err) {
      console.error("Error submitting answer:", err);
      setFeedback({
        isCorrect: false,
        message: "Error submitting answer. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full p-4 flex flex-col gap-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Math Exercise</h1>

      {/* Load MathLive dynamically */}
      <MathLiveImport />

      {loading ? (
        <div className="p-4 text-center">Loading exercise...</div>
      ) : error ? (
        <div className="p-4 text-center text-red-500">{error}</div>
      ) : (
        <>
          <div className="bg-gray-100 p-4 rounded-md">
            <h2 className="font-semibold mb-2">Problem:</h2>
            <math-field
              ref={exerciseMf}
              className="w-full bg-white p-3 rounded-md border"
              // @ts-ignore
              readonly
            >
              {exercise.question}
            </math-field>
          </div>

          <div className="bg-gray-100 p-4 rounded-md">
            <h2 className="font-semibold mb-2">Your Answer:</h2>
            <math-field
              ref={userInputMf}
              onInput={handleInput}
              className="w-full bg-white p-3 rounded-md border min-h-[100px]"
            >
              {value}
            </math-field>
          </div>

          <div className="mt-2 flex justify-between items-center">
            <code className="bg-gray-100 p-2 rounded">LaTeX: {value}</code>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className={`px-4 py-2 ${
                submitting ? "bg-gray-400" : "bg-blue-500 hover:bg-blue-600"
              } text-white rounded transition`}
            >
              {submitting ? "Submitting..." : "Submit Answer"}
            </button>
          </div>

          {feedback && (
            <div
              className={`mt-4 p-4 rounded-md ${
                feedback.isCorrect
                  ? "bg-green-100 border border-green-300"
                  : "bg-red-100 border border-red-300"
              }`}
            >
              <p className="font-semibold mb-2">{feedback.message}</p>

              {feedback.correctAnswer && (
                <div className="mt-2">
                  <p className="text-sm font-medium mb-1">Correct Answer:</p>
                  <math-field
                    ref={correctAnswerMf}
                    className="w-full bg-white p-3 rounded-md border"
                  >
                    {feedback.correctAnswer}
                  </math-field>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Protau;
