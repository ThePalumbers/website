import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const TARGET = 100;

async function main() {
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

  const counts = {
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

  console.log("DB counts by model:");
  for (const [model, n] of Object.entries(counts)) {
    console.log(`- ${model}: ${n}`);
  }

  const below = Object.entries(counts).filter(([, n]) => n < TARGET);
  if (below.length > 0) {
    console.log(`\nBelow ${TARGET}:`);
    for (const [model, n] of below) {
      console.log(`- ${model}: ${n}`);
    }
    process.exitCode = 2;
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
