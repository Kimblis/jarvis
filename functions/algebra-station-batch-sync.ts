import { inngest } from "@/inggest/inngest.client";
import { syncAlgebraStation } from "@/utils/syncAlgebraExercises";

export const algebraStationBatchSync = inngest.createFunction(
  { id: "algebra-station-batch-sync" },
  { event: "sync/algebra.station.batch" },
  async ({ step, event }) => {
    const { station } = event.data;

    await step.run("sync-algebra-station", async () => {
      await syncAlgebraStation(station);
    });
    return { message: `Finished syncing station ${station.id}!` };
  },
);
