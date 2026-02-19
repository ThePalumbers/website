-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."FeedbackType" AS ENUM ('review', 'tip');

-- CreateEnum
CREATE TYPE "public"."FriendshipStatus" AS ENUM ('pending', 'accepted', 'rejected');

-- CreateTable
CREATE TABLE "public"."USERS" (
    "Id" CHAR(22) NOT NULL,
    "Name" VARCHAR(32) NOT NULL,
    "RegistrationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "USERS_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "public"."BUSINESSES" (
    "Id" CHAR(22) NOT NULL,
    "Name" VARCHAR(64) NOT NULL,
    "Street" VARCHAR(120),
    "City" VARCHAR(64) NOT NULL,
    "State" VARCHAR(5) NOT NULL,
    "PostalCode" VARCHAR(10),
    "PositionLatitude" DECIMAL(10,6),
    "PositionLongitude" DECIMAL(10,6),

    CONSTRAINT "BUSINESSES_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "public"."TAGS" (
    "Id" CHAR(22) NOT NULL,
    "Name" VARCHAR(64) NOT NULL,

    CONSTRAINT "TAGS_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "public"."CATEGORIES" (
    "Id" CHAR(22) NOT NULL,
    "Name" VARCHAR(64) NOT NULL,

    CONSTRAINT "CATEGORIES_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "public"."BUSINESS_TAGS" (
    "BusinessId" CHAR(22) NOT NULL,
    "TagId" CHAR(22) NOT NULL,

    CONSTRAINT "BUSINESS_TAGS_pkey" PRIMARY KEY ("BusinessId","TagId")
);

-- CreateTable
CREATE TABLE "public"."BUSINESS_CATEGORIES" (
    "BusinessId" CHAR(22) NOT NULL,
    "CategoryId" CHAR(22) NOT NULL,

    CONSTRAINT "BUSINESS_CATEGORIES_pkey" PRIMARY KEY ("BusinessId","CategoryId")
);

-- CreateTable
CREATE TABLE "public"."BUSINESS_HOURS" (
    "Id" CHAR(22) NOT NULL,
    "BusinessId" CHAR(22) NOT NULL,
    "Weekday" INTEGER NOT NULL,
    "OpeningTime" TIMESTAMP(3) NOT NULL,
    "ClosingTime" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BUSINESS_HOURS_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "public"."CHECKINS" (
    "Id" CHAR(22) NOT NULL,
    "BusinessId" CHAR(22) NOT NULL,
    "Timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CHECKINS_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "public"."FEEDBACKS" (
    "Id" CHAR(22) NOT NULL,
    "Type" "public"."FeedbackType" NOT NULL,
    "UserId" CHAR(22) NOT NULL,
    "BusinessId" CHAR(22) NOT NULL,
    "Rating" INTEGER,
    "Text" VARCHAR(5000),
    "Timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FEEDBACKS_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "public"."REACTION_TYPES" (
    "Id" CHAR(22) NOT NULL,
    "Name" VARCHAR(15) NOT NULL,

    CONSTRAINT "REACTION_TYPES_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "public"."REACTIONS" (
    "Id" CHAR(22) NOT NULL,
    "UserId" CHAR(22) NOT NULL,
    "FeedbackId" CHAR(22) NOT NULL,
    "ReactionTypeId" CHAR(22),

    CONSTRAINT "REACTIONS_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "public"."LABELS" (
    "Id" CHAR(22) NOT NULL,
    "Name" VARCHAR(15) NOT NULL,

    CONSTRAINT "LABELS_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "public"."PHOTOS" (
    "Id" CHAR(22) NOT NULL,
    "UploaderId" CHAR(22),
    "BusinessId" CHAR(22) NOT NULL,
    "Data" BYTEA NOT NULL,
    "Description" VARCHAR(140),
    "LabelId" CHAR(22) NOT NULL,

    CONSTRAINT "PHOTOS_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "public"."APP_ACCOUNTS" (
    "id" UUID NOT NULL,
    "user_id" CHAR(22) NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "APP_ACCOUNTS_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."APP_SESSIONS" (
    "id" UUID NOT NULL,
    "user_id" CHAR(22) NOT NULL,
    "token" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "APP_SESSIONS_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FRIENDSHIPS" (
    "id" UUID NOT NULL,
    "requester_id" CHAR(22) NOT NULL,
    "addressee_id" CHAR(22) NOT NULL,
    "status" "public"."FriendshipStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responded_at" TIMESTAMP(3),

    CONSTRAINT "FRIENDSHIPS_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BUSINESSES_City_idx" ON "public"."BUSINESSES"("City");

-- CreateIndex
CREATE INDEX "BUSINESS_HOURS_BusinessId_Weekday_idx" ON "public"."BUSINESS_HOURS"("BusinessId", "Weekday");

-- CreateIndex
CREATE INDEX "CHECKINS_BusinessId_Timestamp_idx" ON "public"."CHECKINS"("BusinessId", "Timestamp");

-- CreateIndex
CREATE INDEX "FEEDBACKS_BusinessId_Timestamp_idx" ON "public"."FEEDBACKS"("BusinessId", "Timestamp");

-- CreateIndex
CREATE INDEX "FEEDBACKS_UserId_Timestamp_idx" ON "public"."FEEDBACKS"("UserId", "Timestamp");

-- CreateIndex
CREATE INDEX "REACTIONS_FeedbackId_idx" ON "public"."REACTIONS"("FeedbackId");

-- CreateIndex
CREATE UNIQUE INDEX "REACTIONS_UserId_FeedbackId_key" ON "public"."REACTIONS"("UserId", "FeedbackId");

-- CreateIndex
CREATE INDEX "PHOTOS_BusinessId_idx" ON "public"."PHOTOS"("BusinessId");

-- CreateIndex
CREATE UNIQUE INDEX "APP_ACCOUNTS_email_key" ON "public"."APP_ACCOUNTS"("email");

-- CreateIndex
CREATE UNIQUE INDEX "APP_SESSIONS_token_key" ON "public"."APP_SESSIONS"("token");

-- CreateIndex
CREATE INDEX "APP_SESSIONS_token_idx" ON "public"."APP_SESSIONS"("token");

-- CreateIndex
CREATE INDEX "FRIENDSHIPS_status_requester_id_idx" ON "public"."FRIENDSHIPS"("status", "requester_id");

-- CreateIndex
CREATE INDEX "FRIENDSHIPS_status_addressee_id_idx" ON "public"."FRIENDSHIPS"("status", "addressee_id");

-- CreateIndex
CREATE UNIQUE INDEX "FRIENDSHIPS_requester_id_addressee_id_key" ON "public"."FRIENDSHIPS"("requester_id", "addressee_id");

-- AddForeignKey
ALTER TABLE "public"."BUSINESS_TAGS" ADD CONSTRAINT "BUSINESS_TAGS_BusinessId_fkey" FOREIGN KEY ("BusinessId") REFERENCES "public"."BUSINESSES"("Id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BUSINESS_TAGS" ADD CONSTRAINT "BUSINESS_TAGS_TagId_fkey" FOREIGN KEY ("TagId") REFERENCES "public"."TAGS"("Id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BUSINESS_CATEGORIES" ADD CONSTRAINT "BUSINESS_CATEGORIES_BusinessId_fkey" FOREIGN KEY ("BusinessId") REFERENCES "public"."BUSINESSES"("Id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BUSINESS_CATEGORIES" ADD CONSTRAINT "BUSINESS_CATEGORIES_CategoryId_fkey" FOREIGN KEY ("CategoryId") REFERENCES "public"."CATEGORIES"("Id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BUSINESS_HOURS" ADD CONSTRAINT "BUSINESS_HOURS_BusinessId_fkey" FOREIGN KEY ("BusinessId") REFERENCES "public"."BUSINESSES"("Id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CHECKINS" ADD CONSTRAINT "CHECKINS_BusinessId_fkey" FOREIGN KEY ("BusinessId") REFERENCES "public"."BUSINESSES"("Id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FEEDBACKS" ADD CONSTRAINT "FEEDBACKS_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES "public"."USERS"("Id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FEEDBACKS" ADD CONSTRAINT "FEEDBACKS_BusinessId_fkey" FOREIGN KEY ("BusinessId") REFERENCES "public"."BUSINESSES"("Id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."REACTIONS" ADD CONSTRAINT "REACTIONS_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES "public"."USERS"("Id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."REACTIONS" ADD CONSTRAINT "REACTIONS_FeedbackId_fkey" FOREIGN KEY ("FeedbackId") REFERENCES "public"."FEEDBACKS"("Id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."REACTIONS" ADD CONSTRAINT "REACTIONS_ReactionTypeId_fkey" FOREIGN KEY ("ReactionTypeId") REFERENCES "public"."REACTION_TYPES"("Id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PHOTOS" ADD CONSTRAINT "PHOTOS_UploaderId_fkey" FOREIGN KEY ("UploaderId") REFERENCES "public"."USERS"("Id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PHOTOS" ADD CONSTRAINT "PHOTOS_BusinessId_fkey" FOREIGN KEY ("BusinessId") REFERENCES "public"."BUSINESSES"("Id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PHOTOS" ADD CONSTRAINT "PHOTOS_LabelId_fkey" FOREIGN KEY ("LabelId") REFERENCES "public"."LABELS"("Id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."APP_ACCOUNTS" ADD CONSTRAINT "APP_ACCOUNTS_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."USERS"("Id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."APP_SESSIONS" ADD CONSTRAINT "APP_SESSIONS_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."USERS"("Id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FRIENDSHIPS" ADD CONSTRAINT "FRIENDSHIPS_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "public"."USERS"("Id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FRIENDSHIPS" ADD CONSTRAINT "FRIENDSHIPS_addressee_id_fkey" FOREIGN KEY ("addressee_id") REFERENCES "public"."USERS"("Id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddCheckConstraints
ALTER TABLE "public"."FEEDBACKS"
ADD CONSTRAINT "FEEDBACKS_rating_by_type_chk"
CHECK (
  ("Type" = 'tip' AND "Rating" IS NULL) OR
  ("Type" = 'review' AND "Rating" BETWEEN 1 AND 5)
);

ALTER TABLE "public"."FRIENDSHIPS"
ADD CONSTRAINT "FRIENDSHIPS_self_request_chk"
CHECK ("requester_id" <> "addressee_id");
