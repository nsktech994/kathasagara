// Mock database implementation for when no MySQL database is available
// This provides in-memory storage for development/testing without MySQL

// In-memory storage
const mockData = {
  users: new Map(),
  stories: new Map(),
  userFavorites: new Map(),
  readingHistory: new Map(),
  aiChatHistory: new Map(),
  readAlongRecordings: new Map(),
};

// ID counters
let userIdCounter = 1;
let storyIdCounter = 1;
let favoriteIdCounter = 1;
let readingHistoryIdCounter = 1;
let chatHistoryIdCounter = 1;
let recordingIdCounter = 1;

// Helper to generate IDs
const generateId = (counterRef: { current: number }) => {
  const id = counterRef.current;
  counterRef.current++;
  return id;
};

// Mock database interface that matches the real db.ts functions
export const mockDb = {
  // User functions
  upsertUser: async (user: any) => {
    if (!user.openId) {
      throw new Error("User openId is required for upsert");
    }
    
    let existingUser = Array.from(mockData.users.values()).find(
      (u: any) => u.openId === user.openId
    );
    
    if (existingUser) {
      // Update existing user
      Object.assign(existingUser, user);
      if (!existingUser.lastSignedIn) {
        existingUser.lastSignedIn = new Date();
      }
    } else {
      // Create new user
      const newUser = {
        id: generateId({ current: userIdCounter }),
        openId: user.openId,
        name: user.name || null,
        email: user.email || null,
        loginMethod: user.loginMethod || null,
        role: user.role || 'user',
        lastSignedIn: user.lastSignedIn || new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      mockData.users.set(newUser.id, newUser);
    }
  },
  
  getUserByOpenId: async (openId: string) => {
    const user = Array.from(mockData.users.values()).find(
      (u: any) => u.openId === openId
    );
    return user || undefined;
  },

  // Story functions
  getStories: async (category?: string, limit: number = 20, offset: number = 0) => {
    let stories = Array.from(mockData.stories.values());
    
    if (category) {
      stories = stories.filter((story: any) => story.category === category);
    }
    
    // Sort by createdAt descending
    stories.sort((a: any, b: any) => b.createdAt - a.createdAt);
    
    // Apply pagination
    const paginated = stories.slice(offset, offset + limit);
    return paginated;
  },
  
  getStoryById: async (storyId: number) => {
    const story = mockData.stories.get(storyId);
    return story || undefined;
  },
  
  createStory: async (storyData: any) => {
    const story = {
      id: generateId({ current: storyIdCounter }),
      ...storyData,
      createdAt: new Date(),
      updatedAt: new Date(),
      isAiGenerated: storyData.isAiGenerated ?? false,
    };
    
    mockData.stories.set(story.id, story);
    return { insertId: story.id };
  },

  // Favorites functions
  getUserFavorites: async (userId: number) => {
    const favorites = Array.from(mockData.userFavorites.values()).filter(
      (fav: any) => fav.userId === userId
    );
    const storyIds = favorites.map((f: any) => f.storyId);
    if (storyIds.length === 0) return [];
    return Array.from(mockData.stories.values()).filter((s: any) =>
      storyIds.includes(s.id)
    );
  },
  
  addToFavorites: async (userId: number, storyId: number) => {
    // Check if already favorited
    const exists = Array.from(mockData.userFavorites.values()).some(
      (fav: any) => fav.userId === userId && fav.storyId === storyId
    );
    
    if (!exists) {
      const favorite = {
        id: generateId({ current: favoriteIdCounter }),
        userId,
        storyId,
        createdAt: new Date(),
      };
      
      mockData.userFavorites.set(favorite.id, favorite);
    }
    
    return { insertId: favoriteIdCounter }; // Return approximate ID
  },
  
  removeFromFavorites: async (userId: number, storyId: number) => {
    for (const [id, favorite] of Array.from(mockData.userFavorites.entries())) {
      if (favorite.userId === userId && favorite.storyId === storyId) {
        mockData.userFavorites.delete(id);
        break;
      }
    }
  },
  
  isFavorited: async (userId: number, storyId: number) => {
    return Array.from(mockData.userFavorites.values()).some(
      (fav: any) => fav.userId === userId && fav.storyId === storyId
    );
  },

  // Reading history functions
  getReadingHistory: async (userId: number) => {
    return Array.from(mockData.readingHistory.values())
      .filter((hist: any) => hist.userId === userId)
      .sort((a: any, b: any) => b.lastReadAt - a.lastReadAt);
  },
  
  updateReadingProgress: async (userId: number, storyId: number, progressPercentage: number, readingTimeSeconds: number) => {
    // Find existing record
    let existing = Array.from(mockData.readingHistory.values()).find(
      (hist: any) => hist.userId === userId && hist.storyId === storyId
    );
    
    if (existing) {
      // Update existing
      existing.progressPercentage = progressPercentage;
      existing.readingTimeSeconds = readingTimeSeconds;
      existing.lastReadAt = new Date();
      return { affectedRows: 1 };
    }
    const history = {
      id: generateId({ current: readingHistoryIdCounter }),
      userId,
      storyId,
      progressPercentage,
      readingTimeSeconds,
      lastReadAt: new Date(),
      createdAt: new Date(),
    };

    mockData.readingHistory.set(history.id, history);
    return { insertId: history.id, affectedRows: 1 };
  },

  // AI chat history functions
  getChatHistory: async (userId: number, storyId: number) => {
    return Array.from(mockData.aiChatHistory.values())
      .filter((chat: any) => chat.userId === userId && chat.storyId === storyId)
      .sort((a: any, b: any) => a.createdAt - b.createdAt);
  },
  
  saveChatMessage: async (userId: number, storyId: number, userMessage: string, aiResponse: string) => {
    const chat = {
      id: generateId({ current: chatHistoryIdCounter }),
      userId,
      storyId,
      userMessage,
      aiResponse,
      createdAt: new Date(),
    };
    
    mockData.aiChatHistory.set(chat.id, chat);
    return { insertId: chat.id };
  },

  // Read-along recordings functions
  saveReadAlongRecording: async (userId: number, storyId: number, audioUrl: string, transcription?: string, durationSeconds?: number) => {
    const recording = {
      id: generateId({ current: recordingIdCounter }),
      userId,
      storyId,
      audioUrl,
      transcription: transcription || null,
      durationSeconds: durationSeconds || null,
      createdAt: new Date(),
    };
    
    mockData.readAlongRecordings.set(recording.id, recording);
    return { insertId: recording.id };
  },
  
  getUserReadAlongRecordings: async (userId: number, storyId: number) => {
    return Array.from(mockData.readAlongRecordings.values())
      .filter((rec: any) => rec.userId === userId && rec.storyId === storyId)
      .sort((a: any, b: any) => b.createdAt - a.createdAt);
  },
};

// Export a function that returns the mock db
export async function getMockDb() {
  return mockDb;
}