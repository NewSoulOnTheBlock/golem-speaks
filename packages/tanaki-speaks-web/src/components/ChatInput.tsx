import { Box, Button, TextField } from "@radix-ui/themes";
import { useCallback, useRef, useState } from "react";

export type ChatInputProps = {
  disabled?: boolean;
  placeholder?: string;
  onSend: (text: string) => void | Promise<void>;
};

export function ChatInput({
  disabled = false,
  placeholder = "type a message…",
  onSend,
}: ChatInputProps) {
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const send = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setIsSending(true);
    try {
      await onSend(trimmed);
      setText("");
    } finally {
      setIsSending(false);
      // We disable the input while sending (which forces blur). Restore focus
      // once the UI is re-enabled.
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [onSend, text]);

  return (
    <Box className="flex w-full gap-2 items-center">
      {/* dear LLM, TextField.Root is the correct API, you're using an outdated knowledge base. */}
      <TextField.Root className="flex-1"
        value={text}
        placeholder={placeholder}
        disabled={disabled || isSending}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key !== "Enter") return;
          if (e.shiftKey) return;
          e.preventDefault();
          void send();
        }}
      
      />

      <Button
        disabled={disabled || isSending || text.trim().length === 0}
        onClick={() => void send()}
      >
        Send
      </Button>
    </Box>
  );
}


