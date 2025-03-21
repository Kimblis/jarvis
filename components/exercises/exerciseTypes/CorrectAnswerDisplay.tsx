"use client";

import { MathfieldElement } from "@/utils/types";
import { useEffect, useRef } from "react";

interface CorrectAnswerDisplayProps {
  answer: string;
}

const CorrectAnswerDisplay = ({ answer }: CorrectAnswerDisplayProps) => {
  const mathfieldRef = useRef<MathfieldElement>(null);

  useEffect(() => {
    if (mathfieldRef.current) {
      mathfieldRef.current.readonly = true;
      mathfieldRef.current.smartFence = true;
      mathfieldRef.current.smartMode = true;
      mathfieldRef.current.smartSuperscript = true;
    }
  }, []);

  return (
    <math-field
      ref={mathfieldRef}
      className="w-full bg-white p-3 rounded-md border"
      // @ts-ignore
      readonly
    >
      {answer}
    </math-field>
  );
};

export default CorrectAnswerDisplay;
