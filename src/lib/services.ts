import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { id22 } from "@/lib/id";
import { logQueryPayload } from "@/lib/debug/memory";

type BusinessFilters = {
  query?: string;
  city?: string;
  category?: string;
  tag?: string;
  openNow?: boolean;
  minRating?: number;
};

function buildBusinessWhere(filters: BusinessFilters): Prisma.BusinessWhereInput {
  const where: Prisma.BusinessWhereInput = {};

  if (filters.query) {
    where.name = { contains: filters.query, mode: "insensitive" };
  }

  if (filters.city) {
    where.city = { equals: filters.city, mode: "insensitive" };
  }

  if (filters.category) {
    where.businessCategories = {
      some: {
        category: {
          name: { equals: filters.category, mode: "insensitive" },
        },
      },
    };
  }

  if (filters.tag) {
    where.businessTags = {
      some: {
        tag: {
          name: { equals: filters.tag, mode: "insensitive" },
        },
      },
    };
  }

  if (filters.openNow) {
    const now = new Date();
    const weekday = (now.getDay() + 6) % 7;
    const timeOnly = new Date(Date.UTC(1970, 0, 1, now.getHours(), now.getMinutes(), now.getSeconds()));

    where.businessHours = {
      some: {
        weekday,
        openingTime: { lte: timeOnly },
        closingTime: { gte: timeOnly },
      },
    };
  }

  return where;
}

type BusinessListItem = {
  id: string;
  name: string;
  street: string | null;
  city: string;
  state: string;
  postalCode: string | null;
  avgRating: number | null;
  ratingsCount: number;
  categories: string[];
  tags: string[];
};

export async function listBusinessesPage(filters: BusinessFilters, page: number, take: number) {
  const safeTake = Math.min(take, 50);
  const skip = (Math.max(1, page) - 1) * safeTake;
  const where = buildBusinessWhere(filters);

  const mapItems = (
    rows: Array<{
      id: string;
      name: string;
      street: string | null;
      city: string;
      state: string;
      postalCode: string | null;
      businessCategories: Array<{ category: { name: string } }>;
      businessTags: Array<{ tag: { name: string } }>;
    }>,
    ratingsMap: Map<string, { avg: number | null; count: number }>,
  ): BusinessListItem[] =>
    rows.map((business) => {
      const rating = ratingsMap.get(business.id);
      return {
        id: business.id,
        name: business.name,
        street: business.street,
        city: business.city,
        state: business.state,
        postalCode: business.postalCode,
        avgRating: rating?.avg ?? null,
        ratingsCount: rating?.count ?? 0,
        categories: business.businessCategories.map((row) => row.category.name),
        tags: business.businessTags.map((row) => row.tag.name),
      };
    });

  if (filters.minRating == null) {
    const [total, rows] = await prisma.$transaction([
      prisma.business.count({ where }),
      prisma.business.findMany({
        where,
        skip,
        take: safeTake,
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          street: true,
          city: true,
          state: true,
          postalCode: true,
          businessCategories: { select: { category: { select: { name: true } } } },
          businessTags: { select: { tag: { select: { name: true } } } },
        },
      }),
    ]);

    const ids = rows.map((r) => r.id);
    const ratingAgg = ids.length
      ? await prisma.feedback.groupBy({
          by: ["businessId"],
          where: { businessId: { in: ids }, rating: { not: null } },
          _avg: { rating: true },
          _count: { _all: true },
        })
      : [];

    const ratingsMap = new Map(
      ratingAgg.map((r) => [r.businessId, { avg: r._avg.rating ?? null, count: r._count._all }]),
    );

    const items = mapItems(rows, ratingsMap);
    logQueryPayload("businesses.list.page", items, items.length);

    return {
      items,
      total,
      totalPages: Math.max(1, Math.ceil(total / safeTake)),
      page: Math.max(1, page),
      limit: safeTake,
    };
  }

  const idRows = await prisma.business.findMany({
    where,
    orderBy: { name: "asc" },
    select: { id: true },
  });
  const allIds = idRows.map((row) => row.id);

  const allRatings = allIds.length
    ? await prisma.feedback.groupBy({
        by: ["businessId"],
        where: { businessId: { in: allIds }, rating: { not: null } },
        _avg: { rating: true },
        _count: { _all: true },
      })
    : [];
  const ratingsMapAll = new Map(
    allRatings.map((r) => [r.businessId, { avg: r._avg.rating ?? null, count: r._count._all }]),
  );

  const filteredIds = allIds.filter((id) => (ratingsMapAll.get(id)?.avg ?? 0) >= filters.minRating!);
  const total = filteredIds.length;
  const pageIds = filteredIds.slice(skip, skip + safeTake);
  const pageOrder = new Map(pageIds.map((id, index) => [id, index]));

  const rows = pageIds.length
    ? await prisma.business.findMany({
        where: { id: { in: pageIds } },
        select: {
          id: true,
          name: true,
          street: true,
          city: true,
          state: true,
          postalCode: true,
          businessCategories: { select: { category: { select: { name: true } } } },
          businessTags: { select: { tag: { select: { name: true } } } },
        },
      })
    : [];

  rows.sort((a, b) => (pageOrder.get(a.id) ?? 0) - (pageOrder.get(b.id) ?? 0));
  const items = mapItems(rows, ratingsMapAll);
  logQueryPayload("businesses.list.page.minRating", items, items.length);

  return {
    items,
    total,
    totalPages: Math.max(1, Math.ceil(total / safeTake)),
    page: Math.max(1, page),
    limit: safeTake,
  };
}

