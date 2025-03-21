"use client";

import { MathfieldElement } from "@/utils/types";
import { Exercise, ExerciseFeedback } from "../types";
import { useEffect, useRef, useState } from "react";

interface MultipleChoiceExerciseProps {
  exercise: Exercise;
  value: string;
  setValue: (value: string) => void;
  feedback: ExerciseFeedback | null;
}

const MultipleChoiceExercise = ({
  exercise,
  value,
  setValue,
  feedback,
}: MultipleChoiceExerciseProps) => {
  const [selectedChoices, setSelectedChoices] = useState<string[]>([]);
  const exerciseMf = useRef<MathfieldElement>(null);

  useEffect(() => {
    if (value && value.includes(",")) {
      const parsedSelections = value.split(",");
      if (
        JSON.stringify(parsedSelections.sort()) !==
        JSON.stringify(selectedChoices.sort())
      ) {
        setSelectedChoices(parsedSelections.sort());
      }
    }
  }, [value, selectedChoices]);

  // Configure mathfields
  useEffect(() => {
    // Exercise mathfield (read-only)
    if (exerciseMf.current) {
      exerciseMf.current.readonly = true;
      exerciseMf.current.smartFence = true;
      exerciseMf.current.smartMode = true;
      exerciseMf.current.smartSuperscript = true;
    }
  }, []);

  // Handle choice selection/deselection
  const handleChoiceToggle = (letter: string) => {
    setSelectedChoices((prev) => {
      const newSelections = prev.includes(letter)
        ? prev.filter((l) => l !== letter)
        : [...prev, letter].sort();

      // Update the value with comma-separated selections
      setValue(newSelections.join(","));
      return newSelections;
    });
  };

  if (!exercise.options?.length) return;

  return (
    <div className="bg-gray-100 p-4 rounded-md">
      <h2 className="font-semibold mb-2">Problem:</h2>
      <div>
        <math-field
          ref={exerciseMf}
          className="w-full bg-white p-3 rounded-md border"
          // @ts-ignore
          readonly
        >
          {exercise.condition}
        </math-field>

        <p className="mt-2 text-sm text-gray-600">Select all that apply:</p>

        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
          {exercise.options.map((choice) => (
            <button
              key={choice.letter}
              onClick={() => handleChoiceToggle(choice.letter)}
              className={`p-3 border rounded-md flex items-center transition-colors
                ${
                  selectedChoices.includes(choice.letter)
                    ? "bg-blue-100 border-blue-500"
                    : "bg-white hover:bg-gray-50"
                }`}
              aria-label={`Toggle option ${choice.letter}`}
              tabIndex={0}
              onKeyDown={(e) =>
                e.key === "Enter" && handleChoiceToggle(choice.letter)
              }
            >
              <span
                className={`flex items-center justify-center w-8 h-8 rounded-md mr-3 
                ${
                  selectedChoices.includes(choice.letter)
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200"
                }`}
              >
                {selectedChoices.includes(choice.letter) ? "✓" : choice.letter}
              </span>
              <math-field
                className="flex-1"
                // @ts-ignore
                readonly
              >
                {choice.value}
              </math-field>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MultipleChoiceExercise;
