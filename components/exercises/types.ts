export type ExerciseType = "open-input" | "choice" | "multiple-choice";

export interface Exercise {
  id: string;
  condition: string;
  answer: string;
  type: ExerciseType;
  options?: Choice[]; // For choice-based exercises
}

export interface Choice {
  letter: string;
  value: string;
}

export interface ExerciseFeedback {
  isCorrect: boolean;
  message: string;
  correctAnswer?: string;
}
