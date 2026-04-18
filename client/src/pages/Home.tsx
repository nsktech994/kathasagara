import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { STORY_KINDS } from "@shared/storyKinds";
import { cn } from "@/lib/utils";
import { Link } from "wouter";
import { BookOpen, Loader2, Volume2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Streamdown } from "streamdown";
import { toast } from "sonner";

const AGE_OPTIONS = [
  { id: "3-5" as const, label: "3–5" },
  { id: "6-8" as const, label: "6–8" },
  { id: "9-12" as const, label: "9–12" },
];

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const login = trpc.auth.login.useMutation({
    onSuccess: () => void utils.auth.me.invalidate(),
  });

  const [storyKind, setStoryKind] = useState<string>(STORY_KINDS[0].id);
  const [ageGroup, setAgeGroup] = useState<(typeof AGE_OPTIONS)[number]["id"]>("6-8");
  const [extraHint, setExtraHint] = useState("");
  /** If set, overrides the preset chips (free-form “type of story”). */
  const [ownIdea, setOwnIdea] = useState("");

  const tellStory = trpc.aiStoryGen.tellStory.useMutation({
    onError: err => {
      toast.error(err.message || "Could not create the story. Check API keys.");
    },
  });

  const saveStory = trpc.stories.create.useMutation({
    onSuccess: () => {
      toast.success("Saved to your library");
      void utils.stories.list.invalidate();
    },
    onError: () => toast.error("Save failed — try signing in."),
  });

  const audioSrc = useMemo(() => {
    const r = tellStory.data;
    if (!r?.audioBase64 || !r.mimeType) return null;
    return `data:${r.mimeType};base64,${r.audioBase64}`;
  }, [tellStory.data]);

  const handleSignIn = () => {
    const raw = window.prompt("What should we call you? (optional)");
    if (raw === null) return;
    const displayName = raw.trim();
    void login.mutateAsync(displayName ? { displayName } : {});
  };

  const handleTellStory = () => {
    const trimmedOwn = ownIdea.trim();
    void tellStory.mutateAsync({
      storyKind: trimmedOwn.slice(0, 120) || storyKind,
      ageGroup,
      extraHint: extraHint.trim() || undefined,
    });
  };

  const handleSave = () => {
    if (!user || !tellStory.data) return;
    const d = tellStory.data;
    saveStory.mutate({
      title: d.title,
      content: d.content,
      category: d.categoryLabel.slice(0, 64) || "story",
      description: d.moral,
      ageGroup: d.ageGroup,
      readingTimeMinutes: d.readingTimeMinutes,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <nav className="sticky top-0 z-50 bg-white/85 backdrop-blur-md border-b border-border">
        <div className="container flex items-center justify-between py-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-8 h-8 text-primary" />
            <span className="font-playfair text-xl font-bold gradient-text">Kathasagara</span>
          </div>
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <Link href="/library">
                  <Button variant="ghost" size="sm" className="font-playful">
                    Library
                  </Button>
                </Link>
                <Link href="/profile">
                  <Button variant="outline" size="sm" className="font-playful">
                    {user?.name || "Profile"}
                  </Button>
                </Link>
              </>
            ) : (
              <Button
                size="sm"
                onClick={handleSignIn}
                disabled={login.isPending}
                className="bg-gradient-to-r from-primary to-secondary text-white font-playful"
              >
                Sign in
              </Button>
            )}
          </div>
        </div>
      </nav>

      <main className="container py-8 md:py-12 max-w-3xl space-y-10">
        <div className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-playfair font-bold gradient-text">
            Pick a story, listen & smile
          </h1>
          <p className="text-muted-foreground font-playful text-base md:text-lg">
            Choose what kind of tale you want. We write it in kid-friendly words (OpenRouter), then read
            it aloud with Gemini.
          </p>
        </div>

        <section className="space-y-4">
          <p className="text-sm font-semibold font-playful text-foreground">What kind of story?</p>
          <div className="flex flex-wrap gap-2">
            {STORY_KINDS.map(k => (
              <button
                key={k.id}
                type="button"
                onClick={() => {
                  setStoryKind(k.id);
                  setOwnIdea("");
                }}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-playful border-2 transition-all",
                  storyKind === k.id && !ownIdea.trim()
                    ? "border-primary bg-primary/10 text-primary shadow-sm"
                    : "border-border bg-card hover:border-primary/40"
                )}
              >
                {k.label}
              </button>
            ))}
          </div>
          <div className="space-y-1 pt-2">
            <label className="text-xs text-muted-foreground font-playful" htmlFor="own">
              Or describe your own story in one short line (optional — overrides the buttons)
            </label>
            <Input
              id="own"
              value={ownIdea}
              onChange={e => setOwnIdea(e.target.value)}
              placeholder="e.g. a penguin who learns to ice-skate"
              className="rounded-xl font-playful text-sm"
              maxLength={120}
            />
          </div>
        </section>

        <section className="space-y-2">
          <p className="text-sm font-semibold font-playful">Age</p>
          <div className="flex gap-2">
            {AGE_OPTIONS.map(a => (
              <button
                key={a.id}
                type="button"
                onClick={() => setAgeGroup(a.id)}
                className={cn(
                  "flex-1 rounded-2xl py-3 font-playful border-2 text-center transition-all",
                  ageGroup === a.id
                    ? "border-secondary bg-secondary/10 text-secondary font-semibold"
                    : "border-border bg-card hover:border-secondary/40"
                )}
              >
                {a.label}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-2">
          <label className="text-sm font-semibold font-playful" htmlFor="hint">
            Want something extra in the story? (optional)
          </label>
          <Input
            id="hint"
            value={extraHint}
            onChange={e => setExtraHint(e.target.value)}
            placeholder="e.g. a blue butterfly, a robot who loves cookies…"
            className="rounded-xl font-playful"
          />
        </section>

        <Button
          type="button"
          size="lg"
          disabled={tellStory.isPending}
          onClick={handleTellStory}
          className="w-full rounded-2xl bg-gradient-to-r from-primary to-secondary text-white font-playful text-lg py-7 shadow-lg"
        >
          {tellStory.isPending ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin inline" />
              Writing & narrating…
            </>
          ) : (
            <>
              <Volume2 className="w-5 h-5 mr-2 inline" />
              Tell me this story
            </>
          )}
        </Button>

        {tellStory.data && (
          <article className="card-playful space-y-4 animate-fade-in border-2 border-primary/20">
            <div className="space-y-1">
              <h2 className="text-2xl md:text-3xl font-playfair font-bold text-foreground">
                {tellStory.data.title}
              </h2>
              <p className="text-sm text-muted-foreground font-playful">
                {tellStory.data.categoryLabel} · ages {tellStory.data.ageGroup}
              </p>
            </div>

            {audioSrc ? (
              <div className="rounded-2xl bg-muted/50 p-4 border border-border">
                <p className="text-xs font-playful text-muted-foreground mb-2 flex items-center gap-1">
                  <Volume2 className="w-4 h-4" /> Listen (Gemini)
                </p>
                <audio src={audioSrc} controls className="w-full" preload="metadata" />
              </div>
            ) : (
              <p className="text-sm text-amber-700 dark:text-amber-400 font-playful rounded-xl bg-amber-500/10 px-3 py-2 border border-amber-500/20">
                Narration audio isn’t available (set <code className="text-xs">GEMINI_API_KEY</code> and a
                TTS-capable model like <code className="text-xs">gemini-2.5-flash-preview-tts</code>). You
                can still read the story below.
              </p>
            )}

            <div className="prose prose-lg max-w-none dark:prose-invert">
              <Streamdown>{tellStory.data.content}</Streamdown>
            </div>

            <p className="text-sm italic text-muted-foreground font-playful border-t border-border pt-4">
              Moral: {tellStory.data.moral}
            </p>

            {isAuthenticated && (
              <Button
                type="button"
                variant="outline"
                className="w-full rounded-xl font-playful"
                disabled={saveStory.isPending}
                onClick={handleSave}
              >
                {saveStory.isPending ? "Saving…" : "Save to library"}
              </Button>
            )}
          </article>
        )}
      </main>

      <footer className="border-t border-border py-8 mt-12">
        <div className="container text-center text-sm text-muted-foreground font-playful">
          <p>Kathasagara — stories for young readers</p>
        </div>
      </footer>
    </div>
  );
}
