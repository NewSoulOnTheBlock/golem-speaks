import { useCallback, useRef } from "react";

export type TtsSpeakOptions = {
  voice?: string;
  signal?: AbortSignal;
  onChunk: (chunk: Uint8Array) => void;
};

export function useTTS() {
  const speakingRef = useRef(false);

  const speak = useCallback(async (text: string, opts: TtsSpeakOptions) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    if (speakingRef.current) {
      // We don't enforce single-flight here; the caller should abort/interrupt.
    }
    speakingRef.current = true;

    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: trimmed,
          voice: opts.voice,
        }),
        signal: opts.signal,
      });

      if (!response.ok) {
        const err = await response.text().catch(() => "");
        throw new Error(`TTS failed (${response.status}): ${err}`);
      }

      if (!response.body) {
        throw new Error("TTS response did not include a readable stream body.");
      }

      const reader = response.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) opts.onChunk(value);
      }
    } finally {
      speakingRef.current = false;
    }
  }, []);

  return { speak };
}


