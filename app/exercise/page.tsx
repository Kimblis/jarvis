"use client";

import { Button } from "@/components/ui/button";
import { AnsweredSessionResponse, ExerciseResponse } from "@/utils/types";
import { useState } from "react";
import Image from "next/image";
import Latex from "react-latex-next";

const ExercisePage = () => {
  const [exerciseData, setExerciseData] = useState<ExerciseResponse | null>(
    null,
  );
  const [sessionSolution, setSessionSolution] =
    useState<AnsweredSessionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [inputExerciseId, setInputExerciseId] = useState<string>("");
  const [inputSessionId, setInputSessionId] = useState<string>("");

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
    const data = (await res.json()) as ExerciseResponse;

    setExerciseData(data);
  };

  const handleLoadSessionSolution = async () => {
    const sessionId = inputSessionId.trim();
    if (!sessionId.length) {
      setError("Session ID is required.");
      return;
    }

    setIsLoading(true);
    setError(null);
    const res = await fetch(`/api/session/${sessionId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });
    setIsLoading(false);
    if (!res.ok) {
      throw new Error("Failed to fetch data");
    }
    const data = (await res.json()) as AnsweredSessionResponse;

    setSessionSolution(data);
  };

  if (isLoading) return <div>Loading exercise...</div>;

  if (error) {
    return <div>Error: {error}</div>;
  }

  console.log(sessionSolution);
  return (
    <div className="flex flex-col justify-start items-center h-screen gap-5">
      <div className="flex flex-col items-center gap-5">
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

        <div className="flex flex-col items-center">
          <label htmlFor="sessionIdInput" className="mb-1">
            Session ID
          </label>
          <input
            id="sessionIdInput"
            type="text"
            value={inputSessionId}
            onChange={(e) => setInputSessionId(e.target.value)}
            placeholder="e.g. 0008582e-adec-4770-9145-2473d551325a"
            className="border rounded p-2 mb-4"
          />
          <Button onClick={handleLoadSessionSolution}>
            Load session solution
          </Button>
        </div>
      </div>
      {sessionSolution && (
        <div className="flex flex-col gap-2">
          <div className="flex gap-6 items-start border-t">
            <span>Condition</span>
            <div className="flex flex-col gap-2">
              {sessionSolution.condition
                .split("{interaction}")
                .map((interaction, index) => {
                  return <Latex key={index}>{interaction}</Latex>;
                })}
            </div>
          </div>
          <div className="flex gap-6 items-center border-t">
            <span>Student solution</span>
            <div className="flex flex-col gap-2">
              {sessionSolution.studentSolution
                .split("{interaction}")
                .map((interaction, index) => {
                  return <Latex key={index}>{interaction}</Latex>;
                })}
            </div>
          </div>
          <div className="flex gap-6 items-center border-t">
            <span>Student answer</span>
            <div className="flex flex-col gap-2">
              {sessionSolution.studentAnswer
                .split("{interaction}")
                .map((interaction, index) => {
                  return <Latex key={index}>{interaction}</Latex>;
                })}
            </div>
          </div>
          <div className="flex gap-6 items-center border-t">
            <span>Correct answer</span>
            <div className="flex flex-col gap-2">
              {sessionSolution.correctAnswer
                .split("{interaction}")
                .map((interaction, index) => {
                  return <Latex key={index}>{interaction}</Latex>;
                })}
            </div>
          </div>
          <div className="flex gap-6 items-center border-t">
            <span>Scores total</span>
            <div>{sessionSolution.scoresTotal}</div>
          </div>
          <div className="flex gap-6 items-center border-t">
            <span>Scores earned</span>
            <div>{sessionSolution.scoresEarned}</div>
          </div>
        </div>
      )}
      {exerciseData && (
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <span>Original text</span>
            <div>{exerciseData.text}</div>
          </div>
          <div className="flex gap-2">
            <span>Formatted condition</span>
            <div>{exerciseData.condition}</div>
          </div>
          <div className="flex gap-2">
            <span>Topic</span>
            <div>{exerciseData.topic}</div>
          </div>
          <div className="flex gap-2">
            <span>Template</span>
            <div>{exerciseData.template}</div>
          </div>
          <div className="flex gap-2">
            <span>Solution text</span>
            <div>{exerciseData.solutionText}</div>
          </div>
          <div className="flex gap-2">
            <span>Solution skills</span>
            <div>{exerciseData.solutionSkills}</div>
          </div>
          <div className="flex gap-2">
            <span>Assets</span>
            <div>{JSON.stringify(exerciseData.assets)}</div>
          </div>
          {Object.entries(exerciseData.assets).map(([url, type]) => {
            if (type === "image") {
              return (
                <Image
                  key={url}
                  src={url}
                  className="max-w-[500px] w-auto h-auto"
                  style={{ width: "100%", height: "auto" }}
                  alt="Exercise asset"
                  width={1000}
                  height={1000}
                />
              );
            }
            return null;
          })}
        </div>
      )}
    </div>
  );
};

export default ExercisePage;
