"use client";

import { useEffect, useRef } from "react";

type Handlers = {
  onSearch?: () => void;
  onEscape?: () => void;
  enabled?: boolean;
};

const isTyping = (el: EventTarget | null) =>
  el instanceof HTMLElement &&
  (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);

// Lightweight global shortcuts: `/` focuses search, `Escape` blurs/clears.
// (Ported from v1's useKeyboardShortcuts; row-level N/E/D and arrow paging are
// not carried over — the new table has no row-selection model.)
export function useKeyboardShortcuts(handlers: Handlers) {
  const ref = useRef(handlers);
  ref.current = handlers;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const h = ref.current;
      if (h.enabled === false) return;
      if (e.key === "Escape") {
        h.onEscape?.();
        return;
      }
      if (isTyping(e.target)) return;
      if (e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        h.onSearch?.();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}
