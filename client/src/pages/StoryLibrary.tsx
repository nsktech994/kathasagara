import { useState } from "react";
import { trpc, type RouterOutputs } from "@/lib/trpc";

type StoryRow = RouterOutputs["stories"]["list"][number];
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useLocation } from "wouter";
import { BookOpen, Heart, Search, Loader2 } from "lucide-react";

const CATEGORIES = [
  { id: "all", label: "All Stories", icon: "📚" },
  { id: "fairy-tales", label: "Fairy Tales", icon: "👑" },
  { id: "fables", label: "Fables", icon: "🦊" },
  { id: "adventure", label: "Adventure", icon: "🗺️" },
  { id: "mythology", label: "Mythology", icon: "⚡" },
  { id: "fantasy", label: "Fantasy", icon: "🐉" },
  { id: "science-fiction", label: "Sci-Fi", icon: "🚀" },
];

export default function StoryLibrary() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: stories, isLoading } = trpc.stories.list.useQuery({
    category: selectedCategory === "all" ? undefined : selectedCategory,
    limit: 50,
  });

  const { data: favorites } = trpc.favorites.list.useQuery(undefined, {
    enabled: !!user,
  });

  const favoriteIds = new Set(favorites?.map((s: StoryRow) => s.id) || []);

  const filteredStories = stories?.filter((story: StoryRow) =>
    story.title.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <BookOpen className="w-16 h-16 mx-auto text-muted-foreground" />
          <p className="text-lg font-playful">Please sign in to explore stories</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 border-b border-border">
        <div className="container py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-heading gradient-text">Story Library</h1>
              <p className="text-muted-foreground font-playful mt-2">
                Discover magical stories from around the world
              </p>
            </div>
            <Link href="/create">
              <Button className="bg-gradient-to-r from-primary to-secondary text-white font-playful rounded-full">
                Create Story
              </Button>
            </Link>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search stories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-full border-2 border-border focus:border-primary h-12 font-playful"
            />
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="container py-8">
        <div className="flex gap-2 overflow-x-auto pb-4">
          {CATEGORIES.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-full font-playful whitespace-nowrap transition-all ${
                selectedCategory === category.id
                  ? "bg-gradient-to-r from-primary to-secondary text-white shadow-lg"
                  : "bg-card border-2 border-border hover:border-primary text-foreground"
              }`}
            >
              <span className="mr-2">{category.icon}</span>
              {category.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stories Grid */}
      <div className="container pb-20">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredStories.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <BookOpen className="w-16 h-16 mx-auto text-muted-foreground" />
            <p className="text-lg font-playful text-muted-foreground">
              No stories found. Try a different category!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredStories.map((story: StoryRow) => (
              <StoryCard
                key={story.id}
                story={story}
                isFavorited={favoriteIds.has(story.id)}
                onNavigate={() => navigate(`/story/${story.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StoryCard({
  story,
  isFavorited,
  onNavigate,
}: {
  story: any;
  isFavorited: boolean;
  onNavigate: () => void;
}) {
  const addToFavorites = trpc.favorites.add.useMutation();
  const removeFromFavorites = trpc.favorites.remove.useMutation();

  const handleFavoriteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFavorited) {
      removeFromFavorites.mutate({ storyId: story.id });
    } else {
      addToFavorites.mutate({ storyId: story.id });
    }
  };

  return (
    <div
      onClick={onNavigate}
      className="card-playful cursor-pointer group space-y-4 h-full flex flex-col"
    >
      {/* Story Illustration */}
      <div className="w-full h-48 bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 rounded-2xl flex items-center justify-center overflow-hidden relative">
        {story.illustrationUrl ? (
          <img
            src={story.illustrationUrl}
            alt={story.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
        ) : (
          <div className="text-4xl">📖</div>
        )}
      </div>

      {/* Story Info */}
      <div className="flex-1 space-y-2">
        <div className="flex items-start justify-between gap-2">
           <h3 className="font-playfair font-bold text-lg line-clamp-2 flex-1">
            {story.title}
          </h3>
          <button
            onClick={handleFavoriteToggle}
            className="flex-shrink-0 mt-1"
          >
            <Heart
              className={`w-5 h-5 transition-all ${
                isFavorited
                  ? "fill-destructive text-destructive"
                  : "text-muted-foreground hover:text-destructive"
              }`}
            />
          </button>
        </div>

        <p className="text-sm text-muted-foreground font-playful line-clamp-2">
          {story.description || "An enchanting tale waiting to be discovered"}
        </p>

        {/* Metadata */}
        <div className="flex items-center gap-3 pt-2 text-xs text-muted-foreground font-playful">
          {story.readingTimeMinutes && (
            <span>⏱️ {story.readingTimeMinutes} min</span>
          )}
          {story.ageGroup && <span>👶 {story.ageGroup}+</span>}
          <span className="capitalize">📚 {story.category}</span>
        </div>
      </div>

      {/* Read Button */}
      <Button
        className="w-full bg-gradient-to-r from-primary to-secondary text-white font-playful rounded-full"
        onClick={(e) => {
          e.stopPropagation();
          onNavigate();
        }}
      >
        Read Story
      </Button>
    </div>
  );
}
