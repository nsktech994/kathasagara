import { eq, desc, and, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, stories, userFavorites, readingHistory, aiChatHistory, readAlongRecordings } from "../drizzle/schema";
import { ENV } from './_core/env';
import { mockDb } from "./db.mock";

type DrizzleInstance = ReturnType<typeof drizzle>;

let _db: DrizzleInstance | null = null;

/** Live Drizzle connection, or the in-memory mock when no DB URL / connection fails. */
async function resolveDb(): Promise<
  { mode: "drizzle"; db: DrizzleInstance } | { mode: "mock" }
> {
  if (!process.env.DATABASE_URL) {
    return { mode: "mock" };
  }

  if (!_db) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      return { mode: "mock" };
    }
  }

  if (_db) {
    return { mode: "drizzle", db: _db };
  }
  return { mode: "mock" };
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const resolved = await resolveDb();
  if (resolved.mode === "mock") {
    await mockDb.upsertUser(user);
    return;
  }
  const db = resolved.db;

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = [
      "name",
      "email",
      "loginMethod",
      "openRouterApiKey",
      "openRouterModel",
      "ageGroup",
    ] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.readingInterests !== undefined) {
      values.readingInterests = user.readingInterests;
      updateSet.readingInterests = user.readingInterests;
    }

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const resolved = await resolveDb();
  if (resolved.mode === "mock") {
    return mockDb.getUserByOpenId(openId);
  }
  const db = resolved.db;

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Story queries
 */
export async function getStories(category?: string, limit: number = 20, offset: number = 0) {
  const resolved = await resolveDb();
  if (resolved.mode === "mock") {
    return mockDb.getStories(category, limit, offset);
  }
  const db = resolved.db;

  if (category) {
    return await db
      .select()
      .from(stories)
      .where(eq(stories.category, category))
      .orderBy(desc(stories.createdAt))
      .limit(limit)
      .offset(offset);
  }

  return await db
    .select()
    .from(stories)
    .orderBy(desc(stories.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getStoryById(storyId: number) {
  const resolved = await resolveDb();
  if (resolved.mode === "mock") {
    return mockDb.getStoryById(storyId);
  }
  const db = resolved.db;

  const result = await db.select().from(stories).where(eq(stories.id, storyId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createStory(story: typeof stories.$inferInsert) {
  const resolved = await resolveDb();
  if (resolved.mode === "mock") {
    return mockDb.createStory(story);
  }
  const db = resolved.db;

  const result = await db.insert(stories).values(story);
  return result;
}

/**
 * Favorites queries
 */
export async function getUserFavorites(userId: number) {
  const resolved = await resolveDb();
  if (resolved.mode === "mock") {
    return mockDb.getUserFavorites(userId);
  }
  const db = resolved.db;

  const favorites = await db
    .select()
    .from(userFavorites)
    .where(eq(userFavorites.userId, userId));

  const storyIds = favorites.map((f: { storyId: number }) => f.storyId);
  if (storyIds.length === 0) return [];

  return await db.select().from(stories).where(
    inArray(stories.id, storyIds)
  );
}

export async function addToFavorites(userId: number, storyId: number) {
  const resolved = await resolveDb();
  if (resolved.mode === "mock") {
    return mockDb.addToFavorites(userId, storyId);
  }
  const db = resolved.db;

  return await db.insert(userFavorites).values({ userId, storyId });
}

export async function removeFromFavorites(userId: number, storyId: number) {
  const resolved = await resolveDb();
  if (resolved.mode === "mock") {
    return mockDb.removeFromFavorites(userId, storyId);
  }
  const db = resolved.db;

  return await db
    .delete(userFavorites)
    .where(and(eq(userFavorites.userId, userId), eq(userFavorites.storyId, storyId)));
}

export async function isFavorited(userId: number, storyId: number) {
  const resolved = await resolveDb();
  if (resolved.mode === "mock") {
    return mockDb.isFavorited(userId, storyId);
  }
  const db = resolved.db;

  const result = await db
    .select()
    .from(userFavorites)
    .where(and(eq(userFavorites.userId, userId), eq(userFavorites.storyId, storyId)))
    .limit(1);

  return result.length > 0;
}

/**
 * Reading history queries
 */
export async function getReadingHistory(userId: number) {
  const resolved = await resolveDb();
  if (resolved.mode === "mock") {
    return mockDb.getReadingHistory(userId);
  }
  const db = resolved.db;

  return await db
    .select()
    .from(readingHistory)
    .where(eq(readingHistory.userId, userId))
    .orderBy(desc(readingHistory.lastReadAt));
}

export async function updateReadingProgress(userId: number, storyId: number, progressPercentage: number, readingTimeSeconds: number) {
  const resolved = await resolveDb();
  if (resolved.mode === "mock") {
    return mockDb.updateReadingProgress(userId, storyId, progressPercentage, readingTimeSeconds);
  }
  const db = resolved.db;

  const existing = await db
    .select()
    .from(readingHistory)
    .where(and(eq(readingHistory.userId, userId), eq(readingHistory.storyId, storyId)))
    .limit(1);

  if (existing.length > 0) {
    return await db
      .update(readingHistory)
      .set({
        progressPercentage,
        readingTimeSeconds,
        lastReadAt: new Date(),
      })
      .where(and(eq(readingHistory.userId, userId), eq(readingHistory.storyId, storyId)));
  } else {
    return await db.insert(readingHistory).values({
      userId,
      storyId,
      progressPercentage,
      readingTimeSeconds,
    });
  }
}

/**
 * AI Chat history queries
 */
export async function getChatHistory(userId: number, storyId: number) {
  const resolved = await resolveDb();
  if (resolved.mode === "mock") {
    return mockDb.getChatHistory(userId, storyId);
  }
  const db = resolved.db;

  return await db
    .select()
    .from(aiChatHistory)
    .where(and(eq(aiChatHistory.userId, userId), eq(aiChatHistory.storyId, storyId)))
    .orderBy(aiChatHistory.createdAt);
}

export async function saveChatMessage(userId: number, storyId: number, userMessage: string, aiResponse: string) {
  const resolved = await resolveDb();
  if (resolved.mode === "mock") {
    return mockDb.saveChatMessage(userId, storyId, userMessage, aiResponse);
  }
  const db = resolved.db;

  return await db.insert(aiChatHistory).values({
    userId,
    storyId,
    userMessage,
    aiResponse,
  });
}

/**
 * Read-along recordings queries
 */
export async function saveReadAlongRecording(userId: number, storyId: number, audioUrl: string, transcription?: string, durationSeconds?: number) {
  const resolved = await resolveDb();
  if (resolved.mode === "mock") {
    return mockDb.saveReadAlongRecording(userId, storyId, audioUrl, transcription, durationSeconds);
  }
  const db = resolved.db;

  return await db.insert(readAlongRecordings).values({
    userId,
    storyId,
    audioUrl,
    transcription,
    durationSeconds,
  });
}

export async function getUserReadAlongRecordings(userId: number, storyId: number) {
  const resolved = await resolveDb();
  if (resolved.mode === "mock") {
    return mockDb.getUserReadAlongRecordings(userId, storyId);
  }
  const db = resolved.db;

  return await db
    .select()
    .from(readAlongRecordings)
    .where(and(eq(readAlongRecordings.userId, userId), eq(readAlongRecordings.storyId, storyId)))
    .orderBy(desc(readAlongRecordings.createdAt));
}
