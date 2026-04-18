import { useState } from "react";
import { trpc, type RouterOutputs } from "@/lib/trpc";

type StoryRow = RouterOutputs["favorites"]["list"][number];
type HistoryRow = RouterOutputs["readingHistory"]["list"][number];
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { LogOut, Heart, BookOpen, Clock, Edit2, Settings } from "lucide-react";
import { toast } from "sonner";
import { ReadingStats } from "@/components/ReadingStats";

export default function Profile() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<"favorites" | "history">("favorites");

  const { data: favorites } = trpc.favorites.list.useQuery(undefined, {
    enabled: !!user,
  });

  const { data: readingHistory } = trpc.readingHistory.list.useQuery(undefined, {
    enabled: !!user,
  });

  const removeFromFavorites = trpc.favorites.remove.useMutation();

  const handleLogout = async () => {
    await logout();
    navigate("/");
    toast.success("Logged out successfully");
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-lg font-playful">Please sign in to view your profile</p>
          <Button onClick={() => navigate("/")}>Go Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 border-b border-border">
        <div className="container py-8">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-heading gradient-text">My Profile</h1>
              <p className="text-muted-foreground font-playful">
                Welcome back, {user.name || "Reader"}!
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => navigate("/profile/edit")}
                className="bg-gradient-to-r from-primary to-secondary text-white font-playful rounded-full"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
              <Button
                onClick={() => navigate("/settings")}
                variant="outline"
                className="font-playful rounded-full border-2"
              >
                <Settings className="w-4 h-4 mr-2" />
                AI Settings
              </Button>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="font-playful rounded-full border-2"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Info */}
      <div className="container py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* User Card */}
          <div className="card-playful space-y-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-2xl">
              👤
            </div>
            <div>
               <h3 className="font-playfair font-bold text-lg">{user.name}</h3>
              <p className="text-sm text-muted-foreground font-playful">{user.email}</p>
            </div>
          </div>

          {/* Stats */}
           <div className="card-playful space-y-4">
             <div className="flex items-center gap-3">
               <Heart className="w-6 h-6 text-destructive" />
               <div>
                 <p className="text-sm text-muted-foreground font-playful">Favorites</p>
                 <p className="text-2xl font-playfair font-bold">
                   {favorites?.length || 0}
                 </p>
               </div>
             </div>
           </div>

          <div className="card-playful space-y-4">
            <div className="flex items-center gap-3">
              <BookOpen className="w-6 h-6 text-primary" />
               <div>
                 <p className="text-sm text-muted-foreground font-playful">Stories Read</p>
                 <p className="text-2xl font-playfair font-bold">
                   {readingHistory?.length || 0}
                 </p>
               </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mb-12">
          <h2 className="text-subheading gradient-text mb-6">Your Reading Stats</h2>
          <ReadingStats />
        </div>

        {/* Tabs */}
        <div className="space-y-6">
          <div className="flex gap-2 border-b border-border">
            <button
              onClick={() => setActiveTab("favorites")}
              className={`px-4 py-3 font-playful font-semibold transition-all border-b-2 ${
                activeTab === "favorites"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Heart className="w-4 h-4 inline mr-2" />
              Favorites ({favorites?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`px-4 py-3 font-playful font-semibold transition-all border-b-2 ${
                activeTab === "history"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Clock className="w-4 h-4 inline mr-2" />
              Reading History ({readingHistory?.length || 0})
            </button>
          </div>

          {/* Favorites Tab */}
          {activeTab === "favorites" && (
            <div className="space-y-4">
              {favorites && favorites.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {favorites.map((story: StoryRow) => (
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
                        <span className="text-xs text-muted-foreground font-playful capitalize">
                          {story.category}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFromFavorites.mutate({ storyId: story.id });
                          }}
                          className="text-destructive hover:text-destructive/80"
                        >
                          <Heart className="w-4 h-4 fill-current" />
                        </button>
                      </div>

                      <Button
                        className="w-full bg-gradient-to-r from-primary to-secondary text-white font-playful rounded-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/story/${story.id}`);
                        }}
                      >
                        Read
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 space-y-4">
                  <div className="text-5xl">💔</div>
                  <p className="text-lg font-playful text-muted-foreground">
                    No favorite stories yet
                  </p>
                  <Button
                    onClick={() => navigate("/library")}
                    className="bg-gradient-to-r from-primary to-secondary text-white font-playful rounded-full"
                  >
                    Explore Stories
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Reading History Tab */}
          {activeTab === "history" && (
            <div className="space-y-4">
              {readingHistory && readingHistory.length > 0 ? (
                <div className="space-y-3">
                  {readingHistory.map((history: HistoryRow) => (
                    <div
                      key={history.id}
                      className="card-playful cursor-pointer flex items-center justify-between gap-4 hover:shadow-lg transition-all"
                      onClick={() => navigate(`/story/${history.storyId}`)}
                    >
                       <div className="flex-1 min-w-0">
                         <p className="font-playfair font-bold text-lg truncate">
                           Story #{history.storyId}
                         </p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground font-playful mt-2">
                          <span>📖 {history.progressPercentage}% read</span>
                          <span>⏱️ {Math.floor((history.readingTimeSeconds || 0) / 60)}m read</span>
                        </div>
                      </div>

                      <div className="flex-shrink-0 text-right">
                        <p className="text-xs text-muted-foreground font-playful">
                          Last read
                        </p>
                        <p className="font-semibold text-sm">
                          {history.lastReadAt
                            ? new Date(history.lastReadAt).toLocaleDateString()
                            : "Recently"}
                        </p>
                      </div>

                      <Button
                        className="bg-gradient-to-r from-primary to-secondary text-white font-playful rounded-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/story/${history.storyId}`);
                        }}
                      >
                        Continue
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 space-y-4">
                  <div className="text-5xl">📚</div>
                  <p className="text-lg font-playful text-muted-foreground">
                    No reading history yet
                  </p>
                  <Button
                    onClick={() => navigate("/library")}
                    className="bg-gradient-to-r from-primary to-secondary text-white font-playful rounded-full"
                  >
                    Start Reading
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
