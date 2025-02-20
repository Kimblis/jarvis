"use client";

import { AssessmentState } from "@/utils/types";
import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  Dispatch,
  SetStateAction,
} from "react";

interface AssessmentContextType {
  grade: number | null;
  setGrade: (grade: number) => void;
  assessmentStarted: boolean;
  setAssessmentStarted: Dispatch<SetStateAction<boolean>>;
  assessmentState: AssessmentState;
  setAssessmentState: Dispatch<SetStateAction<AssessmentState>>;
}

const AssessmentContext = createContext<AssessmentContextType | undefined>(
  undefined,
);

export const AssessmentProvider = ({ children }: { children: ReactNode }) => {
  const [grade, setGrade] = useState<number | null>(null);
  const [assessmentStarted, setAssessmentStarted] = useState(false);
  const [assessmentState, setAssessmentState] = useState<AssessmentState>(
    AssessmentState.INITIALIZATION,
  );

  return (
    <AssessmentContext.Provider
      value={{
        grade,
        setGrade,
        assessmentStarted,
        setAssessmentStarted,
        assessmentState,
        setAssessmentState,
      }}
    >
      {children}
    </AssessmentContext.Provider>
  );
};

export const useAssessmentContext = () => {
  const context = useContext(AssessmentContext);
  if (!context) {
    throw new Error(
      "useAssessmentContext must be used within an AssessmentProvider",
    );
  }
  return context;
};
