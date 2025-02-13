import { AlgebraKitSession, ResponseData, SolutionResponse } from "./types";

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
    throw new Error(`Error: ${sessionInfo.status} ${sessionInfo.statusText}`);
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
