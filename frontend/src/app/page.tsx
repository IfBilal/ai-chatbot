"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";

import Sidebar from "@/components/Sidebar";
import ChatMessage from "@/components/ChatMessage";
import ChatInput from "@/components/ChatInput";
import WaveField from "@/components/WaveField";
import ModelSelector from "@/components/ModelSelector";
import { useConversations } from "@/lib/useConversations";
import { useModels } from "@/lib/useModels";
import { streamChat } from "@/lib/stream";
import { Message, uid } from "@/lib/types";

const SUGGESTIONS = [
  "Explain transformer attention in plain terms",
  "Draft a concise product spec outline",
  "Compare REST and gRPC for internal services",
  "Summarize the tradeoffs of edge caching",
];

export default function Home() {
  const store = useConversations();
  const {
    conversations,
    active,
    activeId,
    hydrated,
    setActiveId,
    newConversation,
    deleteConversation,
    updateMessages,
  } = store;

  const { models, selected, current, select } = useModels();

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const messages = active?.messages ?? [];
  const canRegenerate =
    !busy && messages.length >= 2 && messages.some((m) => m.role === "assistant");

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, streamingId]);

  /**
   * Stream one assistant turn into `convId` given a base history (which must
   * end on a user turn). Appends a placeholder assistant message and fills it.
   */
  const runCompletion = async (
    convId: string,
    baseHistory: Pick<Message, "role" | "content">[]
  ) => {
    setError(null);
    const assistantMsg: Message = { id: uid(), role: "assistant", content: "" };
    updateMessages(convId, (msgs) => [...msgs, assistantMsg]);

    const controller = new AbortController();
    abortRef.current = controller;
    setBusy(true);
    setStreamingId(assistantMsg.id);

    try {
      let acc = "";
      for await (const delta of streamChat(baseHistory, selected, controller.signal)) {
        acc += delta;
        updateMessages(convId, (msgs) =>
          msgs.map((m) => (m.id === assistantMsg.id ? { ...m, content: acc } : m))
        );
      }
      if (!acc.trim()) {
        updateMessages(convId, (msgs) =>
          msgs.map((m) =>
            m.id === assistantMsg.id
              ? { ...m, content: "_No response returned._" }
              : m
          )
        );
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      if (msg !== "AbortError" && !controller.signal.aborted) {
        setError(msg);
        updateMessages(convId, (msgs) =>
          msgs.filter((m) => m.id !== assistantMsg.id || m.content.trim())
        );
      }
    } finally {
      setBusy(false);
      setStreamingId(null);
      abortRef.current = null;
    }
  };

  const send = async (text: string) => {
    let convId = activeId;
    if (!convId) convId = newConversation();

    const userMsg: Message = { id: uid(), role: "user", content: text };
    updateMessages(convId, (msgs) => [...msgs, userMsg]);

    const history = [...messages, userMsg].map((m) => ({
      role: m.role,
      content: m.content,
    }));
    await runCompletion(convId, history);
  };

  /** Re-run the latest user turn, discarding everything after it. */
  const regenerate = async () => {
    if (!activeId || busy) return;
    const lastUser = [...messages].reverse().findIndex((m) => m.role === "user");
    if (lastUser === -1) return;
    const cut = messages.length - 1 - lastUser; // index of last user msg
    const history = messages
      .slice(0, cut + 1)
      .map((m) => ({ role: m.role, content: m.content }));

    updateMessages(activeId, (msgs) => msgs.slice(0, cut + 1));
    await runCompletion(activeId, history);
  };

  const stop = () => {
    abortRef.current?.abort();
    setBusy(false);
    setStreamingId(null);
  };

  return (
    <div className="relative flex h-screen overflow-hidden bg-base">
      {/* Ambient background layers — quiet, monochrome */}
      <div className="pointer-events-none absolute inset-0 blueprint-grid opacity-60" />
      <div className="pointer-events-none absolute inset-0">
        <WaveField />
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black via-black/80 to-transparent" />

      <div className="relative z-10 flex w-full">
        <Sidebar
          conversations={conversations}
          activeId={activeId}
          onSelect={setActiveId}
          onNew={newConversation}
          onDelete={deleteConversation}
        />

        <main className="flex h-full flex-1 flex-col">
          {/* Apple-style sticky glass header */}
          <motion.header
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 120, damping: 22 }}
            className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 bg-black/40 px-6 backdrop-blur-xl"
          >
            <div className="flex items-center gap-3">
              <span className="text-[13px] font-medium tracking-tight text-primary">
                {active?.title ?? "New session"}
              </span>
              <span className="label">{messages.length} turns</span>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                onClick={regenerate}
                disabled={!canRegenerate}
                className="flex items-center gap-1.5 rounded-btn border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[12px] font-medium text-secondary transition-colors hover:border-white/20 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                title="Regenerate last response"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Regenerate</span>
              </button>
              <ModelSelector
                models={models}
                selected={selected}
                current={current}
                onSelect={select}
                disabled={busy}
              />
            </div>
          </motion.header>

          {/* Message stream */}
          <div ref={scrollRef} className="scroll-thin flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-[800px] px-6 py-8">
              {hydrated && messages.length === 0 ? (
                <Empty onPick={send} />
              ) : (
                <div className="space-y-7">
                  {messages.map((m) => (
                    <ChatMessage
                      key={m.id}
                      message={m}
                      streaming={m.id === streamingId}
                    />
                  ))}
                </div>
              )}

              {error && (
                <div className="mt-6 flex items-start gap-2.5 rounded-card border border-red-500/20 bg-red-500/[0.06] px-4 py-3 text-[13px] text-red-300">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          </div>

          {/* Composer */}
          <div className="shrink-0">
            <ChatInput onSend={send} onStop={stop} busy={busy} />
          </div>
        </main>
      </div>
    </div>
  );
}

function Empty({ onPick }: { onPick: (t: string) => void }) {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
      }}
      className="flex min-h-[58vh] flex-col items-center justify-center text-center"
    >
      <motion.div
        variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }}
        className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]"
      >
        <div className="h-3 w-3 rounded-[3px] bg-white shadow-glow-accent" />
      </motion.div>

      <motion.h1
        variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }}
        className="bg-gradient-to-b from-white to-white/55 bg-clip-text text-[34px] font-semibold leading-tight tracking-headline text-transparent"
      >
        Intelligence Terminal
      </motion.h1>
      <motion.p
        variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }}
        className="mt-2.5 max-w-md text-[14px] leading-relaxed text-secondary"
      >
        A precision interface to Groq-hosted Llama. Ask anything — responses
        stream in real time.
      </motion.p>

      <motion.div
        variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }}
        className="mt-9 grid w-full max-w-[620px] grid-cols-1 gap-2.5 sm:grid-cols-2"
      >
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => onPick(s)}
            className="group rounded-card border border-white/10 bg-surface/50 px-4 py-3.5 text-left text-[13px] text-secondary backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.04] hover:text-primary"
          >
            {s}
          </button>
        ))}
      </motion.div>
    </motion.div>
  );
}
