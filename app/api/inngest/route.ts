import { serve } from "inngest/next";
import { inngest } from "@/inggest/inngest.client";
import { notionSync } from "@/functions/notion-sync";
import { notionLessonBatchSync } from "@/functions/notion-lessons-batch-sync";
import { algebraStationsBatchSync } from "@/functions/algebra-stations-batch-sync";
import { algebraStationBatchSync } from "@/functions/algebra-station-batch-sync";
import { algebraCourseBatchSync } from "@/functions/algebra-course-batch-sync";
import { algebraSync } from "@/functions/algebra-sync";
import { seedSessions } from "@/functions/seed-sessions";
import { seedSessionsBatch } from "@/functions/seed-sessions-batch";
import { syncStudentBackendExercises } from "@/functions/student-backend-exercises-sync";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    notionSync,
    notionLessonBatchSync,
    algebraCourseBatchSync,
    algebraSync,
    algebraStationsBatchSync,
    algebraStationBatchSync,
    seedSessions,
    seedSessionsBatch,
    syncStudentBackendExercises,
  ],
});
