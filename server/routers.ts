import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  getStories,
  getStoryById,
  createStory,
  getUserFavorites,
  addToFavorites,
  removeFromFavorites,
  isFavorited,
  getReadingHistory,
  updateReadingProgress,
  getChatHistory,
  saveChatMessage,
  saveReadAlongRecording,
  getUserReadAlongRecordings,
  getUserByOpenId,
  upsertUser,
} from "./db";
import { sdk } from "./_core/sdk";
import { invokeLLM } from "./_core/llm";
import { generateImage } from "./_core/imageGeneration";
import { storagePut } from "./storage";
import { transcribeAudio } from "./_core/voiceTranscription";
import {
  generateKidsStory,
  generateKidsStorySimple,
  generateStoryNarrationGemini,
} from "./_core/storyService";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    login: publicProcedure
      .input(
        z.object({
          displayName: z.string().trim().min(1).max(80).optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const { nanoid } = await import("nanoid");
        const openId = `local-${nanoid(12)}`;
        const name = input.displayName?.trim() || "Reader";
        await upsertUser({
          openId,
          name,
          loginMethod: "local",
          lastSignedIn: new Date(),
        });
        const sessionToken = await sdk.createSessionToken(openId, {
          name,
          expiresInMs: ONE_YEAR_MS,
        });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, {
          ...cookieOptions,
          maxAge: ONE_YEAR_MS,
        });
        const user = await getUserByOpenId(openId);
        if (!user) {
          throw new Error("Failed to resolve user after login");
        }
        return { user };
      }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  /**
   * Story browsing and management
   */
  stories: router({
    list: publicProcedure
      .input(
        z.object({
          category: z.string().optional(),
          limit: z.number().default(20),
          offset: z.number().default(0),
        })
      )
      .query(async ({ input }) => {
        return await getStories(input.category, input.limit, input.offset);
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await getStoryById(input.id);
      }),

    create: protectedProcedure
      .input(
        z.object({
          title: z.string(),
          content: z.string(),
          category: z.string(),
          description: z.string().optional(),
          ageGroup: z.string().optional(),
          readingTimeMinutes: z.number().optional(),
          illustrationUrl: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        return await createStory({
          ...input,
          authorId: ctx.user.id,
          isAiGenerated: true,
        });
      }),
  }),

   /**
    * AI Story Generation
    */
   aiStoryGen: router({
     generate: protectedProcedure
       .input(
         z.object({
           characters: z.array(z.string()),
           setting: z.string(),
           theme: z.string(),
           ageGroup: z.string(),
         })
       )
       .mutation(async ({ input }) => {
         // Generate kids-friendly story using OpenRouter API
         let storyData;
         try {
           const prompt = `Create a story about ${input.theme} featuring characters: ${input.characters.join(", ")} in a ${input.setting} setting.`;
           storyData = await generateKidsStory(prompt, input.ageGroup, "medium");
         } catch (error) {
           console.error("Failed to generate story with storyService:", error);
           // Fallback to original method
           const prompt = `Create a short, engaging story for children aged ${input.ageGroup}. 
           Characters: ${input.characters.join(", ")}
           Setting: ${input.setting}
           Theme: ${input.theme}
           
           Make the story age-appropriate, fun, and with a positive message. Keep it between 300-500 words.`;

           const response = await invokeLLM({
             messages: [
               {
                 role: "system",
                 content:
                   "You are a creative storyteller for children. Create engaging, age-appropriate stories with positive messages.",
               },
               { role: "user", content: prompt },
             ],
           });

           const messageContent = response.choices[0]?.message.content;
           const storyContent = typeof messageContent === 'string' ? messageContent : "Unable to generate story";

           storyData = {
             title: `${input.theme} Story`,
             content: storyContent,
             moral: "Always be kind and brave."
           };
         }

         // Generate illustration for the story
         let illustrationUrl: string | undefined;
         try {
           const imagePrompt = `Illustration for a children's story with: ${input.characters.join(", ")} in ${input.setting}. Theme: ${input.theme}. Colorful, playful, child-friendly style.`;
           const imageResponse = await generateImage({
             prompt: imagePrompt,
           });
           illustrationUrl = imageResponse.url;
         } catch (error) {
           console.error("Failed to generate illustration:", error);
         }

         const wordCount = storyData.content.split(" ").length;
         return {
           title: storyData.title,
           content: storyData.content,
           category: input.theme,
           ageGroup: input.ageGroup,
           illustrationUrl,
           readingTimeMinutes: Math.ceil(wordCount / 200),
         };
       }),

    /**
     * Simple flow: pick type → OpenRouter writes the story → Gemini TTS narrates.
     */
    tellStory: publicProcedure
      .input(
        z.object({
          storyKind: z.string().min(1).max(120),
          ageGroup: z.enum(["3-5", "6-8", "9-12"]),
          extraHint: z.string().max(220).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const story = await generateKidsStorySimple(
          input.storyKind,
          input.ageGroup,
          input.extraHint
        );
        const toRead = [
          story.title,
          "",
          story.content,
          "",
          `The moral: ${story.moral}`,
        ].join("\n");
        const narration = await generateStoryNarrationGemini(toRead);
        const wordCount = story.content.split(/\s+/).filter(Boolean).length;
        return {
          title: story.title,
          content: story.content,
          moral: story.moral,
          categoryLabel: story.categoryLabel,
          ageGroup: input.ageGroup,
          readingTimeMinutes: Math.ceil(wordCount / 200),
          audioBase64: narration.audioBase64,
          mimeType: narration.mimeType,
          durationSecondsEstimate: narration.durationSecondsEstimate,
        };
      }),
   }),

  /**
   * Favorites management
   */
  favorites: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await getUserFavorites(ctx.user.id);
    }),

    add: protectedProcedure
      .input(z.object({ storyId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        return await addToFavorites(ctx.user.id, input.storyId);
      }),

    remove: protectedProcedure
      .input(z.object({ storyId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        return await removeFromFavorites(ctx.user.id, input.storyId);
      }),

    isFavorited: protectedProcedure
      .input(z.object({ storyId: z.number() }))
      .query(async ({ input, ctx }) => {
        return await isFavorited(ctx.user.id, input.storyId);
      }),
  }),

  /**
   * Reading history and progress
   */
  readingHistory: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await getReadingHistory(ctx.user.id);
    }),

    updateProgress: protectedProcedure
      .input(
        z.object({
          storyId: z.number(),
          progressPercentage: z.number(),
          readingTimeSeconds: z.number(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        return await updateReadingProgress(
          ctx.user.id,
          input.storyId,
          input.progressPercentage,
          input.readingTimeSeconds
        );
      }),
  }),

  /**
   * AI Story Explainer Chat
   */
  storyChat: router({
    getHistory: protectedProcedure
      .input(z.object({ storyId: z.number() }))
      .query(async ({ input, ctx }) => {
        return await getChatHistory(ctx.user.id, input.storyId);
      }),

    ask: protectedProcedure
      .input(
        z.object({
          storyId: z.number(),
          question: z.string(),
          storyContent: z.string(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const systemPrompt = `You are a friendly story guide for children. Answer questions about the story in a simple, age-appropriate way. 
        Keep responses short and engaging. Explain vocabulary in simple terms if needed.`;

        const userPrompt = `Story: ${input.storyContent}\n\nQuestion: ${input.question}`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        });

        const messageContent = response.choices[0]?.message.content;
        const aiResponse = typeof messageContent === 'string' ? messageContent : "I'm not sure about that.";

        await saveChatMessage(
          ctx.user.id,
          input.storyId,
          input.question,
          aiResponse
        );

        return { question: input.question, response: aiResponse };
      }),
  }),

  /**
   * User profile management
   */
  users: router({
    updateProfile: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1),
          ageGroup: z.string().optional(),
          readingInterests: z.array(z.string()).optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        return {
          success: true,
          user: {
            ...ctx.user,
            name: input.name,
          },
        };
      }),
  }),

  /**
   * Read-along feature
   */
  readAlong: router({
    saveRecording: protectedProcedure
      .input(
        z.object({
          storyId: z.number(),
          audioBlob: z.instanceof(Uint8Array),
          durationSeconds: z.number(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        try {
          // Upload audio to storage
          const audioKey = `read-along/${ctx.user.id}/${input.storyId}/${Date.now()}.webm`;
          const { url: audioUrl } = await storagePut(
            audioKey,
            input.audioBlob,
            "audio/webm"
          );

          // Transcribe audio
          let transcription: string | undefined;
          try {
          const transcriptionResult = await transcribeAudio({
            audioUrl,
            language: "en",
          });
          if ('text' in transcriptionResult) {
            transcription = transcriptionResult.text;
          }
          } catch (error) {
            console.error("Failed to transcribe audio:", error);
          }

          // Save recording metadata
          return await saveReadAlongRecording(
            ctx.user.id,
            input.storyId,
            audioUrl,
            transcription,
            input.durationSeconds
          );
        } catch (error) {
          console.error("Failed to save read-along recording:", error);
          throw error;
        }
      }),

    getRecordings: protectedProcedure
      .input(z.object({ storyId: z.number() }))
      .query(async ({ input, ctx }) => {
        return await getUserReadAlongRecordings(ctx.user.id, input.storyId);
      }),
  }),
});

export type AppRouter = typeof appRouter;
