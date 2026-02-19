import { requireSessionUser } from "@/lib/auth";
import { fail, handleApiError } from "@/lib/http";
import { hasUnread, subscribe, type AppNotification } from "@/lib/notifications-store";

export const runtime = "nodejs";

export async function GET(request: Request) {
  let userId: string;
  try {
    const user = await requireSessionUser();
    userId = user.id;
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return fail("Please login first.", 401);
    }
    return handleApiError(error);
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const write = (chunk: string) => {
        controller.enqueue(encoder.encode(chunk));
      };

      const unsubscribe = subscribe(userId, (notification: AppNotification) => {
        write("event: notification\n");
        write(`data: ${JSON.stringify({ notification, hasUnread: true })}\n\n`);
      });

      const ping = setInterval(() => {
        write(": ping\n\n");
      }, 25000);

      const onAbort = () => {
        clearInterval(ping);
        unsubscribe();
        request.signal.removeEventListener("abort", onAbort);
        try {
          controller.close();
        } catch {
          // already closed
        }
      };

      request.signal.addEventListener("abort", onAbort);
      write(`event: ready\ndata: ${JSON.stringify({ ok: true, hasUnread: hasUnread(userId) })}\n\n`);
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
