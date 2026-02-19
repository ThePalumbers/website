export type ReactionsEventPayload = {
  feedbackId: string;
  businessId?: string;
  counts?: Record<string, number>;
  myReaction?: string | null;
  kind: "upserted" | "deleted";
  ts: string;
};

type ReactionsEventListener = (payload: ReactionsEventPayload) => void;

function getListeners() {
  const globalState = globalThis as typeof globalThis & {
    __reactions_listeners__?: Set<ReactionsEventListener>;
  };

  if (!globalState.__reactions_listeners__) {
    globalState.__reactions_listeners__ = new Set<ReactionsEventListener>();
  }

  return globalState.__reactions_listeners__;
}

export function publishReactionEvent(payload: ReactionsEventPayload): void {
  const listeners = getListeners();
  listeners.forEach((listener) => listener(payload));
}

export function subscribeReactionEvents(cb: (payload: ReactionsEventPayload) => void): () => void {
  const listeners = getListeners();
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}
