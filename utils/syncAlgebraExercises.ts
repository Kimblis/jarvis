import { createClient } from "@supabase/supabase-js";
import { Agent, setGlobalDispatcher } from "undici";
import {
  AlgebraChildrenType,
  AlgebraExerciseState,
  AlgebraKitChildren,
  AlgebraKitPubVersionInfo,
  AlgebraKitSession,
  AlgebraKitSubjectsResponse,
  ExerciseDifficulty,
  ExerciseResponse,
  exerciseResponseSchema,
  ExerciseType,
  ResponseData,
  SessionInfoResponse,
  SolutionResponse,
} from "./types";
import { inngest } from "@/inggest/inngest.client";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import {
  exercisePromptTemplateStr,
  exerciseSyncTemplateStr,
  solutionPromptTemplateStr,
} from "./prompts";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";

const supabaseClient = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_PRIVATE_KEY!,
);

const agent = new Agent({
  connect: { timeout: 30000 },
});
setGlobalDispatcher(agent);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const initializeAlgebraSession = async (exerciseId: string) => {
  const exercises = [{ exerciseId, version: "latest" }];
  const sessionResponse = await fetch(
    "https://api.algebrakit.com/session/create",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ALGEBRAKIT_API_KEY as string,
      },
      body: JSON.stringify({
        exercises,
      }),
    },
  );
  if (!sessionResponse.ok) {
    throw new Error(
      `Error: ${sessionResponse.status} ${sessionResponse.statusText}`,
    );
  }

  const data = await sessionResponse.json();
  const sessions: AlgebraKitSession[] = data.flat(1) || [];
  const sessionId = sessions.map(({ sessionId }) => sessionId)[0];
  if (!sessionId)
    throw new Error(
      `Error: ${sessionResponse.status} ${sessionResponse.statusText}`,
    );

  return sessionId;
};

export const loadAlgebraExerciseText = async (sessionId: string) => {
  const sessionInfo = await fetch("https://api.algebrakit.com/session/info", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ALGEBRAKIT_API_KEY as string,
    },
    body: JSON.stringify({
      sessionId,
    }),
  });

  if (!sessionInfo.ok) {
    throw new Error(
      `Error: ${sessionInfo.status} ${sessionInfo.statusText}, sessionId: ${sessionId}`,
    );
  }

  const data = (await sessionInfo.json()) as ResponseData;
  if (!data.success || !data.elements) return "";

  const texts: string[] = [];

  data.elements.forEach((element) => {
    element.items.forEach((item) => {
      if (item.itemType === "TEXT" || item.itemType === "INTERACTION") {
        texts.push(item.content);
      }
    });
  });

  return texts.join("\n");
};

export const loadAlgebraSolution = async (sessionId: string) => {
  const sessionSolution = await fetch(
    "https://api.algebrakit.com/session/solution",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ALGEBRAKIT_API_KEY as string,
      },
      body: JSON.stringify({
        sessionId,
      }),
    },
  );

  if (!sessionSolution.ok) {
    throw new Error(
      `Error: ${sessionSolution.status} ${sessionSolution.statusText}`,
    );
  }

  const data = (await sessionSolution.json()) as SolutionResponse;
  const elements = data.data.view.elements;
  if (!data.success || !elements) return null;

  const skills = Object.keys(data.tagDescriptions);

  return { elements, skills };
};

export const loadAlgebraSessionInfo = async (sessionId: string) => {
  const sessionInfo = await fetch("https://api.algebrakit.com/session/info", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ALGEBRAKIT_API_KEY as string,
    },
    body: JSON.stringify({
      sessionId,
    }),
  });

  if (!sessionInfo.ok) {
    throw new Error(`Error: ${sessionInfo.status} ${sessionInfo.statusText}`);
  }

  const data = (await sessionInfo.json()) as SessionInfoResponse;
  return data.elements;
};

