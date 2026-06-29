"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Plus, Trash2, MessageSquare } from "lucide-react";
import { Conversation } from "@/lib/types";

interface Props {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}

export default function Sidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
}: Props) {
  return (
    <aside className="flex h-full w-[270px] shrink-0 flex-col border-r border-white/10 bg-surface/70 backdrop-blur-xl">
      <div className="flex items-center gap-2.5 px-5 pb-4 pt-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-md border border-white/15 bg-white/5">
          <div className="h-2 w-2 rounded-[2px] bg-white" />
        </div>
        <div className="leading-none">
          <div className="text-[13px] font-semibold tracking-tight text-primary">
            AI CHATBOT
          </div>
          <div className="label mt-1">Intelligence Terminal</div>
        </div>
      </div>

      <div className="px-3">
        <button
          onClick={onNew}
          className="group flex w-full items-center gap-2 rounded-btn border border-white/10 bg-white/[0.03] px-3 py-2.5 text-[13px] font-medium text-secondary transition-all hover:border-white/20 hover:bg-white/[0.06] hover:text-primary"
        >
          <Plus className="h-4 w-4" />
          New session
        </button>
      </div>

      <div className="mt-5 px-5">
        <div className="label">Sessions</div>
      </div>

      <nav className="scroll-thin mt-2 flex-1 space-y-0.5 overflow-y-auto px-3 pb-4">
        <AnimatePresence initial={false}>
          {conversations.length === 0 && (
            <p className="px-2 py-3 text-[12px] leading-relaxed text-muted">
              No sessions yet. Start a new one to begin.
            </p>
          )}
          {conversations.map((c) => {
            const active = c.id === activeId;
            return (
              <motion.div
                key={c.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ type: "spring", stiffness: 320, damping: 30 }}
                className="group relative"
              >
                <button
                  onClick={() => onSelect(c.id)}
                  className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[13px] transition-colors ${
                    active
                      ? "bg-white/[0.07] text-primary"
                      : "text-secondary hover:bg-white/[0.04] hover:text-primary"
                  }`}
                >
                  <MessageSquare
                    className={`h-3.5 w-3.5 shrink-0 ${
                      active ? "text-accent" : "text-muted"
                    }`}
                  />
                  <span className="truncate">{c.title}</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(c.id);
                  }}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-1 text-muted opacity-0 transition-all hover:text-primary group-hover:opacity-100"
                  aria-label="Delete session"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                {active && (
                  <motion.div
                    layoutId="active-rail"
                    className="absolute -left-3 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-full bg-accent"
                  />
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </nav>

      <div className="border-t border-white/10 px-5 py-3.5">
        <div className="flex items-center gap-2">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
          </span>
          <span className="text-[11px] text-muted">llama-3.3-70b · groq · online</span>
        </div>
      </div>
    </aside>
  );
}
