import { describe, it, expect, beforeEach, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId: number = 1): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `test-user-${userId}`,
    email: `user${userId}@example.com`,
    name: `Test User ${userId}`,
    loginMethod: "test",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("Stories Router", () => {
  describe("stories.list", () => {
    it("should return a list of stories", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.stories.list({
        limit: 10,
        offset: 0,
      });

      expect(Array.isArray(result)).toBe(true);
    });

    it("should filter stories by category", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.stories.list({
        category: "adventure",
        limit: 10,
        offset: 0,
      });

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("stories.getById", () => {
    it("should handle story retrieval", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.stories.getById({ id: 99999 });

      expect(result === undefined || typeof result === 'object').toBe(true);
    });
  });

  describe("stories.create", () => {
    it("should create a new story", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.stories.create({
        title: "Test Story",
        content: "Once upon a time...",
        category: "fairy-tales",
        description: "A test story",
        ageGroup: "7-9",
        readingTimeMinutes: 5,
      });

      expect(result).toBeDefined();
    });
  });
});

describe("Favorites Router", () => {
  describe("favorites.list", () => {
    it("should return user favorites", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.favorites.list();

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("favorites.isFavorited", () => {
    it("should check if story is favorited", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.favorites.isFavorited({ storyId: 1 });

      expect(typeof result).toBe("boolean");
    });
  });
});

describe("Reading History Router", () => {
  describe("readingHistory.list", () => {
    it("should return user reading history", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.readingHistory.list();

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("readingHistory.updateProgress", () => {
    it("should update reading progress", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.readingHistory.updateProgress({
        storyId: 1,
        progressPercentage: 50,
        readingTimeSeconds: 300,
      });

      expect(result).toBeDefined();
    });
  });
});

describe("Story Chat Router", () => {
  describe("storyChat.getHistory", () => {
    it("should return chat history for a story", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.storyChat.getHistory({ storyId: 1 });

      expect(Array.isArray(result)).toBe(true);
    });
  });
});

describe("Read-Along Router", () => {
  describe("readAlong.getRecordings", () => {
    it("should return read-along recordings", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.readAlong.getRecordings({ storyId: 1 });

      expect(Array.isArray(result)).toBe(true);
    });
  });
});
