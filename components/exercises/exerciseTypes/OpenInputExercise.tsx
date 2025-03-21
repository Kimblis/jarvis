"use client";

import { MathfieldElement } from "@/utils/types";
import { Exercise, ExerciseFeedback } from "../types";
import { useEffect, useRef, useState } from "react";

interface OpenInputExerciseProps {
  exercise: Exercise;
  value: string;
  setValue: (value: string) => void;
  feedback: ExerciseFeedback | null;
  onSubmit: () => void;
}

const OpenInputExercise = ({
  exercise,
  value,
  setValue,
  feedback,
  onSubmit,
}: OpenInputExerciseProps) => {
  const [inputValue, setInputValue] = useState(value);
  const exerciseMf = useRef<MathfieldElement>(null);
  const userInputMf = useRef<MathfieldElement>(null);

  // Configure mathfields on initial render
  useEffect(() => {
    if (exerciseMf.current) {
      exerciseMf.current.readonly = true;
      exerciseMf.current.smartFence = true;
      exerciseMf.current.smartMode = true;
      exerciseMf.current.smartSuperscript = true;
    }

    if (userInputMf.current) {
      userInputMf.current.smartFence = true;
      userInputMf.current.smartMode = true;
      userInputMf.current.smartSuperscript = true;
    }
  }, []);

  useEffect(() => {
    if (!userInputMf.current || value === inputValue) return;
    userInputMf.current.value = value;
  }, [value, inputValue]);

  // Reset input when exercise changes
  useEffect(() => {
    if (userInputMf.current) {
      userInputMf.current.value = "";
      setValue("");
      setInputValue("");
    }
  }, [exercise, setValue]);

  const handleInput = (evt: React.ChangeEvent<HTMLElement>) => {
    const newValue = (evt.target as any).getValue
      ? (evt.target as any).getValue()
      : (evt.target as any).value;

    setInputValue(newValue);
    setValue(newValue);
  };

  const handleKeyDown = (evt: React.KeyboardEvent) => {
    if (evt.key === "Enter" && !evt.shiftKey) {
      evt.preventDefault();
      onSubmit();
    }
  };

  return (
    <>
      <div className="bg-gray-100 p-4 rounded-md">
        <h2 className="font-semibold mb-2">Problem:</h2>
        <math-field
          ref={exerciseMf}
          className="w-full bg-white p-3 rounded-md border"
          // @ts-ignore
          readonly
        >
          {exercise.condition}
        </math-field>
      </div>

      <div className="bg-gray-100 p-4 rounded-md">
        <h2 className="font-semibold mb-2">Your Answer:</h2>
        <math-field
          ref={userInputMf}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          className="w-full bg-white p-3 rounded-md border min-h-[100px]"
        >
          {value}
        </math-field>
      </div>
    </>
  );
};

export default OpenInputExercise;
