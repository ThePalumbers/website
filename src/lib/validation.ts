import { z } from "zod";

export const feedbackPayloadSchema = z
  .object({
    type: z.enum(["review", "tip"]),
    businessId: z.string().length(22),
    text: z.string().trim().min(1).max(5000),
    rating: z.number().int().min(1).max(5).nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "tip" && data.rating != null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["rating"],
        message: "Tip must have null rating.",
      });
    }

    if (data.type === "review" && data.rating == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["rating"],
        message: "Review requires rating.",
      });
    }
  });

export const reactionPayloadSchema = z.object({
  feedbackId: z.string().length(22),
  reactionTypeId: z.string().length(22),
});

export const friendshipRequestSchema = z.object({
  toUserId: z.string().length(22),
});

export const friendshipRespondSchema = z.object({
  requestId: z.string().uuid(),
  action: z.enum(["accept", "reject"]),
});

export const signupSchema = z.object({
  name: z.string().trim().min(2).max(32),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});
