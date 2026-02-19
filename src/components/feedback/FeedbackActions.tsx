"use client";

import { useEffect, useState } from "react";
import { PencilLine, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { StarRating } from "@/components/feedback/StarRating";

type Props = {
  feedback: {
    id: string;
    userId: string;
    businessId: string;
    type: "review" | "tip";
    text: string | null;
    rating: number | null;
  };
  currentUserId: string | null;
  detailRedirectTo?: string;
  mode?: "full" | "editOnly";
};

export function FeedbackActions({ feedback, currentUserId, detailRedirectTo, mode = "full" }: Props) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [text, setText] = useState(feedback.text ?? "");
  const [rating, setRating] = useState<number | null>(feedback.type === "review" ? feedback.rating : null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editOpen) {
      setText(feedback.text ?? "");
      setRating(feedback.type === "review" ? feedback.rating : null);
      setError(null);
    }
  }, [editOpen, feedback.rating, feedback.text, feedback.type]);

  if (!currentUserId || currentUserId !== feedback.userId) return null;

  async function submitEdit() {
    setError(null);
    if (feedback.type === "review" && rating == null) {
      setError("Review requires rating.");
      return;
    }

    setSaving(true);
    const payload: Record<string, unknown> = { text };
    if (feedback.type === "review") payload.rating = rating;

    const res = await fetch(`/api/feedback/${feedback.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    setSaving(false);

    if (!res.ok) {
      if (res.status === 401) setError("Login required.");
      else if (res.status === 403) setError("You can only edit/delete your own feedback.");
      else setError((data as { error?: string }).error ?? "Unable to update feedback.");
      return;
    }

    setEditOpen(false);
    router.refresh();
  }

  async function submitDelete() {
    setError(null);
    setDeleting(true);

    const res = await fetch(`/api/feedback/${feedback.id}`, {
      method: "DELETE",
    });

    const data = await res.json().catch(() => ({}));
    setDeleting(false);

    if (!res.ok) {
      if (res.status === 401) setError("Login required.");
      else if (res.status === 403) setError("You can only edit/delete your own feedback.");
      else setError((data as { error?: string }).error ?? "Unable to delete feedback.");
      return;
    }

    setDeleteOpen(false);
    if (detailRedirectTo) {
      router.push(detailRedirectTo);
      return;
    }
    router.refresh();
  }

  return (
    <>
      {mode === "editOnly" ? (
        <Button variant="outline" size="sm" className="h-8" onClick={() => setEditOpen(true)}>
          <PencilLine className="mr-1.5 h-3.5 w-3.5" />
          Edit my review
        </Button>
      ) : (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" aria-label="Edit feedback" className="h-8 w-8 px-0 text-muted-foreground" onClick={() => setEditOpen(true)}>
            <PencilLine className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            aria-label="Delete feedback"
            className="h-8 w-8 px-0 text-muted-foreground hover:text-destructive"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="p-4 sm:p-5">
          <DialogTitle className="text-sm font-semibold">Edit feedback</DialogTitle>
          <div className="space-y-3">
            {feedback.type === "review" ? (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Rating</p>
                <StarRating value={rating} onChange={setRating} />
              </div>
            ) : null}
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Text</p>
              <textarea
                className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </div>
            {error ? <p className="text-xs text-destructive">{error}</p> : null}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={submitEdit} disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="p-4 sm:p-5">
          <DialogTitle className="text-sm font-semibold">Delete your feedback?</DialogTitle>
          <p className="mt-2 text-sm text-muted-foreground">This can’t be undone.</p>
          {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button onClick={submitDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
