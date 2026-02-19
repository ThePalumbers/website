import bcrypt from "bcryptjs";
import { createHash } from "crypto";
import { FeedbackType, FriendshipStatus, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const TARGET = 100;
const MAX_ATTEMPTS = 4000;

const CITIES = [
  { city: "Springfield", state: "IL" },
  { city: "Riverton", state: "CA" },
  { city: "Northfield", state: "NY" },
  { city: "Lakeview", state: "TX" },
  { city: "Fairmont", state: "WA" },
  { city: "Brookside", state: "OR" },
  { city: "Hillcrest", state: "CO" },
  { city: "Maplewood", state: "AZ" },
];

function id22(seed: string) {
  const encoded = createHash("sha1").update(seed).digest("base64url");
  return encoded.slice(0, 22);
}

function uuidFromSeed(seed: string) {
  const hex = createHash("sha1").update(seed).digest("hex").slice(0, 32).split("");
  hex[12] = "5";
  hex[16] = "a";
  const s = hex.join("");
  return `${s.slice(0, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}-${s.slice(16, 20)}-${s.slice(20, 32)}`;
}

function rotation<T>(arr: T[], index: number) {
  return arr[index % arr.length]!;
}

async function ensureUsers() {
  let count = await prisma.user.count();

  for (let i = 1; count < TARGET && i <= MAX_ATTEMPTS; i += 1) {
    const id = id22(`seed-user-${i}`);
    const exists = await prisma.user.findUnique({ where: { id }, select: { id: true } });
    if (exists) continue;

    await prisma.user.create({
      data: {
        id,
        name: `seed_user_${String(i).padStart(2, "0")}`,
      },
    });
    count += 1;
  }
}

async function ensureBusinesses() {
  let count = await prisma.business.count();

  for (let i = 1; count < TARGET && i <= MAX_ATTEMPTS; i += 1) {
    const id = id22(`seed-business-${i}`);
    const exists = await prisma.business.findUnique({ where: { id }, select: { id: true } });
    if (exists) continue;

    const geo = rotation(CITIES, i - 1);
    await prisma.business.create({
      data: {
        id,
        name: `Synthetic Business ${String(i).padStart(2, "0")}`,
        street: `${100 + i} Seed Avenue`,
        city: geo.city,
        state: geo.state,
        postalCode: String(10000 + i),
      },
    });
    count += 1;
  }
}

async function ensureCategories() {
  let count = await prisma.category.count();

  for (let i = 1; count < TARGET && i <= MAX_ATTEMPTS; i += 1) {
    const id = id22(`seed-category-${i}`);
    const exists = await prisma.category.findUnique({ where: { id }, select: { id: true } });
    if (exists) continue;

    await prisma.category.create({
      data: { id, name: `Category ${String(i).padStart(2, "0")}` },
    });
    count += 1;
  }
}

async function ensureTags() {
  let count = await prisma.tag.count();

  for (let i = 1; count < TARGET && i <= MAX_ATTEMPTS; i += 1) {
    const id = id22(`seed-tag-${i}`);
    const exists = await prisma.tag.findUnique({ where: { id }, select: { id: true } });
    if (exists) continue;

    await prisma.tag.create({
      data: { id, name: `Tag ${String(i).padStart(2, "0")}` },
    });
    count += 1;
  }
}

async function ensureReactionTypes() {
  let count = await prisma.reactionType.count();

  for (let i = 1; count < TARGET && i <= MAX_ATTEMPTS; i += 1) {
    const id = id22(`seed-reaction-type-${i}`);
    const exists = await prisma.reactionType.findUnique({ where: { id }, select: { id: true } });
    if (exists) continue;

    await prisma.reactionType.create({
      data: { id, name: `rt${String(i).padStart(2, "0")}` },
    });
    count += 1;
  }
}

async function ensureLabels() {
  let count = await prisma.label.count();

  for (let i = 1; count < TARGET && i <= MAX_ATTEMPTS; i += 1) {
    const id = id22(`seed-label-${i}`);
    const exists = await prisma.label.findUnique({ where: { id }, select: { id: true } });
    if (exists) continue;

    await prisma.label.create({
      data: { id, name: `lb${String(i).padStart(2, "0")}` },
    });
    count += 1;
  }
}

async function ensureBusinessCategories(businessIds: string[], categoryIds: string[]) {
  let count = await prisma.businessCategory.count();
  let cursor = 0;

  while (count < TARGET && cursor < MAX_ATTEMPTS) {
    const businessId = businessIds[cursor % businessIds.length]!;
    const categoryId = categoryIds[Math.floor(cursor / businessIds.length) % categoryIds.length]!;

    const exists = await prisma.businessCategory.findUnique({
      where: { businessId_categoryId: { businessId, categoryId } },
      select: { businessId: true },
    });

    if (!exists) {
      await prisma.businessCategory.create({ data: { businessId, categoryId } });
      count += 1;
    }

    cursor += 1;
  }
}

async function ensureBusinessTags(businessIds: string[], tagIds: string[]) {
  let count = await prisma.businessTag.count();
  let cursor = 0;

  while (count < TARGET && cursor < MAX_ATTEMPTS) {
    const businessId = businessIds[cursor % businessIds.length]!;
    const tagId = tagIds[Math.floor(cursor / businessIds.length) % tagIds.length]!;

    const exists = await prisma.businessTag.findUnique({
      where: { businessId_tagId: { businessId, tagId } },
      select: { businessId: true },
    });

    if (!exists) {
      await prisma.businessTag.create({ data: { businessId, tagId } });
      count += 1;
    }

    cursor += 1;
  }
}

async function ensureFeedbacks(userIds: string[], businessIds: string[]) {
  let count = await prisma.feedback.count();

  for (let i = 1; count < TARGET && i <= MAX_ATTEMPTS; i += 1) {
    const id = id22(`seed-feedback-${i}`);
    const exists = await prisma.feedback.findUnique({ where: { id }, select: { id: true } });
    if (exists) continue;

    const type = i % 3 === 0 ? FeedbackType.tip : FeedbackType.review;
    await prisma.feedback.create({
      data: {
        id,
        type,
        userId: rotation(userIds, i - 1),
        businessId: rotation(businessIds, i + 3),
        text: `Synthetic feedback #${i} generated for deterministic seeding.`,
        rating: type === FeedbackType.review ? ((i - 1) % 5) + 1 : null,
        timestamp: new Date(Date.UTC(2024, 0, 1, 0, i % 60, 0)),
      },
    });
    count += 1;
  }
}

async function ensureReactions(userIds: string[], feedbackIds: string[], reactionTypeIds: string[]) {
  let count = await prisma.reaction.count();
  let cursor = 0;

  while (count < TARGET && cursor < MAX_ATTEMPTS) {
    const userId = userIds[cursor % userIds.length]!;
    const feedbackId = feedbackIds[Math.floor(cursor / userIds.length) % feedbackIds.length]!;

    const exists = await prisma.reaction.findUnique({
      where: { userId_feedbackId: { userId, feedbackId } },
      select: { id: true },
    });

    if (!exists) {
      await prisma.reaction.create({
        data: {
          id: id22(`seed-reaction-${userId}-${feedbackId}`),
          userId,
          feedbackId,
          reactionTypeId: rotation(reactionTypeIds, cursor),
        },
      });
      count += 1;
    }

    cursor += 1;
  }
}

async function ensureCheckins(businessIds: string[]) {
  let count = await prisma.checkin.count();

  for (let i = 1; count < TARGET && i <= MAX_ATTEMPTS; i += 1) {
    const id = id22(`seed-checkin-${i}`);
    const exists = await prisma.checkin.findUnique({ where: { id }, select: { id: true } });
    if (exists) continue;

    await prisma.checkin.create({
      data: {
        id,
        businessId: rotation(businessIds, i - 1),
        timestamp: new Date(Date.UTC(2024, 1, 1, i % 24, i % 60, 0)),
      },
    });
    count += 1;
  }
}

async function ensurePhotos(userIds: string[], businessIds: string[], labelIds: string[]) {
  let count = await prisma.photo.count();

  for (let i = 1; count < TARGET && i <= MAX_ATTEMPTS; i += 1) {
    const id = id22(`seed-photo-${i}`);
    const exists = await prisma.photo.findUnique({ where: { id }, select: { id: true } });
    if (exists) continue;

    await prisma.photo.create({
      data: {
        id,
        uploaderId: rotation(userIds, i - 1),
        businessId: rotation(businessIds, i + 1),
        labelId: rotation(labelIds, i + 2),
        data: Buffer.from(`synthetic-photo-${i}`, "utf8"),
        description: `Synthetic photo ${i}`,
      },
    });
    count += 1;
  }
}

async function ensureBusinessHours(businessIds: string[]) {
  let count = await prisma.businessHour.count();
  let cursor = 0;

  while (count < TARGET && cursor < MAX_ATTEMPTS) {
    const businessId = businessIds[Math.floor(cursor / 7) % businessIds.length]!;
    const weekday = cursor % 7;
    const id = id22(`seed-hour-${businessId}-${weekday}`);

    const exists = await prisma.businessHour.findUnique({ where: { id }, select: { id: true } });
    if (!exists) {
      await prisma.businessHour.create({
        data: {
          id,
          businessId,
          weekday,
          openingTime: new Date(Date.UTC(1970, 0, 1, 8, 0, 0)),
          closingTime: new Date(Date.UTC(1970, 0, 1, 18, 0, 0)),
        },
      });
      count += 1;
    }

    cursor += 1;
  }
}

async function ensureFriendships(userIds: string[]) {
  let count = await prisma.friendship.count();
  let cursor = 0;

  while (count < TARGET && cursor < MAX_ATTEMPTS) {
    const requesterIdx = cursor % userIds.length;
    const addresseeIdx = Math.floor(cursor / userIds.length) % userIds.length;

    if (requesterIdx === addresseeIdx) {
      cursor += 1;
      continue;
    }

    const requesterId = userIds[requesterIdx]!;
    const addresseeId = userIds[addresseeIdx]!;
    const statusCycle = [FriendshipStatus.pending, FriendshipStatus.accepted, FriendshipStatus.rejected] as const;
    const status = statusCycle[cursor % statusCycle.length]!;

    const exists = await prisma.friendship.findUnique({
      where: { requesterId_addresseeId: { requesterId, addresseeId } },
      select: { id: true },
    });

    if (!exists) {
      await prisma.friendship.create({
        data: {
          id: uuidFromSeed(`seed-friendship-${requesterId}-${addresseeId}`),
          requesterId,
          addresseeId,
          status,
          createdAt: new Date(Date.UTC(2024, 2, 1, 10, cursor % 60, 0)),
          respondedAt: status === FriendshipStatus.pending ? null : new Date(Date.UTC(2024, 2, 2, 11, cursor % 60, 0)),
        },
      });
      count += 1;
    }

    cursor += 1;
  }
}

async function ensureAppAccounts(userIds: string[], passwordHash: string) {
  let count = await prisma.appAccount.count();

  for (let i = 1; count < TARGET && i <= MAX_ATTEMPTS; i += 1) {
    const email = `seed_user_${String(i).padStart(2, "0")}@synthetic.local`;
    const exists = await prisma.appAccount.findUnique({ where: { email }, select: { id: true } });
    if (exists) continue;

    await prisma.appAccount.create({
      data: {
        userId: rotation(userIds, i - 1),
        email,
        passwordHash,
      },
    });
    count += 1;
  }
}

async function ensureAppSessions(userIds: string[]) {
  let count = await prisma.appSession.count();

  for (let i = 1; count < TARGET && i <= MAX_ATTEMPTS; i += 1) {
    const token = `seed_session_${id22(`token-${i}`)}`;
    const exists = await prisma.appSession.findUnique({ where: { token }, select: { id: true } });
    if (exists) continue;

    await prisma.appSession.create({
      data: {
        id: uuidFromSeed(`seed-session-id-${i}`),
        userId: rotation(userIds, i - 1),
        token,
        createdAt: new Date(Date.UTC(2024, 3, 1, 9, i % 60, 0)),
        expiresAt: new Date(Date.UTC(2027, 0, 1, 0, 0, 0)),
      },
    });
    count += 1;
  }
}

async function getAllCounts() {
  const [
    user,
    business,
    tag,
    category,
    businessTag,
    businessCategory,
    businessHour,
    checkin,
    feedback,
    reactionType,
    reaction,
    label,
    photo,
    appAccount,
    appSession,
    friendship,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.business.count(),
    prisma.tag.count(),
    prisma.category.count(),
    prisma.businessTag.count(),
    prisma.businessCategory.count(),
    prisma.businessHour.count(),
    prisma.checkin.count(),
    prisma.feedback.count(),
    prisma.reactionType.count(),
    prisma.reaction.count(),
    prisma.label.count(),
    prisma.photo.count(),
    prisma.appAccount.count(),
    prisma.appSession.count(),
    prisma.friendship.count(),
  ]);

  return {
    User: user,
    Business: business,
    Tag: tag,
    Category: category,
    BusinessTag: businessTag,
    BusinessCategory: businessCategory,
    BusinessHour: businessHour,
    Checkin: checkin,
    Feedback: feedback,
    ReactionType: reactionType,
    Reaction: reaction,
    Label: label,
    Photo: photo,
    AppAccount: appAccount,
    AppSession: appSession,
    Friendship: friendship,
  };
}

