import { serve } from "inngest/next";
import { inngest } from "@/inggest/inngest.client";
import { notionSync } from "@/functions/notion-sync";
import { notionLessonBatchSync } from "@/functions/notion-lessons-batch-sync";
import { algebraStationsBatchSync } from "@/functions/algebra-stations-batch-sync";
import { algebraStationBatchSync } from "@/functions/algebra-station-batch-sync";
import { algebraCourseBatchSync } from "@/functions/algebra-course-batch-sync";
import { algebraSync } from "@/functions/algebra-sync";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    notionSync,
    notionLessonBatchSync,
    algebraCourseBatchSync,
    algebraSync,
    algebraStationsBatchSync,
    algebraStationBatchSync,
  ],
});
