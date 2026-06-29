"use client";

import { ArrowUp, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface Props {
  onSend: (text: string) => void;
  onStop: () => void;
  busy: boolean;
}

export default function ChatInput({ onSend, onStop, busy }: Props) {
  const [value, setValue] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  // Auto-grow the textarea up to a ceiling.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }, [value]);

  const submit = () => {
    const text = value.trim();
    if (!text || busy) return;
    onSend(text);
    setValue("");
  };

  return (
    <div className="mx-auto w-full max-w-[800px] px-4 pb-5">
      <div className="group relative rounded-2xl border border-white/10 bg-surface/80 backdrop-blur-xl transition-colors focus-within:border-white/25 focus-within:shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_0_40px_-12px_rgba(59,130,246,0.35)]">
        <textarea
          ref={ref}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          rows={1}
          placeholder="Query the terminal…"
          className="scroll-thin block max-h-[200px] w-full resize-none bg-transparent px-4 py-3.5 pr-14 text-[15px] leading-relaxed text-primary placeholder:text-muted focus:outline-none"
        />

        <button
          onClick={busy ? onStop : submit}
          disabled={!busy && !value.trim()}
          className={`absolute bottom-2.5 right-2.5 flex h-9 w-9 items-center justify-center rounded-lg transition-all ${
            busy
              ? "bg-white/10 text-primary hover:bg-white/15"
              : value.trim()
                ? "bg-white text-black hover:opacity-90"
                : "bg-white/5 text-muted"
          }`}
          aria-label={busy ? "Stop" : "Send"}
        >
          {busy ? (
            <Square className="h-3.5 w-3.5" fill="currentColor" />
          ) : (
            <ArrowUp className="h-4 w-4" />
          )}
        </button>
      </div>
      <p className="mt-2 text-center text-[11px] text-muted">
        AI Chatbot can make mistakes. Verify critical output.{" "}
        <span className="text-white/30">Enter to send · Shift+Enter for newline</span>
      </p>
    </div>
  );
}
