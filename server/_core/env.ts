export const ENV = {
  appId: process.env.VITE_APP_ID ?? "kathasagara",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  // Forge API (existing)
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  // OpenRouter API for story generation
  openRouterApiKey: process.env.OPEN_ROUTER_API_KEY ?? "",
  openRouterApiUrl: process.env.OPEN_ROUTER_API_URL ?? "https://openrouter.ai/api/v1",
  openRouterStoryModel:
    process.env.OPENROUTER_STORY_MODEL ?? "openai/gpt-4o-mini",
  // Gemini API for narration (native TTS preview models)
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  geminiApiUrl: process.env.GEMINI_API_URL ?? "https://generativelanguage.googleapis.com/v1beta",
  geminiTtsModel:
    process.env.GEMINI_TTS_MODEL ?? "gemini-2.5-flash-preview-tts",
  geminiTtsVoice: process.env.GEMINI_TTS_VOICE ?? "Zephyr",
};
