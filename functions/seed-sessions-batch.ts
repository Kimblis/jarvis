import { inngest } from "@/inggest/inngest.client";
import { seedPublicTestSession } from "@/utils/seedPublicTestSessions";

export const seedSessionsBatch = inngest.createFunction(
  { id: "seed-sessions-batch" },
  { event: "seed/sessions.batch" },
  async ({ step, event }) => {
    const { sessionIds } = event.data;
    console.log(`got sessionIds: ${sessionIds.length}`);
    await step.run("seed-sessions batch", async () => {
      await Promise.all(
        (sessionIds as string[]).map((sessionId) =>
          seedPublicTestSession(sessionId),
        ),
      );
    });
    return { message: `Finished seeding!` };
  },
);
