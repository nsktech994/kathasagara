import { ENV } from "./env";
import { STORY_KINDS } from "../../shared/storyKinds";

const MAX_NARRATION_CHARS = 8000;

function labelForKind(kindId: string): string {
  const row = STORY_KINDS.find(k => k.id === kindId);
  return row?.label ?? kindId;
}

function buildUserPrompt(storyKind: string, extraHint?: string): string {
  const row = STORY_KINDS.find(k => k.id === storyKind);
  const hint = extraHint?.trim();
  if (row) {
    const base = `Create a story in the style: ${row.label} (${row.hint}).`;
    return hint ? `${base} The child also asked for: ${hint}` : base;
  }
  return `Create a story about: ${storyKind}.${hint ? ` Also include: ${hint}` : ""}`;
}

function extractJsonObject(raw: string): unknown {
  const s = raw.trim();
  const fence = "```";
  if (s.includes(fence)) {
    const start = s.indexOf(fence);
    const afterFirst = s.indexOf("\n", start + fence.length) + 1;
    const end = s.lastIndexOf("```");
    if (end > start) {
      let inner = s.slice(afterFirst, end).trim();
      if (inner.startsWith("json")) {
        inner = inner.slice(4).trim();
      }
      return JSON.parse(inner);
    }
  }
  return JSON.parse(s);
}

export async function generateKidsStory(
  prompt: string,
  ageGroup: string = "6-8",
  length: string = "medium"
): Promise<{ title: string; content: string; moral: string }> {
  if (!ENV.openRouterApiKey) {
    throw new Error("OpenRouter API key is not configured (OPEN_ROUTER_API_KEY)");
  }

  let ageGuidance = "";
  switch (ageGroup) {
    case "3-5":
      ageGuidance =
        "Use very simple words, short sentences, and concrete concepts suitable for preschoolers.";
      break;
    case "6-8":
      ageGuidance =
        "Use simple, warm language with short paragraphs. One clear positive lesson.";
      break;
    case "9-12":
      ageGuidance =
        "Use slightly richer vocabulary; themes of friendship, courage, and kindness—still gentle.";
      break;
    default:
      ageGuidance = "Use simple, child-friendly language.";
  }

  let lengthGuidance = "";
  switch (length) {
    case "short":
      lengthGuidance = "About 120–180 words.";
      break;
    case "medium":
      lengthGuidance = "About 220–320 words.";
      break;
    case "long":
      lengthGuidance = "About 380–500 words.";
      break;
    default:
      lengthGuidance = "About 220–320 words.";
  }

  const systemPrompt = `You write short children's stories. Ages: ${ageGroup}.

${ageGuidance}
${lengthGuidance}

Rules:
- Original, gentle, age-appropriate. No violence, fear, or adult topics.
- Positive ending. Relatable characters (kids, animals, or friendly creatures).
- Return ONLY valid JSON (no markdown outside JSON) with keys:
  {"title": string, "content": string, "moral": string}
- "content" is the story body only (no title repeated). Plain text, use \\n for paragraph breaks if needed.`;

  const userPrompt = `Story request:\n${prompt}`;

  const model = ENV.openRouterStoryModel;

  const response = await fetch(`${ENV.openRouterApiUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ENV.openRouterApiKey}`,
      "HTTP-Referer": "https://kathasagara.app",
      "X-Title": "Kathasagara Story Generator",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.85,
      max_tokens: 2500,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string | null } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    throw new Error("Empty response from OpenRouter");
  }

  const storyData = extractJsonObject(content) as {
    title?: string;
    content?: string;
    moral?: string;
  };

  if (!storyData.title || !storyData.content || !storyData.moral) {
    throw new Error("Invalid story JSON from model");
  }

  return {
    title: storyData.title,
    content: storyData.content,
    moral: storyData.moral,
  };
}

/** One-shot helper: kind + optional child hint → story text. */
export async function generateKidsStorySimple(
  storyKind: string,
  ageGroup: string,
  extraHint?: string
) {
  const prompt = buildUserPrompt(storyKind, extraHint);
  return {
    ...(await generateKidsStory(prompt, ageGroup, "medium")),
    categoryLabel: labelForKind(String(storyKind)),
  };
}

export type GeminiNarrationResult = {
  audioBase64: string | null;
  mimeType: string | null;
  durationSecondsEstimate: number;
};

/** Gemini native TTS (preview models). Returns base64 audio or null if not configured / failed. */
export async function generateStoryNarrationGemini(
  text: string
): Promise<GeminiNarrationResult> {
  if (!ENV.geminiApiKey) {
    return {
      audioBase64: null,
      mimeType: null,
      durationSecondsEstimate: Math.max(15, Math.floor(text.length / 12)),
    };
  }

  const trimmed =
    text.length > MAX_NARRATION_CHARS
      ? text.slice(0, MAX_NARRATION_CHARS) + "\n\n[Story continues in reading view.]"
      : text;

  const narrationScript = `Read this children's story aloud in a warm, clear storyteller voice for kids. Speak every word of the story—do not add commentary before or after.\n\n---\n\n${trimmed}`;

  const model = ENV.geminiTtsModel;
  const url = `${ENV.geminiApiUrl}/models/${model}:generateContent?key=${ENV.geminiApiKey}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: narrationScript }],
          },
        ],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: ENV.geminiTtsVoice,
              },
            },
          },
        },
      }),
    });

    if (!response.ok) {
      const err = await response.text().catch(() => "");
      console.error("[Gemini TTS] HTTP error:", response.status, err);
      return {
        audioBase64: null,
        mimeType: null,
        durationSecondsEstimate: Math.max(15, Math.floor(text.length / 12)),
      };
    }

    const data = (await response.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ inlineData?: { mimeType?: string; data?: string } }> };
      }>;
    };

    const part = data.candidates?.[0]?.content?.parts?.[0];
    const inline = part?.inlineData;
    if (inline?.data && inline?.mimeType) {
      return {
        audioBase64: inline.data,
        mimeType: inline.mimeType,
        durationSecondsEstimate: Math.max(20, Math.floor(text.length / 11)),
      };
    }

    console.warn("[Gemini TTS] No inline audio in response");
  } catch (e) {
    console.error("[Gemini TTS] Failed:", e);
  }

  return {
    audioBase64: null,
    mimeType: null,
    durationSecondsEstimate: Math.max(15, Math.floor(text.length / 12)),
  };
}
