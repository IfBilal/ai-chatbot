"use client";

import { useEffect, useState } from "react";

export interface ModelInfo {
  id: string;
  label: string;
  hint: string;
}

const FALLBACK: ModelInfo[] = [
  { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B", hint: "Most capable" },
  { id: "llama-3.1-8b-instant", label: "Llama 3.1 8B", hint: "Fastest" },
];

const PREF_KEY = "aichatbot.model.v1";

/**
 * Loads the available model list from the backend and tracks the user's
 * selection (persisted to localStorage).
 */
export function useModels() {
  const [models, setModels] = useState<ModelInfo[]>(FALLBACK);
  const [selected, setSelected] = useState<string>(FALLBACK[0].id);

  useEffect(() => {
    let alive = true;
    fetch("/api/models")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: { models: ModelInfo[]; default: string }) => {
        if (!alive || !Array.isArray(d.models) || d.models.length === 0) return;
        setModels(d.models);
        const saved =
          typeof window !== "undefined"
            ? window.localStorage.getItem(PREF_KEY)
            : null;
        const valid = d.models.find((m) => m.id === saved);
        setSelected(valid ? valid.id : d.default || d.models[0].id);
      })
      .catch(() => {
        /* keep fallback */
      });
    return () => {
      alive = false;
    };
  }, []);

  const select = (id: string) => {
    setSelected(id);
    window.localStorage.setItem(PREF_KEY, id);
  };

  const current = models.find((m) => m.id === selected) ?? models[0];

  return { models, selected, current, select };
}
