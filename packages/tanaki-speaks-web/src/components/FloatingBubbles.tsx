import { useEffect, useRef, useState, type CSSProperties } from "react";

import type { ChatMessage } from "@/hooks/useTanakiSoul";

type BubbleRole = ChatMessage["role"];

type Bubble = {
  id: string;
  role: BubbleRole;
  content: string;
  durationMs: number;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
}

export type FloatingBubblesProps = {
  messages: ChatMessage[];
  avoidBottomPx: number;
  maxBubbles?: number;
};

export function FloatingBubbles({
  messages,
  avoidBottomPx,
  maxBubbles = 14,
}: FloatingBubblesProps) {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const lastSeenMessageIndexRef = useRef(0);
  const timeoutIdsRef = useRef<number[]>([]);
  const [reducedMotion, setReducedMotion] = useState(prefersReducedMotion());

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReducedMotion(mq.matches);
    onChange();
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  useEffect(() => {
    // Convert new messages into ephemeral bubbles.
    const startIdx = lastSeenMessageIndexRef.current;
    if (messages.length <= startIdx) return;

    const newMessages = messages.slice(startIdx);
    lastSeenMessageIndexRef.current = messages.length;

    if (newMessages.length === 0) return;

    setBubbles((prev) => {
      const next: Bubble[] = [...prev];
      for (const m of newMessages) {
        const durationMs = reducedMotion ? 2600 : 7000 + Math.random() * 3500;

        next.push({
          id: `${m.id}-bubble`,
          role: m.role,
          content: m.content,
          durationMs,
        });
      }

      // Cap bubble count for perf, preferring newest.
      return next.slice(Math.max(0, next.length - maxBubbles));
    });
  }, [messages, maxBubbles, reducedMotion]);

  useEffect(() => {
    // Cleanup timeouts on unmount.
    return () => {
      for (const id of timeoutIdsRef.current) window.clearTimeout(id);
      timeoutIdsRef.current = [];
    };
  }, []);

  const scheduledRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    for (const b of bubbles) {
      if (scheduledRef.current.has(b.id)) continue;
      scheduledRef.current.add(b.id);

      const timeoutId = window.setTimeout(() => {
        setBubbles((prev) => prev.filter((x) => x.id !== b.id));
        scheduledRef.current.delete(b.id);
      }, b.durationMs + 250);
      timeoutIdsRef.current.push(timeoutId);
    }
  }, [bubbles]);

  return (
    <div
      className="tanaki-bubble-layer"
      aria-hidden="true"
      style={
        {
          // Reserve room for the bottom input overlay so bubbles stack above it.
          ["--tanaki-bubble-avoid-bottom" as any]: `${Math.max(0, avoidBottomPx)}px`,
        } as CSSProperties
      }
    >
      <div className="tanaki-bubble-stack">
        {bubbles.map((b, i) => {
          const isUser = b.role === "user";
          // Slightly dim older bubbles so the stack reads like a timeline.
          const indexOpacity = clamp(1 - (bubbles.length - 1 - i) * 0.08, 0.35, 1);
          return (
            <div
              key={b.id}
              className={[
                "tanaki-bubble-item",
                isUser ? "tanaki-bubble-item--user" : "tanaki-bubble-item--tanaki",
                reducedMotion ? "tanaki-bubble-item--reduced-motion" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              style={
                {
                  ["--tanaki-bubble-duration" as any]: `${b.durationMs}ms`,
                  filter: `opacity(${indexOpacity})`,
                } as CSSProperties
              }
            >
              <div className="tanaki-bubble">{b.content}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