const retrieveAlgebraDataBySubjectId = async (subjectId: string) => {
  const username = process.env.ALGEBRAKIT_CMS_USERNAME as string;
  const password = process.env.ALGEBRAKIT_CMS_PASS as string;
  const basicAuth = Buffer.from(`${username}:${password}`).toString("base64");

  const response = await fetch(
    `https://cms.algebrakit.com/api/remote/subjects/${subjectId}`,
    {
      method: "GET",
      headers: {
        "x-api-key": process.env.ALGEBRAKIT_API_KEY as string,
        Authorization: `Basic ${basicAuth}`,
      },
    },
  );
  if (!response.ok) {
    throw new Error(`Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

const retrieveFoldersBySubjectId = async (subjectId: string) => {
  const data = await retrieveAlgebraDataBySubjectId(subjectId);

  return (
    (data as AlgebraKitSubjectsResponse)?.children?.filter(
      (child: { type: string }) => child.type === AlgebraChildrenType.FOLDER,
    ) || []
  );
};

const retrieveExercisesBySubjectId = async (subjectId: string) => {
  const data = await retrieveAlgebraDataBySubjectId(subjectId);

  return (
    (data as AlgebraKitSubjectsResponse)?.children?.filter(
      ({ type }) => type === AlgebraChildrenType.EXERCISE,
    ) || []
  );
};

const retrieveAlgebrakitStations = async (courseSubjectId: string) => {
  const subjectFolders = await retrieveFoldersBySubjectId(courseSubjectId);
  if (!subjectFolders.length) return [];

  const lessonFolders = (
    await Promise.all(
      subjectFolders.map(({ id }) => retrieveFoldersBySubjectId(id)),
    )
  ).flat(1);
  if (!lessonFolders.length) return [];

  return (
    await Promise.all(
      lessonFolders.map(({ id }) => retrieveFoldersBySubjectId(id)),
    )
  ).flat();
};

const retrieveNuggetExercises = async (nuggetFolders: AlgebraKitChildren[]) => {
  return Promise.all(
    nuggetFolders.map(async ({ id, metadata }) => {
      const nuggetId = metadata[0]?.value;
      if (!nuggetId) return;
      const nuggetExercises = await retrieveExercisesBySubjectId(id);
      return { nuggetId, nuggetExercises };
    }),
  );
};

const isValidDifficulty = (
  difficulty?: string,
): difficulty is ExerciseDifficulty => {
  return (
    !!difficulty &&
    Object.values(ExerciseDifficulty).includes(difficulty as ExerciseDifficulty)
  );
};

const parseTags = (input: string): string[] => {
  // Remove leading/trailing whitespaces and trim outermost quotation marks if they wrap the entire string
  input = input.trim();
  if (input.startsWith('"') && input.endsWith('"')) {
    input = input.substring(1, input.length - 1);
  }

  // Split by comma with optional spaces
  const parts = input.split(/\s*,\s*/);

  // Map through each part, trim spaces and trim quotation marks around each tag if present
  return parts.map((tag) => tag.replace(/^"|"$/g, "").trim().toLowerCase());
};

const retrieveExerciseTypes = async (
  exerciseId: string,
): Promise<ExerciseType[]> => {
  const publishedInfo = await fetch(
    "https://api.algebrakit.com/exercise/published-info",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ALGEBRAKIT_API_KEY as string,
      },
      body: JSON.stringify({
        id: exerciseId,
      }),
    },
  );

  if (!publishedInfo.ok) {
    throw new Error(
      `Error: ${publishedInfo.status} ${publishedInfo.statusText}, exerciseId: ${exerciseId}`,
    );
  }

  const data = await publishedInfo.json();

  const publishedVersions =
    data?.publishedVersions as AlgebraKitPubVersionInfo[];
  const latestVersion = publishedVersions?.find(
    (version) => version.majorVersion === "latest",
  );
  if (!latestVersion) return [];

  return [
    ...new Set(
      latestVersion.interactions.map((interaction) => interaction.type),
    ),
  ].filter(Boolean);
};

const retrieveExerciseAIData = async (
  exerciseId: string,
  exerciseType: ExerciseType,
) => {
  const sessionId = await initializeAlgebraSession(exerciseId);
  const exerciseText = await loadAlgebraExerciseText(sessionId);
  const solutionElementsWithSkills = await loadAlgebraSolution(sessionId);
  let solutionText = "";
  if (solutionElementsWithSkills?.elements.length) {
    const prompt = ChatPromptTemplate.fromTemplate(solutionPromptTemplateStr);
    const llm = new ChatOpenAI({ temperature: 0, model: "gpt-4o" });
    const chain = prompt.pipe(llm);
    const response = await chain.invoke({
      sessionJson: JSON.stringify(solutionElementsWithSkills.elements),
    });
    solutionText = response.content as string;
  }
  const prompt = ChatPromptTemplate.fromTemplate(exerciseSyncTemplateStr);
  const llm = new ChatOpenAI({
    temperature: 0,
    model: "gpt-4o",
  }).withStructuredOutput(exerciseResponseSchema, {
    method: "jsonSchema",
    strict: true,
  });
  const chain = prompt.pipe(llm);
  const response = await chain.invoke({ exerciseText, type: exerciseType });

  const formattedResponse = {
    ...response,
    solution: solutionText,
    exerciseType,
  };

  const embeddings = new OpenAIEmbeddings();
  const embeddingVector = await embeddings.embedQuery(
    JSON.stringify(formattedResponse),
  );

  return {
    ...formattedResponse,
    embedding: embeddingVector,
  };
};

const seedAlgebraExercises = async (
  exercises: AlgebraKitChildren[],
  stationId: string,
) => {
  return Promise.all(
    exercises.map(async ({ id, metadata, state }) => {
      const exerciseIsRemoved = metadata.find((md) => md.name === "deleted");
      const exerciseIsDraft = state == AlgebraExerciseState.DRAFT;
      if (exerciseIsDraft || exerciseIsRemoved) return;

      let exerciseTypes: ExerciseType[] = [];
      const isALevel = metadata.find((md) => md.name === "isALevel");
      const isHidden = metadata.find((md) => md.name === "hidden");
      const exerciseDifficultyLevel = metadata
        .find((md) => md.name === "difficultyLevel")
        ?.value?.trim();
      const isValidDIfficultyLevel = isValidDifficulty(exerciseDifficultyLevel);
      const difficultyLevel = isValidDIfficultyLevel
        ? exerciseDifficultyLevel
        : ExerciseDifficulty.NONE;
      const trialTestType = metadata.find(
        (md) => md.name === "trialTestType",
      )?.value;
      const tagsMetadata = metadata.find((md) => md.name === "tags")?.value;
      const tags = tagsMetadata ? parseTags(tagsMetadata) : [];

      if (!exerciseTypes.length) {
        exerciseTypes = await retrieveExerciseTypes(id);
      }

      if (trialTestType) {
        tags.push(trialTestType.toLowerCase());
      }

      if (
        exerciseTypes.length > 1 ||
        exerciseTypes.includes(ExerciseType.GEOMETRY) ||
        exerciseTypes.includes(ExerciseType.MATH_TABLE) ||
        exerciseTypes.includes(ExerciseType.MODEL_METHOD) ||
        exerciseTypes.includes(ExerciseType.STATISTICS)
      ) {
        console.log(
          `exercise ${id} had types: ${exerciseTypes.join(", ")} so returning`,
        );
        return;
      }

      const exerciseType = exerciseTypes[0];

      const exerciseMetadata = {
        tags,
        isALevel,
        isHidden,
      };
      const aiData = await retrieveExerciseAIData(id, exerciseType);
      if (!aiData) {
        console.log(`not gonna insert exercise ${id} because aiData is null`);
        return;
      }

      await supabaseClient.from("exercise").upsert(
        {
          id,
          stationId,
          metadata: exerciseMetadata,
          difficultyLevel,
          ...aiData,
        },
        { onConflict: "id" },
      );
    }),
  );
};

const retrieveStationAndNuggetExercises = async (
  station: AlgebraKitChildren,
) => {
  const stationId = station.metadata[0]?.value;
  const nuggetFolders = await retrieveFoldersBySubjectId(station.id);
  const stationExercises = await retrieveExercisesBySubjectId(station.id);
  const nuggetsWithExercises = await retrieveNuggetExercises(nuggetFolders);
  const allNuggetExercises = nuggetsWithExercises.flatMap(
    (nuggetWithExercises) => nuggetWithExercises?.nuggetExercises ?? [],
  );
  const allExercises = [...stationExercises, ...allNuggetExercises];
  console.log(`found ${allExercises.length} in station: ${stationId}`);
  await seedAlgebraExercises(allExercises, stationId);
};

export const syncAlgebraExercises = async () => {
  const courseIds = [
    // "656256bc-8baf-4720-b6bc-44db87b5dfd7",
    "bea29669-03bf-48a3-981e-e905ed305cb5",
    // "13103c80-b43c-4833-be2c-72585a548dfd",
    // "8a79ddc2-d0a3-486e-863c-272ea5f7cf49",
    // "e34fd4db-0773-4b9b-a52f-7ec5cbf1ac3e",
    // "b6947437-3472-49de-b8fe-5ab9bdf00209",
  ];

  for (const courseId of courseIds) {
    await inngest.send({
      name: "sync/algebra.course.batch",
      data: { courseId },
    });
    // await sleep(5 * 60 * 1000);
  }
};

export const syncAlgebraCourseExercises = async (
  algebrakitSubjectId: string,
) => {
  console.log(`syncing course ${algebrakitSubjectId}`);
  const stationFolders = await retrieveAlgebrakitStations(algebrakitSubjectId);
  console.log(
    `for course: ${algebrakitSubjectId} found ${stationFolders.length} total station folders`,
  );
  const stationIds = stationFolders
    .map(({ metadata }) => metadata[0]?.value)
    .filter((stationId): stationId is string => !!stationId);

  const databaseStations = await supabaseClient
    .from("station")
    .select("id")
    .in("id", stationIds);

  const databaseStationIds = databaseStations.data?.map(
    (station) => station.id,
  );

  const filteredStationFolders = stationFolders.filter((stationFolder) => {
    const stationId = stationFolder.metadata[0]?.value;
    return stationId && databaseStationIds?.includes(stationId);
  });

  console.log(`found ${filteredStationFolders.length} stations to sync`);

  for (let i = 0; i < filteredStationFolders.length; i += 20) {
    console.log(`sending batch ${i} of ${filteredStationFolders.length}`);
    const batch = filteredStationFolders.slice(i, i + 20);
    await inngest.send({
      name: "sync/algebra.stations.batch",
      data: { stations: batch },
    });
    await sleep(10000); // sleep for 10s before sending next batch
  }
};

export const syncAlgebraStations = async (stations: AlgebraKitChildren[]) => {
  for (const station of stations) {
    await inngest.send({
      name: "sync/algebra.station.batch",
      data: { station },
    });
    await sleep(10000);
  }
};

export const syncAlgebraStation = async (station: AlgebraKitChildren) => {
  return retrieveStationAndNuggetExercises(station);
};
