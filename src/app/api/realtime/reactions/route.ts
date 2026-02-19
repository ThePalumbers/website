import { z } from "zod";
import { subscribeReactionEvents, type ReactionsEventPayload } from "@/lib/reactions-realtime";

export const runtime = "nodejs";

const querySchema = z.object({
  businessId: z.string().length(22).optional(),
  feedbackId: z.string().length(22).optional(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = querySchema.safeParse({
    businessId: searchParams.get("businessId") ?? undefined,
    feedbackId: searchParams.get("feedbackId") ?? undefined,
  });

  if (!query.success) {
    return new Response(JSON.stringify({ error: "Invalid query params." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();
  const { businessId, feedbackId } = query.data;

  const stream = new ReadableStream({
    start(controller) {
      const write = (chunk: string) => {
        controller.enqueue(encoder.encode(chunk));
      };

      const matches = (event: ReactionsEventPayload) => {
        if (feedbackId && event.feedbackId !== feedbackId) return false;
        if (businessId && event.businessId !== businessId) return false;
        return true;
      };

      const unsubscribe = subscribeReactionEvents((event) => {
        if (!matches(event)) return;
        write(`event: reaction\n`);
        write(`data: ${JSON.stringify(event)}\n\n`);
      });

      const ping = setInterval(() => {
        write(`: ping\n\n`);
      }, 25000);

      const onAbort = () => {
        clearInterval(ping);
        unsubscribe();
        request.signal.removeEventListener("abort", onAbort);
        try {
          controller.close();
        } catch {
          // stream already closed
        }
      };

      request.signal.addEventListener("abort", onAbort);
      write(`event: ready\ndata: {"ok":true}\n\n`);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
