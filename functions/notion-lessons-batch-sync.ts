import { inngest } from "@/inggest/inngest.client";
import {
  Lesson,
  syncNotionStations,
  syncNotionStationsBatched,
} from "@/utils/syncNotionLessons";
import { createClient } from "@supabase/supabase-js";

const supabaseClient = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_PRIVATE_KEY!,
);

export const notionLessonBatchSync = inngest.createFunction(
  { id: "notion-lessons-batch-sync" },
  { event: "sync/notion.lessons.batch" },
  async ({ step, event }) => {
    const { lessons } = event.data;

    for (const lesson of lessons as Lesson[]) {
      await step.run(`sync-notion-lesson-${lesson.id}`, async () => {
        await supabaseClient.from("lesson").upsert(
          {
            id: lesson.id,
            title: lesson.title,
            grade: lesson.grade,
            notionPageId: lesson.notionPageId,
          },
          { onConflict: "id" },
        );

        await syncNotionStationsBatched(lesson.stationPageIds, lesson.id, 3);
      });
    }
    return { message: `Finished syncing batch!` };
  },
);
