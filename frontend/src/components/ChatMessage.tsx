"use client";

import { motion } from "framer-motion";
import { Message } from "@/lib/types";
import Markdown from "./Markdown";

export default function ChatMessage({
  message,
  streaming,
}: {
  message: Message;
  streaming?: boolean;
}) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 120, damping: 22, mass: 1 }}
      className={`flex gap-4 ${isUser ? "justify-end" : "justify-start"}`}
    >
      {!isUser && (
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/[0.03]">
          <div className="h-1.5 w-1.5 rounded-[2px] bg-accent shadow-glow-accent" />
        </div>
      )}

      <div
        className={`max-w-[680px] ${
          isUser
            ? "rounded-2xl rounded-tr-md border border-white/10 bg-white/[0.05] px-4 py-2.5 text-[15px] leading-relaxed text-primary"
            : "pt-0.5"
        }`}
      >
        {isUser ? (
          <span className="whitespace-pre-wrap">{message.content}</span>
        ) : (
          <>
            <Markdown content={message.content} />
            {streaming && (
              <span className="ml-0.5 inline-block h-4 w-[7px] translate-y-0.5 animate-blink bg-accent align-middle" />
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}
