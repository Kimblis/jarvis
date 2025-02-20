import { useStickToBottomContext } from "use-stick-to-bottom";
import { Button } from "./ui/button";
import { ArrowDown } from "lucide-react";

interface ScrollToBottomButtonProps {
  className?: string;
}

export const ScrollToBottomButton = ({
  className,
}: ScrollToBottomButtonProps) => {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext();

  if (isAtBottom) return null;
  return (
    <Button
      variant="outline"
      className={className}
      onClick={() => scrollToBottom()}
    >
      <ArrowDown className="w-4 h-4" />
      <span>Scroll to bottom</span>
    </Button>
  );
};
