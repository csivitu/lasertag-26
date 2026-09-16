"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type FetchWithSignal = (signal: AbortSignal) => Promise<void>;

interface UsePollOptions {
  /** ms between background ticks. Default 30000. */
  intervalMs?: number;
  /** When true, background ticks are skipped (e.g. a mutation is in flight). */
  paused?: boolean;
}

/**
 * Gentle polling: ticks only while the tab is visible, cancels the in-flight
 * request before starting a new one, and refetches on window focus.
 *
 * Background ticks are silent — the hook exposes `refreshing` separately from
 * whatever initial `loading` state the page owns, so polls never flash a
 * full-page loader. The fetch function receives an AbortSignal and must pass
 * it through to apiFetch; aborted ticks resolve quietly.
 */
export function usePoll(fetchFn: FetchWithSignal, options: UsePollOptions = {}) {
  const { intervalMs = 30000, paused = false } = options;
  const [refreshing, setRefreshing] = useState(false);
  const fetchRef = useRef(fetchFn);
  fetchRef.current = fetchFn;
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const abortRef = useRef<AbortController | null>(null);

  const tick = useCallback(async (silent: boolean) => {
    if (pausedRef.current) return;
    if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    if (silent) setRefreshing(true);
    try {
      await fetchRef.current(controller.signal);
    } catch {
      // Aborts and transient poll failures stay silent — the next tick retries.
    } finally {
      if (!controller.signal.aborted && silent) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    // Initial load is the page's own job (its `loading` state); here we only
    // arm the background timer, focus refetch, and cleanup.
    let lastFocus = 0;
    const onFocus = () => {
      // Debounce: focus fires alongside visibilitychange and on mount.
      const now = Date.now();
      if (now - lastFocus < 2000) return;
      lastFocus = now;
      void tick(true);
    };
    const interval = setInterval(() => void tick(true), intervalMs);
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      abortRef.current?.abort();
    };
  }, [intervalMs, tick]);

  const refreshNow = useCallback(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    return fetchRef.current(controller.signal);
  }, []);

  return { refreshing, refreshNow };
}
