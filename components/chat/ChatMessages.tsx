import { Message } from "ai";
import { IntermediateStep } from "./IntermediateStep";
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
        if (m.role === "system") {
          return <IntermediateStep key={m.id} message={m} />;
        }

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
