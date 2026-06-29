"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, Cpu } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ModelInfo } from "@/lib/useModels";

interface Props {
  models: ModelInfo[];
  selected: string;
  current?: ModelInfo;
  onSelect: (id: string) => void;
  disabled?: boolean;
}

export default function ModelSelector({
  models,
  selected,
  current,
  onSelect,
  disabled,
}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Dismiss on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => !disabled && setOpen((v) => !v)}
        disabled={disabled}
        className={`flex items-center gap-2 rounded-btn border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[12px] font-medium text-secondary transition-colors hover:border-white/20 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50 ${
          open ? "border-white/25 text-primary" : ""
        }`}
      >
        <Cpu className="h-3.5 w-3.5 text-accent" />
        <span>{current?.label ?? "Model"}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-muted transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="absolute right-0 top-[calc(100%+8px)] z-50 w-[260px] overflow-hidden rounded-card border border-white/10 bg-elevated/95 p-1.5 shadow-card-hover backdrop-blur-xl"
          >
            <div className="label px-2.5 pb-1.5 pt-1">Model</div>
            {models.map((m) => {
              const active = m.id === selected;
              return (
                <button
                  key={m.id}
                  onClick={() => {
                    onSelect(m.id);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-3 rounded-md px-2.5 py-2 text-left transition-colors ${
                    active
                      ? "bg-white/[0.07]"
                      : "hover:bg-white/[0.04]"
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-medium text-primary">
                      {m.label}
                    </span>
                    <span className="block truncate text-[11px] text-muted">
                      {m.hint}
                    </span>
                  </span>
                  {active && <Check className="h-4 w-4 shrink-0 text-accent" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
