"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { Exercise, ExerciseFeedback, ExerciseType } from "./types";
import {
  OpenInputExercise,
  ChoiceExercise,
  MultipleChoiceExercise,
  CorrectAnswerDisplay,
} from "./exerciseTypes";

// Import MathLive dynamically with no SSR
const MathLiveImport = dynamic(
  () => import("mathlive").then(() => ({ default: () => null })),
  { ssr: false },
);

interface ExerciseItemProps {
  exercise: Exercise;
  onSubmit: (value: string) => Promise<ExerciseFeedback>;
  onContinue: () => void;
}

// Base component for all exercise types
const ExerciseItem = ({
  exercise,
  onSubmit,
  onContinue,
}: ExerciseItemProps) => {
  // Common state for all exercise types
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<ExerciseFeedback | null>(null);

  // Reset state when exercise changes
  useEffect(() => {
    setValue("");
    setFeedback(null);
  }, [exercise]);

  // Common submission handler
  const handleSubmit = async () => {
    if (!value.trim()) {
      alert("Please provide an answer");
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    try {
      const result = await onSubmit(value);
      setFeedback(result);
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

  // Common continue handler
  const handleContinue = () => {
    setValue("");
    setFeedback(null);
    onContinue();
  };

  // Determine which exercise component to render based on type
  const renderExerciseComponent = () => {
    switch (exercise.type) {
      case "open-input":
        return (
          <OpenInputExercise
            exercise={exercise}
            value={value}
            setValue={setValue}
            feedback={feedback}
            onSubmit={handleSubmit}
          />
        );
      case "choice":
        return (
          <ChoiceExercise
            exercise={exercise}
            value={value}
            setValue={setValue}
            feedback={feedback}
          />
        );
      case "multiple-choice":
        return (
          <MultipleChoiceExercise
            exercise={exercise}
            value={value}
            setValue={setValue}
            feedback={feedback}
          />
        );
      default:
        console.warn(
          `Unknown exercise type: ${exercise.type}, defaulting to open-input`,
        );
        return (
          <OpenInputExercise
            exercise={exercise}
            value={value}
            setValue={setValue}
            feedback={feedback}
            onSubmit={handleSubmit}
          />
        );
    }
  };

  return (
    <>
      {/* Load MathLive dynamically */}
      <MathLiveImport />

      {/* Render the specific exercise component */}
      {renderExerciseComponent()}

      {/* Common submit button area */}
      <div className="mt-2 flex justify-between items-center">
        <code className="bg-gray-100 p-2 rounded">
          {exercise.type === "choice" || exercise.type === "multiple-choice"
            ? `Selected: ${value || "None"}`
            : `LaTeX: ${value}`}
        </code>
        <button
          onClick={handleSubmit}
          disabled={submitting || !!feedback}
          className={`px-4 py-2 ${
            submitting || !!feedback
              ? "bg-gray-400"
              : "bg-blue-500 hover:bg-blue-600"
          } text-white rounded transition`}
          aria-label="Submit your answer"
          tabIndex={0}
          onKeyDown={(e) =>
            e.key === "Enter" && !submitting && !feedback && handleSubmit()
          }
        >
          {submitting ? "Submitting..." : "Submit Answer"}
        </button>
      </div>

      {/* Feedback area */}
      {feedback && (
        <div
          className={`mt-4 p-4 rounded-md ${
            feedback.isCorrect
              ? "bg-green-100 border border-green-300"
              : "bg-red-100 border border-red-300"
          }`}
        >
          <p className="font-semibold mb-2 text-black">{feedback.message}</p>

          {feedback.correctAnswer && (
            <div className="mt-2">
              <p className="text-sm font-medium mb-1">Correct Answer:</p>
              <CorrectAnswerDisplay answer={feedback.correctAnswer} />
            </div>
          )}

          <div className="mt-4 flex justify-end">
            <button
              onClick={handleContinue}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded transition"
              aria-label="Continue to next exercise"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && handleContinue()}
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ExerciseItem;
