import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Loader2, Heart, ArrowLeft, Settings, MessageCircle } from "lucide-react";
import { Streamdown } from "streamdown";
import { toast } from "sonner";

export default function StoryReader() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [match, params] = useRoute("/story/:id");
  const storyId = params?.id ? parseInt(params.id) : null;

  const [readingTime, setReadingTime] = useState(0);
  const [fontSize, setFontSize] = useState(16);
  const [showSettings, setShowSettings] = useState(false);
  const [lineHeight, setLineHeight] = useState(1.8);

  const { data: story, isLoading } = trpc.stories.getById.useQuery(
    { id: storyId! },
    { enabled: !!storyId }
  );

  const { data: isFavorited } = trpc.favorites.isFavorited.useQuery(
    { storyId: storyId! },
    { enabled: !!storyId && !!user }
  );

  const addToFavorites = trpc.favorites.add.useMutation();
  const removeFromFavorites = trpc.favorites.remove.useMutation();
  const updateProgress = trpc.readingHistory.updateProgress.useMutation();

  // Track reading time
  useEffect(() => {
    if (!story) return;

    const interval = setInterval(() => {
      setReadingTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [story]);

  // Update reading progress
  useEffect(() => {
    if (!story || !user || readingTime === 0) return;

    const timer = setTimeout(() => {
      const progressPercentage = 100; // Full story read
      updateProgress.mutate({
        storyId: story.id,
        progressPercentage,
        readingTimeSeconds: readingTime,
      });
    }, 5000); // Save every 5 seconds

    return () => clearTimeout(timer);
  }, [readingTime, story, user]);

  const handleFavoriteToggle = () => {
    if (!story || !user) return;

    if (isFavorited) {
      removeFromFavorites.mutate({ storyId: story.id });
      toast.success("Removed from favorites");
    } else {
      addToFavorites.mutate({ storyId: story.id });
      toast.success("Added to favorites");
    }
  };

  if (!match || !storyId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-lg font-playful">Story not found</p>
          <Button onClick={() => navigate("/library")}>Back to Library</Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!story) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-lg font-playful">Story not found</p>
          <Button onClick={() => navigate("/library")}>Back to Library</Button>
        </div>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Reader Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-border shadow-sm">
        <div className="container flex items-center justify-between py-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/library")}
            className="font-playful"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </Button>

          <div className="flex items-center gap-2 text-sm text-muted-foreground font-playful">
            <span>⏱️ {formatTime(readingTime)}</span>
            {story.readingTimeMinutes && (
              <span>📖 {story.readingTimeMinutes} min read</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleFavoriteToggle}
              className="font-playful"
            >
              <Heart
                className={`w-5 h-5 ${
                  isFavorited
                    ? "fill-destructive text-destructive"
                    : "text-muted-foreground"
                }`}
              />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              className="font-playful"
            >
              <Settings className="w-5 h-5" />
            </Button>
            {user && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/story/${story.id}/chat`)}
                className="font-playful"
              >
                <MessageCircle className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="border-t border-border bg-card p-4">
            <div className="container space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-playful font-semibold">
                  Font Size: {fontSize}px
                </label>
                <input
                  type="range"
                  min="14"
                  max="24"
                  value={fontSize}
                  onChange={(e) => setFontSize(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-playful font-semibold">
                  Line Height: {lineHeight.toFixed(1)}
                </label>
                <input
                  type="range"
                  min="1.4"
                  max="2.2"
                  step="0.1"
                  value={lineHeight}
                  onChange={(e) => setLineHeight(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Story Content */}
      <div className="container py-12 max-w-3xl">
        {/* Story Header */}
        <div className="mb-12 space-y-6">
          {story.illustrationUrl && (
            <div className="w-full h-96 rounded-2xl overflow-hidden shadow-lg">
              <img
                src={story.illustrationUrl}
                alt={story.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="space-y-4">
            <h1 className="text-hero gradient-text">{story.title}</h1>

            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground font-playful">
              {story.ageGroup && <span>👶 Ages {story.ageGroup}</span>}
              {story.category && (
                <span className="capitalize">📚 {story.category}</span>
              )}
              {story.readingTimeMinutes && (
                <span>⏱️ {story.readingTimeMinutes} min read</span>
              )}
            </div>

            {story.description && (
              <p className="text-lg text-muted-foreground font-playful leading-relaxed">
                {story.description}
              </p>
            )}
          </div>
        </div>

        {/* Story Content */}
        <div
          className="prose prose-sm max-w-none"
          style={{
            fontSize: `${fontSize}px`,
            lineHeight: lineHeight,
          }}
        >
          <Streamdown>{story.content}</Streamdown>
        </div>

        {/* Story Footer */}
        <div className="mt-16 pt-8 border-t border-border space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground font-playful">
                Reading Time: {formatTime(readingTime)}
              </p>
              <p className="text-sm text-muted-foreground font-playful">
                Story saved to your reading history
              </p>
            </div>
            <Button
              onClick={() => navigate("/library")}
              className="bg-gradient-to-r from-primary to-secondary text-white font-playful rounded-full"
            >
              Back to Library
            </Button>
          </div>

          {/* Suggested Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            {user && (
              <>
                <Button
                  variant="outline"
                  onClick={() => navigate(`/story/${story.id}/chat`)}
                  className="font-playful rounded-full border-2"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Ask Questions
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate(`/story/${story.id}/read-along`)}
                  className="font-playful rounded-full border-2"
                >
                  🎤 Read-Along
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
