"use client";

import { MathfieldElement } from "@/utils/types";
import { Exercise, ExerciseFeedback } from "../types";
import { useEffect, useRef, useState } from "react";

interface ChoiceExerciseProps {
  exercise: Exercise;
  value: string;
  setValue: (value: string) => void;
  feedback: ExerciseFeedback | null;
}

const ChoiceExercise = ({
  exercise,
  value,
  setValue,
  feedback,
}: ChoiceExerciseProps) => {
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const exerciseMf = useRef<MathfieldElement>(null);

  // Sync with parent value
  useEffect(() => {
    if (value && value !== selectedChoice) {
      setSelectedChoice(value);
    }
  }, [value, selectedChoice]);

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

  // Handle choice selection
  const handleChoiceSelect = (letter: string) => {
    setSelectedChoice(letter);
    setValue(letter);
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

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          {exercise.options.map((choice) => (
            <button
              key={choice.letter}
              onClick={() => handleChoiceSelect(choice.letter)}
              className={`p-3 border rounded-md flex items-center transition-colors cursor-pointer w-full
                ${
                  selectedChoice === choice.letter
                    ? "bg-blue-100 border-blue-500"
                    : "bg-white hover:bg-gray-50"
                }`}
              aria-label={`Select option ${choice.letter}`}
              tabIndex={0}
              onKeyDown={(e) =>
                e.key === "Enter" && handleChoiceSelect(choice.letter)
              }
            >
              <span
                className={`flex items-center justify-center w-8 h-8 rounded-full text-gray-800 font-medium mr-3 ${
                  selectedChoice === choice.letter
                    ? "bg-blue-300 text-blue-800"
                    : "bg-gray-200"
                }`}
              >
                {choice.letter}
              </span>
              <div className="flex-1 w-full relative">
                <math-field
                  className={`w-full ${
                    selectedChoice === choice.letter
                      ? "bg-blue-100"
                      : "bg-transparent"
                  }`}
                  // @ts-ignore
                  readonly
                >
                  {choice.value}
                </math-field>
                <div
                  className="absolute inset-0 cursor-pointer"
                  onClick={() => handleChoiceSelect(choice.letter)}
                  aria-hidden="true"
                ></div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChoiceExercise;