export async function getBusinessById(id: string) {
  const business = await prisma.business.findUnique({
    where: { id },
    include: {
      businessCategories: { include: { category: true } },
      businessTags: { include: { tag: true } },
      businessHours: { orderBy: [{ weekday: "asc" }, { openingTime: "asc" }] },
      photos: {
        take: 20,
        select: {
          id: true,
          description: true,
          label: { select: { name: true } },
        },
      },
      checkins: {
        take: 50,
        orderBy: { timestamp: "desc" },
        select: { id: true, timestamp: true },
      },
    },
  });

  if (!business) return null;

  const ratings = await prisma.feedback.aggregate({
    where: { businessId: id, rating: { not: null } },
    _avg: { rating: true },
    _count: { _all: true },
  });

  const avgRating = ratings._avg.rating ?? null;
  const ratingsCount = ratings._count._all;

  const result = {
    ...business,
    avgRating,
    ratingsCount,
  };
  logQueryPayload("business.byId", result, 1);

  return result;
}

export async function getBusinessFeed(businessId: string, skip: number, take: number) {
  const safeTake = Math.min(Math.max(1, take), 50);
  const items = await prisma.feedback.findMany({
    where: { businessId },
    orderBy: [{ timestamp: "desc" }, { id: "desc" }],
    skip,
    take: safeTake,
    select: {
      id: true,
      type: true,
      userId: true,
      businessId: true,
      rating: true,
      text: true,
      timestamp: true,
      user: { select: { id: true, name: true } },
      reactions: {
        select: {
          id: true,
          userId: true,
          reactionType: { select: { id: true, name: true } },
        },
      },
    },
  });
  logQueryPayload("business.feed", items, items.length);
  return items;
}

export async function createFeedback(input: {
  type: "review" | "tip";
  businessId: string;
  text: string;
  rating?: number | null;
  userId: string;
}) {
  return prisma.feedback.create({
    data: {
      id: id22(),
      type: input.type,
      businessId: input.businessId,
      userId: input.userId,
      text: input.text,
      rating: input.type === "tip" ? null : input.rating ?? null,
    },
  });
}

