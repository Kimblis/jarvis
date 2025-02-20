"use client";

import { useChat } from "ai/react";
import { useState } from "react";
import type { FormEvent } from "react";
import { toast } from "sonner";
import { StickToBottom } from "use-stick-to-bottom";

import { StickyToBottomContent } from "./StickyToBottomContent";
import { ChatMessages } from "./chat/ChatMessages";
import { ScrollToBottomButton } from "./ScrollToBottomButton";
import { ChatInput } from "./chat/ChatInput";
import { Source } from "@/utils/types";

interface ChatWindowProps {
  endpoint: string;
  emptyStateComponent: JSX.Element;
  placeholder?: string;
  emoji?: string;
}

export const ChatWindow = ({
  endpoint,
  emptyStateComponent,
  placeholder,
  emoji,
}: ChatWindowProps) => {
  const [sourcesForMessages, setSourcesForMessages] = useState<
    Record<string, Source[]>
  >({});

  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat({
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
    if (isLoading) return;

    handleSubmit(e);
  };

  return (
    <StickToBottom>
      <StickyToBottomContent
        className="absolute inset-0"
        contentClassName="py-8 px-2"
        content={
          !messages.length ? (
            <div>{emptyStateComponent}</div>
          ) : (
            <ChatMessages
              aiEmoji={emoji}
              messages={messages}
              sourcesForMessages={sourcesForMessages}
            />
          )
        }
        footer={
          <div className="sticky bottom-8 px-2">
            <ScrollToBottomButton className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4" />
            <ChatInput
              value={input}
              onChange={handleInputChange}
              onSubmit={sendMessage}
              loading={isLoading}
              placeholder={placeholder ?? "Kas yra nepriklausomi įvykiai?"}
            />
          </div>
        }
      ></StickyToBottomContent>
    </StickToBottom>
  );
};