async function main() {
  console.log(`Seeding synthetic dataset (target >= ${TARGET} per model)...`);

  await ensureUsers();
  await ensureBusinesses();
  await ensureCategories();
  await ensureTags();
  await ensureReactionTypes();
  await ensureLabels();

  const [users, businesses, categories, tags, reactionTypes, labels] = await Promise.all([
    prisma.user.findMany({ select: { id: true }, orderBy: { id: "asc" } }),
    prisma.business.findMany({ select: { id: true }, orderBy: { id: "asc" } }),
    prisma.category.findMany({ select: { id: true }, orderBy: { id: "asc" } }),
    prisma.tag.findMany({ select: { id: true }, orderBy: { id: "asc" } }),
    prisma.reactionType.findMany({ select: { id: true }, orderBy: { id: "asc" } }),
    prisma.label.findMany({ select: { id: true }, orderBy: { id: "asc" } }),
  ]);

  const userIds = users.map((x) => x.id);
  const businessIds = businesses.map((x) => x.id);
  const categoryIds = categories.map((x) => x.id);
  const tagIds = tags.map((x) => x.id);
  const reactionTypeIds = reactionTypes.map((x) => x.id);
  const labelIds = labels.map((x) => x.id);

  await ensureBusinessCategories(businessIds, categoryIds);
  await ensureBusinessTags(businessIds, tagIds);
  await ensureFeedbacks(userIds, businessIds);

  const feedbackIds = (await prisma.feedback.findMany({ select: { id: true }, orderBy: { id: "asc" } })).map((x) => x.id);

  await ensureReactions(userIds, feedbackIds, reactionTypeIds);
  await ensureCheckins(businessIds);
  await ensurePhotos(userIds, businessIds, labelIds);
  await ensureBusinessHours(businessIds);
  await ensureFriendships(userIds);

  const passwordHash = await bcrypt.hash("password123", 10);
  await ensureAppAccounts(userIds, passwordHash);
  await ensureAppSessions(userIds);

  const counts = await getAllCounts();
  const belowTarget = Object.entries(counts).filter(([, n]) => n < TARGET);

  console.log("\nSeed report (all models):");
  for (const [model, n] of Object.entries(counts)) {
    console.log(`- ${model}: ${n}`);
  }

  if (belowTarget.length > 0) {
    console.log("\nModels below target:");
    for (const [model, n] of belowTarget) {
      console.log(`- ${model}: ${n} (< ${TARGET})`);
    }
  } else {
    console.log(`\nAll models are >= ${TARGET}.`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
