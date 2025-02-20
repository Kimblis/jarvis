import { cn } from "@/utils/cn";
import { Source } from "@/utils/types";
import type { Message } from "ai/react";

interface ChatMessageBubleProps {
  message: Message;
  sources: Source[];
  aiEmoji?: string;
}

export const ChatMessageBubble = ({
  message,
  aiEmoji,
  sources,
}: ChatMessageBubleProps) => {
  return (
    <div
      className={cn(
        `rounded-[24px] max-w-[80%] mb-8 flex`,
        message.role === "user"
          ? "bg-secondary text-secondary-foreground px-4 py-2"
          : null,
        message.role === "user" ? "ml-auto" : "mr-auto",
      )}
    >
      {message.role !== "user" && (
        <div className="mr-4 border bg-secondary -mt-2 rounded-full w-10 h-10 flex-shrink-0 flex items-center justify-center">
          {aiEmoji}
        </div>
      )}

      <div className="whitespace-pre-wrap flex flex-col">
        <span>{message.content}</span>

        {!!sources?.length ? (
          <>
            <code className="mt-1 mr-2 bg-primary rounded-3xl p-4">
              <h2 className="text-md font-bold">🔍 Sources:</h2>
              {sources?.map(
                (
                  {
                    pageContent,
                    metadata: { lessonId, stationId, similarity },
                  },
                  i,
                ) => (
                  <div
                    className="mt-2 cursor-pointer text-xs hover:bg-red-700 transition-colors duration-200"
                    key={"source:" + i}
                    onClick={() =>
                      window.open(
                        `https://mokinys.elicejus.lt/dashboard/1/lesson/${lessonId}/${stationId}`,
                        "_blank",
                      )
                    }
                  >
                    {i + 1}. {pageContent} ({parseFloat(similarity).toFixed(2)}
                    %);
                  </div>
                ),
              )}
            </code>
          </>
        ) : null}
      </div>
    </div>
  );
};