export async function upsertReaction(input: {
  feedbackId: string;
  reactionTypeId: string;
  userId: string;
}) {
  return prisma.reaction.upsert({
    where: {
      userId_feedbackId: {
        userId: input.userId,
        feedbackId: input.feedbackId,
      },
    },
    create: {
      id: id22(),
      userId: input.userId,
      feedbackId: input.feedbackId,
      reactionTypeId: input.reactionTypeId,
    },
    update: {
      reactionTypeId: input.reactionTypeId,
    },
  });
}

export async function getUserProfile(username: string) {
  return prisma.user.findFirst({
    where: {
      name: { equals: username, mode: "insensitive" },
    },
    select: {
      id: true,
      name: true,
      registrationDate: true,
      feedbacks: {
        orderBy: { timestamp: "desc" },
        take: 20,
        select: {
          id: true,
          type: true,
          userId: true,
          businessId: true,
          rating: true,
          text: true,
          timestamp: true,
          business: { select: { id: true, name: true } },
          reactions: {
            select: {
              id: true,
              userId: true,
              reactionType: { select: { id: true, name: true } },
            },
          },
        },
      },
    },
  });
}

export async function sendFriendRequest(fromUserId: string, toUserId: string) {
  return prisma.friendship.upsert({
    where: {
      requesterId_addresseeId: {
        requesterId: fromUserId,
        addresseeId: toUserId,
      },
    },
    create: {
      requesterId: fromUserId,
      addresseeId: toUserId,
      status: "pending",
    },
    update: {
      status: "pending",
      respondedAt: null,
    },
  });
}

export async function respondToFriendRequest(params: {
  requestId: string;
  action: "accept" | "reject";
  currentUserId: string;
}) {
  const request = await prisma.friendship.findUnique({ where: { id: params.requestId } });

  if (!request || request.addresseeId !== params.currentUserId) {
    throw new Error("NOT_FOUND");
  }

  return prisma.friendship.update({
    where: { id: params.requestId },
    data: {
      status: params.action === "accept" ? "accepted" : "rejected",
      respondedAt: new Date(),
    },
  });
}

export async function listAcceptedFriends(userId: string) {
  const relations = await prisma.friendship.findMany({
    where: {
      status: "accepted",
      OR: [{ requesterId: userId }, { addresseeId: userId }],
    },
    include: {
      requester: { select: { id: true, name: true } },
      addressee: { select: { id: true, name: true } },
    },
  });

  return relations.map((row) =>
    row.requesterId === userId ? row.addressee : row.requester,
  );
}

export async function listPendingFriendships(userId: string) {
  const [incoming, outgoing] = await Promise.all([
    prisma.friendship.findMany({
      where: {
        status: "pending",
        addresseeId: userId,
      },
      include: {
        requester: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.friendship.findMany({
      where: {
        status: "pending",
        requesterId: userId,
      },
      include: {
        addressee: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return { incoming, outgoing };
}

export async function getFriendFeed(userId: string, skip: number, take: number) {
  const safeTake = Math.min(Math.max(1, take), 50);
  const accepted = await prisma.friendship.findMany({
    where: {
      status: "accepted",
      OR: [{ requesterId: userId }, { addresseeId: userId }],
    },
    select: {
      requesterId: true,
      addresseeId: true,
    },
  });

  const friendIds = accepted.map((r) => (r.requesterId === userId ? r.addresseeId : r.requesterId));

  if (!friendIds.length) return [];

  const items = await prisma.feedback.findMany({
    where: {
      userId: { in: friendIds },
    },
    select: {
      id: true,
      type: true,
      userId: true,
      businessId: true,
      rating: true,
      text: true,
      timestamp: true,
      user: { select: { id: true, name: true } },
      business: { select: { id: true, name: true, city: true, state: true } },
      reactions: {
        select: {
          id: true,
          userId: true,
          reactionType: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: [{ timestamp: "desc" }, { id: "desc" }],
    skip,
    take: safeTake,
  });
  logQueryPayload("friend.feed", items, items.length);
  return items;
}
