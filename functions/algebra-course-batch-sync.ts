import { inngest } from "@/inggest/inngest.client";
import { syncAlgebraCourseExercises } from "@/utils/syncAlgebraExercises";

export const algebraCourseBatchSync = inngest.createFunction(
  { id: "algebra-course-batch-sync" },
  { event: "sync/algebra.course.batch" },
  async ({ step, event }) => {
    const { courseId } = event.data;

    await step.run("sync-algebra-course-exercises", async () => {
      await syncAlgebraCourseExercises(courseId);
    });
    return { message: `Finished syncing course ${courseId} batch!` };
  },
);
