import { inngest } from "@/inggest/inngest.client";
import { seedStudentBackendExercises } from "@/utils/seedStudentBackendExercises";

export const syncStudentBackendExercises = inngest.createFunction(
  { id: "sync-student-backend-exercises" },
  { event: "sync/student.backend.exercises" },
  async ({ step }) => {
    await step.run(
      "sync-student-backend-exercises",
      seedStudentBackendExercises,
    );
    return { message: `Finished syncing student backend exercises!` };
  },
);
