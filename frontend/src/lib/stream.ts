import { Message } from "./types";

/**
 * POST the turn list to the backend and yield assistant text deltas as they
 * arrive over the SSE stream. The backend emits lines of `data: {json}\n\n`.
 */
export async function* streamChat(
  messages: Pick<Message, "role" | "content">[],
  signal: AbortSignal
): AsyncGenerator<string, void, unknown> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
    signal,
  });

  if (!res.ok || !res.body) {
    let detail = `Request failed (${res.status})`;
    try {
      const j = await res.json();
      if (j?.detail) detail = j.detail;
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";

    for (const evt of events) {
      const line = evt.trim();
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload) continue;
      let data: { delta?: string; done?: boolean; error?: string };
      try {
        data = JSON.parse(payload);
      } catch {
        continue;
      }
      if (data.error) throw new Error(data.error);
      if (data.done) return;
      if (data.delta) yield data.delta;
    }
  }
}
