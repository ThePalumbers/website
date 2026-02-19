"use client";

import { useEffect } from "react";
import type { ReactionsEventPayload } from "@/lib/reactions-realtime";

type ReactionsSubscriber = (payload: ReactionsEventPayload) => void;

type ReactionsStreamState = {
  source: EventSource | null;
  subscribers: Set<ReactionsSubscriber>;
};

declare global {
  interface Window {
    __reactions_stream_state__?: ReactionsStreamState;
  }
}

function getStreamState(): ReactionsStreamState {
  if (typeof window === "undefined") {
    return { source: null, subscribers: new Set() };
  }

  if (!window.__reactions_stream_state__) {
    window.__reactions_stream_state__ = {
      source: null,
      subscribers: new Set(),
    };
  }

  return window.__reactions_stream_state__;
}

function ensureSource(state: ReactionsStreamState) {
  if (state.source) return;

  const source = new EventSource("/api/realtime/reactions");
  source.addEventListener("reaction", (event) => {
    const message = event as MessageEvent<string>;
    try {
      const payload = JSON.parse(message.data) as ReactionsEventPayload;
      if (process.env.NODE_ENV !== "production") {
        console.debug("[realtime] reaction event", payload);
      }
      state.subscribers.forEach((subscriber) => subscriber(payload));
    } catch {
      // ignore malformed messages
    }
  });

  source.onerror = () => {
    // Keep the stream resilient in dev; browser auto-retries EventSource.
  };

  state.source = source;
}

export function useRealtimeReactions(
  filters: { businessId?: string; feedbackId?: string },
  onReaction: (payload: ReactionsEventPayload) => void,
) {
  useEffect(() => {
    const state = getStreamState();
    ensureSource(state);

    const handler: ReactionsSubscriber = (payload) => {
      if (filters.feedbackId && payload.feedbackId !== filters.feedbackId) return;
      if (filters.businessId && payload.businessId !== filters.businessId) return;
      onReaction(payload);
    };

    state.subscribers.add(handler);

    return () => {
      state.subscribers.delete(handler);
      if (!state.subscribers.size && state.source) {
        state.source.close();
        state.source = null;
      }
    };
  }, [filters.businessId, filters.feedbackId, onReaction]);
}
