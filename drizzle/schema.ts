import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  ageGroup: varchar("ageGroup", { length: 20 }), // e.g., "4-6", "7-9", "10-12", "13+"
  readingInterests: json("readingInterests").$type<string[]>(), // Array of category interests
  openRouterApiKey: text("openRouterApiKey"),
  openRouterModel: varchar("openRouterModel", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Stories table - stores both pre-written and AI-generated stories
 */
export const stories = mysqlTable("stories", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(), // Full story text
  category: varchar("category", { length: 50 }).notNull(), // fairy-tales, fables, adventure, mythology, etc.
  authorId: int("authorId"), // User ID if AI-generated, null if pre-written
  illustrationUrl: varchar("illustrationUrl", { length: 500 }), // URL to generated/stored illustration
  description: text("description"), // Short story description
  ageGroup: varchar("ageGroup", { length: 20 }), // Target age group
  readingTimeMinutes: int("readingTimeMinutes"), // Estimated reading time
  isAiGenerated: boolean("isAiGenerated").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Story = typeof stories.$inferSelect;
export type InsertStory = typeof stories.$inferInsert;

/**
 * Story chapters - for multi-chapter stories
 */
export const storyChapters = mysqlTable("storyChapters", {
  id: int("id").autoincrement().primaryKey(),
  storyId: int("storyId").notNull(),
  chapterNumber: int("chapterNumber").notNull(),
  title: varchar("title", { length: 255 }),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type StoryChapter = typeof storyChapters.$inferSelect;
export type InsertStoryChapter = typeof storyChapters.$inferInsert;

/**
 * User favorites - tracks which stories users have favorited
 */
export const userFavorites = mysqlTable("userFavorites", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  storyId: int("storyId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UserFavorite = typeof userFavorites.$inferSelect;
export type InsertUserFavorite = typeof userFavorites.$inferInsert;

/**
 * Reading history - tracks user reading progress and history
 */
export const readingHistory = mysqlTable("readingHistory", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  storyId: int("storyId").notNull(),
  lastChapterRead: int("lastChapterRead").default(0),
  progressPercentage: int("progressPercentage").default(0),
  readingTimeSeconds: int("readingTimeSeconds").default(0),
  lastReadAt: timestamp("lastReadAt").defaultNow(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ReadingHistory = typeof readingHistory.$inferSelect;
export type InsertReadingHistory = typeof readingHistory.$inferInsert;

/**
 * AI chat history - stores story-related Q&A conversations
 */
export const aiChatHistory = mysqlTable("aiChatHistory", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  storyId: int("storyId").notNull(),
  userMessage: text("userMessage").notNull(),
  aiResponse: text("aiResponse").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AiChatHistory = typeof aiChatHistory.$inferSelect;
export type InsertAiChatHistory = typeof aiChatHistory.$inferInsert;

/**
 * Read-along recordings - stores audio transcriptions and metadata
 */
export const readAlongRecordings = mysqlTable("readAlongRecordings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  storyId: int("storyId").notNull(),
  audioUrl: varchar("audioUrl", { length: 500 }).notNull(),
  transcription: text("transcription"),
  durationSeconds: int("durationSeconds"),
  accuracyScore: int("accuracyScore"), // 0-100 percentage
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ReadAlongRecording = typeof readAlongRecordings.$inferSelect;
export type InsertReadAlongRecording = typeof readAlongRecordings.$inferInsert;
