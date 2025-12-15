import { createFileRoute } from "@tanstack/react-router";

function jsonError(message: string, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

export const Route = createFileRoute("/api/tts")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
          return jsonError(
            "Missing OPENAI_API_KEY on server (set it in your environment).",
            500
          );
        }

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return jsonError("Invalid JSON body.");
        }

        const text =
          typeof (body as any)?.text === "string" ? (body as any).text : "";
        const voice =
          typeof (body as any)?.voice === "string" ? (body as any).voice : "alloy";

        const trimmed = text.trim();
        if (!trimmed) {
          return jsonError('Missing "text" in request body.');
        }

        // OpenAI Audio (TTS). We request raw PCM16 (little-endian) so the client can
        // stream-play it via WebAudio with minimal decoding overhead.
        const upstream = await fetch("https://api.openai.com/v1/audio/speech", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4o-mini-tts",
            voice,
            input: trimmed,
            // OpenAI historically used `response_format`, but some SDKs/docs
            // mention `format`. We send both; upstream should ignore unknown keys.
            response_format: "pcm",
            format: "pcm",
          }),
        });

        if (!upstream.ok) {
          const errText = await upstream.text().catch(() => "");
          return jsonError(
            `Upstream TTS error (${upstream.status}). ${errText}`.trim(),
            502
          );
        }

        if (!upstream.body) {
          return jsonError("Upstream did not return a streaming body.", 502);
        }

        // Stream bytes straight through to the browser.
        return new Response(upstream.body, {
          status: 200,
          headers: {
            "Content-Type": "application/octet-stream",
            "Cache-Control": "no-store",
            // Helpful metadata for the client (not required).
            "X-Audio-Sample-Rate": "24000",
            "X-Audio-Channels": "1",
            "X-Audio-Format": "pcm_s16le",
          },
        });
      },
    },
  },
});


