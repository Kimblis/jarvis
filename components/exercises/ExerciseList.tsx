"use client";

import { useState } from "react";
import { Exercise, ExerciseFeedback } from "./types";
import ExerciseItem from "./ExerciseItem";
import ProgressBar from "./ProgressBar";

interface ExerciseListProps {
  exercises: Exercise[];
  onCompleteAll?: (completedExercises: string[]) => void;
}

const ExerciseList = ({ exercises, onCompleteAll }: ExerciseListProps) => {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [completedExercises, setCompletedExercises] = useState<string[]>([]);

  const currentExercise = exercises[currentExerciseIndex];
  const isLastExercise = currentExerciseIndex === exercises.length - 1;
  const allCompleted = completedExercises.length === exercises.length;

  const handleSubmit = async (value: string): Promise<ExerciseFeedback> => {
    try {
      let isCorrect = value === currentExercise.answer;
      if (!isCorrect) {
        // Check via AI
        const response = await fetch("/api/exercise/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            exercise: currentExercise,
            answer: value,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to submit answer");
        }

        const result = await response.json();
        isCorrect = result.isCorrect;
      }

      const feedback: ExerciseFeedback = {
        isCorrect: isCorrect,
        message: isCorrect
          ? "Correct! Great job! 🎉"
          : "Not quite right. Check the correct answer below:",
        correctAnswer: isCorrect ? undefined : currentExercise.answer,
      };

      // Mark exercise as completed if correct
      if (isCorrect && !completedExercises.includes(currentExercise.id)) {
        setCompletedExercises((prev) => [...prev, currentExercise.id]);
      }

      return feedback;
    } catch (err) {
      console.error("Error submitting answer:", err);

      // Fallback to client-side validation in case of API error
      const isCorrect =
        value.trim().toLowerCase() ===
        currentExercise.answer.trim().toLowerCase();

      if (isCorrect && !completedExercises.includes(currentExercise.id)) {
        setCompletedExercises((prev) => [...prev, currentExercise.id]);
      }

      return {
        isCorrect,
        message: isCorrect
          ? "Correct! Great job! 🎉"
          : "Not quite right. Check the correct answer below:",
        correctAnswer: isCorrect ? undefined : currentExercise.answer,
      };
    }
  };

  const handleContinue = () => {
    if (isLastExercise) {
      // If all exercises are completed and there's a callback, call it
      if (allCompleted && onCompleteAll) {
        onCompleteAll(completedExercises);
      }
      return;
    }

    // Move to next exercise
    setCurrentExerciseIndex((prev) => prev + 1);
  };

  return (
    <div className="w-full flex flex-col gap-4">
      <ProgressBar
        current={currentExerciseIndex + 1}
        total={exercises.length}
        completed={completedExercises.length}
      />

      {currentExercise ? (
        <ExerciseItem
          exercise={currentExercise}
          onSubmit={handleSubmit}
          onContinue={handleContinue}
          key={currentExercise.id}
        />
      ) : (
        <div className="p-4 bg-gray-100 rounded-md text-center">
          No exercises available.
        </div>
      )}
    </div>
  );
};

export default ExerciseList;
