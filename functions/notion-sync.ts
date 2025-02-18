import { syncNotionLessons } from "@/utils/syncNotionLessons";
import { inngest } from "../inggest/inngest.client";

export const notionSync = inngest.createFunction(
  { id: "notion-sync" },
  { event: "sync/notion" },
  async ({ step }) => {
    await step.run("sync-notion-lessons", syncNotionLessons);
    return { message: `Finished syncing!` };
  },
);
