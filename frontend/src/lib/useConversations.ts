"use client";

import { useCallback, useEffect, useState } from "react";
import { Conversation, Message, uid } from "./types";

const KEY = "aichatbot.conversations.v1";

function load(): Conversation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Conversation[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function deriveTitle(text: string): string {
  const clean = text.trim().replace(/\s+/g, " ");
  if (!clean) return "New session";
  return clean.length > 42 ? clean.slice(0, 42).trimEnd() + "…" : clean;
}

/**
 * Conversation store backed by localStorage. The backend stays stateless —
 * everything the user sees lives here in the browser.
 */
export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const loaded = load();
    setConversations(loaded);
    setActiveId(loaded[0]?.id ?? null);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(KEY, JSON.stringify(conversations));
  }, [conversations, hydrated]);

  const active = conversations.find((c) => c.id === activeId) ?? null;

  const newConversation = useCallback(() => {
    const conv: Conversation = {
      id: uid(),
      title: "New session",
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setConversations((prev) => [conv, ...prev]);
    setActiveId(conv.id);
    return conv.id;
  }, []);

  const deleteConversation = useCallback(
    (id: string) => {
      setConversations((prev) => {
        const next = prev.filter((c) => c.id !== id);
        if (id === activeId) setActiveId(next[0]?.id ?? null);
        return next;
      });
    },
    [activeId]
  );

  const updateMessages = useCallback(
    (id: string, updater: (msgs: Message[]) => Message[]) => {
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== id) return c;
          const messages = updater(c.messages);
          const firstUser = messages.find((m) => m.role === "user");
          return {
            ...c,
            messages,
            title:
              c.title === "New session" && firstUser
                ? deriveTitle(firstUser.content)
                : c.title,
            updatedAt: Date.now(),
          };
        })
      );
    },
    []
  );

  return {
    conversations,
    active,
    activeId,
    hydrated,
    setActiveId,
    newConversation,
    deleteConversation,
    updateMessages,
  };
}
