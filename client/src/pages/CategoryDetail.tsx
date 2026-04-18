import { useRoute, useLocation } from "wouter";
import { trpc, type RouterOutputs } from "@/lib/trpc";

type StoryRow = RouterOutputs["stories"]["list"][number];
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Heart } from "lucide-react";

const CATEGORY_INFO: Record<string, { emoji: string; description: string }> = {
  "fairy-tales": {
    emoji: "✨",
    description: "Magical stories with enchanted worlds and happily ever afters",
  },
  fables: {
    emoji: "🦁",
    description: "Timeless tales with valuable lessons and wise characters",
  },
  adventure: {
    emoji: "🗺️",
    description: "Exciting journeys and thrilling quests across distant lands",
  },
  mythology: {
    emoji: "⚡",
    description: "Ancient stories of gods, heroes, and legendary creatures",
  },
  animals: {
    emoji: "🐾",
    description: "Heartwarming tales featuring our furry and feathered friends",
  },
  mystery: {
    emoji: "🔍",
    description: "Intriguing puzzles and suspenseful stories to solve",
  },
  science: {
    emoji: "🔬",
    description: "Educational stories exploring amazing scientific concepts",
  },
  humor: {
    emoji: "😄",
    description: "Funny and silly stories guaranteed to make you laugh",
  },
};

export default function CategoryDetail() {
  const [, navigate] = useLocation();
  const [match, params] = useRoute("/category/:name");
  const category = params?.name || "";

  const { data: stories, isLoading } = trpc.stories.list.useQuery(
    {
      category,
      limit: 50,
      offset: 0,
    },
    { enabled: !!category }
  );

  const categoryInfo = CATEGORY_INFO[category] || {
    emoji: "📖",
    description: "Explore our collection of stories",
  };

  if (!match) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-lg font-playful">Category not found</p>
          <Button onClick={() => navigate("/library")}>Back to Library</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 border-b border-border">
        <div className="container py-8">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate("/library")}
              className="font-playful"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </div>

          <div className="space-y-4">
            <div className="text-5xl">{categoryInfo.emoji}</div>
            <h1 className="text-heading gradient-text capitalize">{category}</h1>
            <p className="text-lg text-muted-foreground font-playful max-w-2xl">
              {categoryInfo.description}
            </p>
          </div>
        </div>
      </div>

      {/* Stories Grid */}
      <div className="container py-12">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : stories && stories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stories.map((story: StoryRow) => (
              <div
                key={story.id}
                className="card-playful cursor-pointer group space-y-4"
                onClick={() => navigate(`/story/${story.id}`)}
              >
                <div className="w-full h-40 bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 rounded-2xl flex items-center justify-center overflow-hidden">
                  {story.illustrationUrl ? (
                    <img
                      src={story.illustrationUrl}
                      alt={story.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                    />
                  ) : (
                    <div className="text-4xl">📖</div>
                  )}
                </div>

                <div className="space-y-2">
                   <h3 className="font-playfair font-bold text-lg line-clamp-2">
                    {story.title}
                  </h3>
                  <p className="text-sm text-muted-foreground font-playful line-clamp-2">
                    {story.description || "An enchanting tale"}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-muted-foreground font-playful">
                    {story.readingTimeMinutes} min read
                  </span>
                  <Heart className="w-4 h-4 text-muted-foreground group-hover:text-destructive transition-colors" />
                </div>

                <Button
                  className="w-full bg-gradient-to-r from-primary to-secondary text-white font-playful rounded-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/story/${story.id}`);
                  }}
                >
                  Read Story
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 space-y-4">
            <div className="text-5xl">📚</div>
            <p className="text-lg font-playful text-muted-foreground">
              No stories in this category yet
            </p>
            <Button
              onClick={() => navigate("/library")}
              className="bg-gradient-to-r from-primary to-secondary text-white font-playful rounded-full"
            >
              Explore Other Categories
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
