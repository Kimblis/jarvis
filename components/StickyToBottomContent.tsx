import { ReactNode } from "react";
import { useStickToBottomContext } from "use-stick-to-bottom";
import { cn } from "@/utils/cn";

interface StickyToBottomContentProps {
  content: ReactNode;
  footer?: ReactNode;
  className?: string;
  contentClassName?: string;
}

export const StickyToBottomContent = ({
  content,
  footer,
  className,
  contentClassName,
}: StickyToBottomContentProps) => {
  const context = useStickToBottomContext();

  return (
    <div
      ref={context.scrollRef}
      style={{ width: "100%", height: "100%" }}
      className={cn("grid grid-rows-[1fr,auto]", className)}
    >
      <div ref={context.contentRef} className={contentClassName}>
        {content}
      </div>
      {footer}
    </div>
  );
};
