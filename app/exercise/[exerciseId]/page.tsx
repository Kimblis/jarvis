"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ExerciseResponse } from "@/utils/types";
import Image from "next/image";
import Latex from "react-latex-next";

const ExercisePageById = () => {
  const { exerciseId } = useParams();
  const [exerciseData, setExerciseData] = useState<ExerciseResponse | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!exerciseId) {
      setError("No Exercise ID provided");
      return;
    }

    const fetchExerciseData = async () => {
      setIsLoading(true);
      try {
        // Call the API route using fetch
        const res = await fetch(`/api/exercise/${exerciseId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (!res.ok) {
          throw new Error(`Failed to fetch data: ${res.statusText}`);
        }
        const data = (await res.json()) as ExerciseResponse;

        setExerciseData(data);
      } catch (error: any) {
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    // Fetch data when the component mounts
    fetchExerciseData();
  }, [exerciseId]);

  if (isLoading) return <div>Loading exercise...</div>;

  if (error) {
    return <div>Error: {error}</div>;
  }

  const solutionSteps = exerciseData?.solutionText.split("{step}");

  return (
    <div>
      {exerciseData && (
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-1">
            <span>Original text</span>
            <div>{exerciseData.text}</div>
          </div>
          <div className="flex flex-col gap-1">
            <span>Formatted condition</span>
            <Latex>{exerciseData.condition}</Latex>
          </div>
          <div className="flex flex-col gap-1">
            <span>Topic</span>
            <div>{exerciseData.topic}</div>
          </div>
          <div className="flex flex-col gap-1">
            <span>Template</span>
            <Latex>{exerciseData.template}</Latex>
          </div>

          <div className="flex flex-col gap-1">
            <span>Solution</span>
            <div className="flex flex-col gap-1">
              {solutionSteps?.map((step, index) => (
                <Latex key={index}>{step}</Latex>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span>Solution skills</span>
            <div>{exerciseData.solutionSkills}</div>
          </div>

          <div className="flex flex-col gap-1">
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

export default ExercisePageById;
