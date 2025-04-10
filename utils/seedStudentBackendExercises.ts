import { createClient } from "@supabase/supabase-js";
import { sleep } from "./sleep";

interface Station {
  id: string;
  isALevel: boolean;
  title: string;
  algebrakitSubjectId: string | null;
  lessonTitle?: string | null;
  lessonId?: string | null;
  grade?: number | null;
  alternativeGrade?: number | null;
  lessonAlgebrakitSubjectId?: string | null;
  lessonIsALevel?: boolean | null;
}

interface Exercise {
  id: string;
  stationId: string;
  difficultyLevel: string;
  isALevel: boolean;
  types: string[];
  explainVideoLink?: string | null;
  tags: string[];
  station: Station | null;
}

const TAKE = 50;

const supabaseClient = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_PRIVATE_KEY!,
);

const fetchExercisePage = async (skip: number): Promise<Exercise[]> => {
  const response = await fetch(
    `https://mokinys-backend.elicejus.lt/exercises?take=${TAKE}&skip=${skip}`,
  );

  return response.json();
};

const upsertLesson = async (station: Station) => {
  if (!station.lessonId) return null;

  const { error } = await supabaseClient.from("lesson").upsert(
    {
      id: station.lessonId,
      title: station.lessonTitle || "",
      grade: station.grade || null,
      updatedAt: new Date().toISOString(),
      isALevel: station.lessonIsALevel || false,
      alternativeGrade: station.alternativeGrade || null,
      algebrakitSubjectId: station.lessonAlgebrakitSubjectId || null,
    },
    {
      onConflict: "id",
    },
  );

  if (error) {
    console.error("Error upserting lesson:", error);
    return null;
  }

  return station.lessonId;
};

const upsertStation = async (station: Station) => {
  const { error } = await supabaseClient.from("station").upsert(
    {
      id: station.id,
      lessonId: station.lessonId || null,
      title: station.title,
      updatedAt: new Date().toISOString(),
      isALevel: station.isALevel,
      algebrakitSubjectId: station.algebrakitSubjectId,
    },
    {
      onConflict: "id",
    },
  );

  if (error) {
    console.error("Error upserting station:", error);
    return false;
  }

  return true;
};

const createAlgebraExercise = async (exercise: Exercise) => {
  const { error } = await supabaseClient.from("algebra_exercise").insert({
    id: exercise.id,
    stationId: exercise.stationId,
    difficultyLevel: exercise.difficultyLevel,
    isALevel: exercise.isALevel,
    types: exercise.types,
    explainVideoLink: exercise.explainVideoLink,
    tags: exercise.tags,
    grade: exercise.station?.grade,
    alternativeGrade: exercise.station?.alternativeGrade,
  });

  if (error) {
    console.error("Error creating algebra exercise:", error);
    return false;
  }

  return true;
};

export const seedStudentBackendExercises = async () => {
  let hasMore = true;
  let skip = 0;

  while (hasMore) {
    const exercises = await fetchExercisePage(skip);
    console.log(`Processing ${exercises.length} exercises...`);

    await Promise.all(
      exercises.map(async (exercise) => {
        if (exercise.station) {
          await upsertLesson(exercise.station);
          await upsertStation(exercise.station);
        }

        return createAlgebraExercise(exercise);
      }),
    );

    hasMore = exercises.length === TAKE;
    skip += TAKE;
    console.log(`Processed batch. Will sleep for 10 seconds...`);
    await sleep(10000);
    console.log(`Moving to next ${TAKE} records...`);
  }

  console.log("Seeding completed!");
};
