"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";

const ExercisePage = () => {
  const [text, setText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [inputExerciseId, setInputExerciseId] = useState<string>("");

  const handleLoadExercise = async () => {
    const exerciseId = inputExerciseId.trim();
    if (!exerciseId.length) {
      setError("Exercise ID is required.");
      return;
    }

    setIsLoading(true);
    setError(null);
    const res = await fetch(`/api/exercise/${exerciseId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });
    setIsLoading(false);
    if (!res.ok) {
      throw new Error("Failed to fetch data");
    }
    const data = await res.json();
    setText(data.text);
  };

  if (isLoading) return <div>Loading exercise...</div>;

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="flex justify-center items-center h-screen">
      {!text?.length ? (
        <div className="flex flex-col items-center">
          <label htmlFor="exerciseIdInput" className="mb-1">
            Exercise ID
          </label>
          <input
            id="exerciseIdInput"
            type="text"
            value={inputExerciseId}
            onChange={(e) => setInputExerciseId(e.target.value)}
            placeholder="e.g. 0008582e-adec-4770-9145-2473d551325a"
            className="border rounded p-2 mb-4"
          />
          <Button onClick={handleLoadExercise}>Load exercise</Button>
        </div>
      ) : (
        <div>{text}</div>
      )}
    </div>
  );
};

export default ExercisePage;
