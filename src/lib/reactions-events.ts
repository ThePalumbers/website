export type ReactionsEventPayload = {
  type: "reaction.changed";
  feedbackId: string;
  businessId: string | null;
  reactionTypeId: string | null;
  status: "upserted" | "deleted";
  counts: {
    useful: number;
    funny: number;
    cool: number;
  };
  updatedAt: string;
};
