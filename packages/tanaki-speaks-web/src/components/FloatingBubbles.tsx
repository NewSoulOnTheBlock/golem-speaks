import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";

import type { ChatMessage } from "@/hooks/useTanakiSoul";

type BubbleRole = ChatMessage["role"];

type Bubble = {
  id: string;
  role: BubbleRole;
  content: string;
  durationMs: number;
  startLeftPct: number;
  startBottomPx: number;
  dxPx: number;
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

  const laneBottoms = useMemo(() => {
    // A few fixed "lanes" above the input overlay. These keep bubbles from piling
    // on top of each other on small screens.
    const base = Math.max(avoidBottomPx, 180);
    return [base + 16, base + 64, base + 112, base + 160];
  }, [avoidBottomPx]);

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
        const isUser = m.role === "user";
        const laneIdx = Math.floor(Math.random() * laneBottoms.length);
        const laneJitter = (Math.random() - 0.5) * 18;
        const startBottomPx = laneBottoms[laneIdx] + laneJitter;

        // Start near each side; drift across in opposite directions.
        const startLeftPct = isUser
          ? 62 + Math.random() * 18
          : 20 + Math.random() * 18;

        const dxBase = isUser ? -(220 + Math.random() * 320) : 220 + Math.random() * 320;
        const dxPx = clamp(dxBase, isUser ? -640 : 220, isUser ? -220 : 640);

        const durationMs = reducedMotion ? 2600 : 6500 + Math.random() * 3500;

        next.push({
          id: `${m.id}-bubble`,
          role: m.role,
          content: m.content,
          durationMs,
          startLeftPct,
          startBottomPx,
          dxPx,
        });
      }

      // Cap bubble count for perf, preferring newest.
      return next.slice(Math.max(0, next.length - maxBubbles));
    });
  }, [messages, laneBottoms, maxBubbles, reducedMotion]);

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
    <div className="tanaki-bubble-layer" aria-hidden="true">
      {bubbles.map((b) => {
        const isUser = b.role === "user";
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
                left: `${b.startLeftPct}%`,
                bottom: `${b.startBottomPx}px`,
                // Custom props consumed by CSS keyframes.
                ["--tanaki-bubble-dx" as any]: `${b.dxPx}px`,
                ["--tanaki-bubble-duration" as any]: `${b.durationMs}ms`,
              } as CSSProperties
            }
          >
            <div className="tanaki-bubble">{b.content}</div>
          </div>
        );
      })}
    </div>
  );
}


