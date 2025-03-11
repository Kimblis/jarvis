import { Message } from "ai";
import { ChatMessageBubble } from "./ChatMessageBubble";
import { Source } from "@/utils/types";

interface ChatMessagesProps {
  messages: Message[];
  sourcesForMessages: Record<string, Source[]>;
  aiEmoji?: string;
}

export const ChatMessages = ({
  messages,
  sourcesForMessages,
  aiEmoji,
}: ChatMessagesProps) => {
  return (
    <div className="flex flex-col max-w-[768px] mx-auto pb-12 w-full">
      {messages.map((m, i) => {
        return (
          <ChatMessageBubble
            key={m.id}
            message={m}
            aiEmoji={aiEmoji}
            sources={sourcesForMessages[i + 1]}
          />
        );
      })}
    </div>
  );
};
