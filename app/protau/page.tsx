"use client";

import { v4 as uuidv4 } from "uuid";
import { useEffect, useState } from "react";
import {
  CompletionSummary,
  ExerciseList,
  Exercise,
} from "@/components/exercises";

const exercisesMocks: Exercise[] = [
  {
    id: uuidv4(),
    condition: `\\text{Su kuriomis }k\\text{ reikšmėmis lygtis }kx+k+x^2=0\\text{ turi du sprendinius?}`,
    // answer: "k<0 or k>4",
    answer: "[-∞; 0) ∪ (4; ∞]",
    type: "open-input",
  },
  {
    id: uuidv4(),
    condition: `\\text{Kiek bus }2+2\\text{?}`,
    answer: "4",
    type: "open-input",
  },
  {
    id: uuidv4(),
    condition: `\\text{Pasirink teisingą variantą } 2+2=?`,
    answer: "B",
    type: "choice",
    options: [
      { letter: "A", value: "2" },
      { letter: "B", value: "4" },
      { letter: "C", value: "6" },
      { letter: "D", value: "8" },
    ],
  },
  {
    id: uuidv4(),
    condition: `\\text{Kurios lygybės yra teisingos? }`,
    answer: "A,C",
    type: "multiple-choice",
    options: [
      {
        letter: "A",
        value: "2 > 1",
      },
      {
        letter: "B",
        value: "2 < 1",
      },
      {
        letter: "C",
        value: "4 > 3",
      },
      {
        letter: "D",
        value: "4 < 3",
      },
    ],
  },
];

const Protau = () => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allCompleted, setAllCompleted] = useState(false);
  const [completedExercises, setCompletedExercises] = useState<string[]>([]);

  // Fetch exercises data - using mock for now
  useEffect(() => {
    const fetchExercises = async () => {
      setLoading(true);
      setError(null);

      try {
        // Here you would fetch from your API
        // const response = await fetch('/api/exercises');
        // const data = await response.json();

        // Using mock data for now
        setExercises(exercisesMocks);
      } catch (err) {
        console.error("Error in fetching exercises:", err);
        setError(
          err instanceof Error ? err.message : "An unexpected error occurred",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchExercises();
  }, []);

  const handleCompleteAll = (completed: string[]) => {
    setAllCompleted(true);
    setCompletedExercises(completed);

    console.log("All exercises completed!");
  };

  const handleRestart = () => {
    setAllCompleted(false);
    setCompletedExercises([]);
  };

  return (
    <div className="w-full p-4 flex flex-col gap-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Math Exercise</h1>

      {loading ? (
        <div className="p-4 text-center">Loading exercises...</div>
      ) : error ? (
        <div className="p-4 text-center text-red-500">{error}</div>
      ) : allCompleted ? (
        <CompletionSummary
          exercises={exercises}
          completedExercises={completedExercises}
          onRestart={handleRestart}
        />
      ) : (
        <ExerciseList
          exercises={exercises}
          onCompleteAll={(completed) => handleCompleteAll(completed)}
        />
      )}
    </div>
  );
};

export default Protau;
