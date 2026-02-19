CREATE UNIQUE INDEX IF NOT EXISTS feedback_one_review_per_user_business
ON "FEEDBACKS" ("UserId", "BusinessId")
WHERE "Type" = 'review';

