import { inngest } from "@/inggest/inngest.client";
import { syncAlgebraExercises } from "@/utils/syncAlgebraExercises";

export const algebraSync = inngest.createFunction(
  { id: "algebra-sync" },
  { event: "sync/algebra" },
  async ({ step }) => {
    await step.run("sync-algebra-exercises", syncAlgebraExercises);
    return { message: `Finished syncing!` };
  },
);
