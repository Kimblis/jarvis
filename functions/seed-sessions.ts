import { inngest } from "@/inggest/inngest.client";
import { seedPublicTestSessions } from "@/utils/seedPublicTestSessions";

export const seedSessions = inngest.createFunction(
  { id: "seed-sessions" },
  { event: "seed/sessions" },
  async ({ step }) => {
    await step.run("seed-sessions", seedPublicTestSessions);
    return { message: `Finished seeding!` };
  },
);
