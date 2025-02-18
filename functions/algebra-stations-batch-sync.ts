import { inngest } from "@/inggest/inngest.client";
import { syncAlgebraStations } from "@/utils/syncAlgebraExercises";

export const algebraStationsBatchSync = inngest.createFunction(
  { id: "algebra-stations-batch-sync" },
  { event: "sync/algebra.stations.batch" },
  async ({ step, event }) => {
    const { stations } = event.data;

    await step.run("sync-algebra-stations", async () => {
      await syncAlgebraStations(stations);
    });
    return { message: `Finished syncing stations batch!` };
  },
);
