import { FormEvent, ReactNode } from "react";
import { Button } from "../ui/button";
import { LoaderCircle } from "lucide-react";

interface ChatInputProps {
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  loading?: boolean;
  placeholder?: string;
  children?: ReactNode;
  className?: string;
}

export const ChatInput = ({
  onChange,
  onSubmit,
  value,
  loading,
  placeholder,
  children,
  className,
}: ChatInputProps) => {
  const maxLength = 300;
  const remainingChars = maxLength - value.length;

  return (
    <form
      onSubmit={(e) => {
        e.stopPropagation();
        e.preventDefault();
        onSubmit(e);
      }}
      className={`flex w-full flex-col ${className || ""}`}
    >
      <div className="border border-input bg-secondary rounded-lg flex flex-col gap-2 max-w-[768px] w-full mx-auto">
        <input
          value={value}
          placeholder={placeholder}
          onChange={onChange}
          maxLength={maxLength}
          className="border-none outline-none bg-transparent p-4"
        />
        <div className="flex justify-between ml-4 mr-2 mb-2 items-center">
          <div className="flex items-center gap-3">
            {children}
            <span className="text-sm text-muted-foreground">
              {remainingChars} characters remaining
            </span>
          </div>
          <Button type="submit" className="self-end" disabled={loading}>
            {loading ? (
              <span role="status" className="flex justify-center">
                <LoaderCircle className="animate-spin" />
                <span className="sr-only">Loading...</span>
              </span>
            ) : (
              <span>Send</span>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
};
