"use client";

import { EmptyAssessmentView } from "@/components/assessment/EmptyView";
import { useChat } from "ai/react";
import { useState } from "react";
import type { FormEvent } from "react";
import { toast } from "sonner";
import { StickToBottom } from "use-stick-to-bottom";
import { v4 as uuidv4 } from "uuid";

import { StickyToBottomContent } from "../StickyToBottomContent";
import { ChatMessages } from "../chat/ChatMessages";
import { ScrollToBottomButton } from "../ScrollToBottomButton";
import { ChatInput } from "../chat/ChatInput";
import { useAssessmentContext } from "@/context/AssessmentContext";
import { AssessmentState } from "@/utils/types";

interface ChatWindowProps {
  endpoint: string;
}

export const ChatWindow = ({ endpoint }: ChatWindowProps) => {
  const [sourcesForMessages, setSourcesForMessages] = useState<
    Record<string, any>
  >({});
  const {
    grade,
    setGrade,
    assessmentStarted,
    setAssessmentStarted,
    assessmentState,
    setAssessmentState,
  } = useAssessmentContext();

  const chat = useChat({
    api: endpoint,
    onResponse(response) {
      const sourcesHeader = response.headers.get("x-sources");
      const sources = sourcesHeader
        ? JSON.parse(Buffer.from(sourcesHeader, "base64").toString("utf8"))
        : [];

      const messageIndexHeader = response.headers.get("x-message-index");
      const messageIndex = parseInt(messageIndexHeader ?? "0", 10) + 1;

      if (sources.length && messageIndex !== null) {
        setSourcesForMessages({
          ...sourcesForMessages,
          [messageIndex]: sources,
        });
      }
    },
    streamMode: "text",
    onError: (e) =>
      toast.error(`Error while processing your request`, {
        description: e.message,
      }),
  });

  const sendMessage = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (chat.isLoading) return;

    // Handle grade selection
    if (assessmentState === AssessmentState.GRADE_SELECTION) {
      const haveConfirmationMessage = chat.messages.find(
        (message) =>
          message.role === "assistant" &&
          message.content.includes("Let's continue with the assessment"),
      );
      if (haveConfirmationMessage) {
        setAssessmentState(AssessmentState.ASSESSMENT_IN_PROGRESS);
        return chat.handleSubmit(e, {
          data: {
            grade,
            assessmentState: AssessmentState.ASSESSMENT_IN_PROGRESS,
          },
        });
      }

      const inputText = chat.input.trim();
      const parsedGrade = parseInt(inputText, 10);
      if (!isNaN(parsedGrade) && parsedGrade >= 5 && parsedGrade <= 12) {
        setGrade(parsedGrade);

        return chat.handleSubmit(e, {
          data: {
            grade: parsedGrade,
            assessmentState,
          },
        });
      }
    }

    if (assessmentState === AssessmentState.ASSESSMENT_IN_PROGRESS) {
      const inputText = chat.input.trim();
      if (
        inputText.includes("I'm done") ||
        inputText.includes("I'm finished")
      ) {
        setAssessmentState(AssessmentState.ASSESSMENT_COMPLETED);
        return chat.handleSubmit(e, {
          data: {
            grade,
            assessmentState: AssessmentState.ASSESSMENT_COMPLETED,
          },
        });
      }
    }

    chat.handleSubmit(e, { data: { grade, assessmentState } });
  };

  const handleStartAssessment = () => {
    setAssessmentStarted(true);
    setAssessmentState(AssessmentState.GRADE_SELECTION);
    chat.append(
      {
        role: "user",
        content: "Let's start the assessment",
      },
      { data: { assessmentState } },
    );
  };

  return (
    <StickToBottom>
      <StickyToBottomContent
        className="absolute inset-0"
        contentClassName="py-8 px-2"
        content={
          assessmentStarted ? (
            <ChatMessages
              messages={chat.messages}
              sourcesForMessages={sourcesForMessages}
            />
          ) : (
            <EmptyAssessmentView onStartAssessment={handleStartAssessment} />
          )
        }
        footer={
          <>
            {assessmentStarted && (
              <div className="sticky bottom-8 px-2">
                <ScrollToBottomButton className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4" />
                <ChatInput
                  value={chat.input}
                  onChange={chat.handleInputChange}
                  onSubmit={sendMessage}
                  loading={chat.isLoading}
                />
              </div>
            )}
          </>
        }
      ></StickyToBottomContent>
    </StickToBottom>
  );
};
