import { useState } from "react";
import type { Message } from "ai/react";
import { cn } from "@/utils/cn";
import { ChevronDown, ChevronUp } from "lucide-react";

interface IntermediateStepProps {
  message: Message;
}

type ParsedInput = {
  action: {
    name: string;
    args: Record<string, any>;
  };
  observation: string;
};

export const IntermediateStep = ({ message }: IntermediateStepProps) => {
  const [expanded, setExpanded] = useState(false);

  const parsedInput = JSON.parse(message.content) as ParsedInput;

  const { action, observation } = parsedInput;

  return (
    <div className="mr-auto bg-secondary border border-input rounded p-3 max-w-[80%] mb-8 whitespace-pre-wrap flex flex-col">
      <button
        type="button"
        className={cn(
          "text-left flex items-center gap-1",
          expanded && "w-full",
        )}
        onClick={(e) => setExpanded(!expanded)}
      >
        <span>
          Step: <strong className="font-mono">{action.name}</strong>
        </span>
        <span className={cn(expanded && "hidden")}>
          <ChevronDown className="w-5 h-5" />
        </span>
        <span className={cn(!expanded && "hidden")}>
          <ChevronUp className="w-5 h-5" />
        </span>
      </button>
      <div
        className={cn(
          "overflow-hidden max-h-[0px] transition-[max-height] ease-in-out text-sm",
          expanded && "max-h-[360px]",
        )}
      >
        <div
          className={cn(
            "rounded",
            expanded ? "max-w-full" : "transition-[max-width] delay-100",
          )}
        >
          Input:{" "}
          <code className="max-h-[100px] overflow-auto">
            {JSON.stringify(action.args)}
          </code>
        </div>
        <div
          className={cn(
            "rounded",
            expanded ? "max-w-full" : "transition-[max-width] delay-100",
          )}
        >
          Output:{" "}
          <code className="max-h-[260px] overflow-auto">{observation}</code>
        </div>
      </div>
    </div>
  );
};
