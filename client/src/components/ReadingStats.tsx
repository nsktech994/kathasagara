import { trpc, type RouterOutputs } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

type HistoryRow = RouterOutputs["readingHistory"]["list"][number];
import { BookOpen, Clock, Zap, Target } from "lucide-react";

export function ReadingStats() {
  const { user } = useAuth();

  const { data: readingHistory } = trpc.readingHistory.list.useQuery(undefined, {
    enabled: !!user,
  });

  const { data: favorites } = trpc.favorites.list.useQuery(undefined, {
    enabled: !!user,
  });

  if (!user) return null;

  // Calculate statistics
  const totalStories = readingHistory?.length || 0;
  const totalReadingTime = readingHistory?.reduce((sum: number, h: HistoryRow) => sum + (h.readingTimeSeconds || 0), 0) || 0;
  const avgProgress = readingHistory?.length
    ? Math.round(readingHistory.reduce((sum: number, h: HistoryRow) => sum + (h.progressPercentage || 0), 0) / readingHistory.length)
    : 0;
  const favoriteCount = favorites?.length || 0;

  const stats = [
    {
      icon: BookOpen,
      label: "Stories Read",
      value: totalStories,
      color: "text-primary",
    },
    {
      icon: Clock,
      label: "Reading Time",
      value: `${Math.floor(totalReadingTime / 60)}m`,
      color: "text-secondary",
    },
    {
      icon: Target,
      label: "Avg Progress",
      value: `${avgProgress}%`,
      color: "text-accent",
    },
    {
      icon: Zap,
      label: "Favorites",
      value: favoriteCount,
      color: "text-destructive",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <div key={idx} className="card-playful space-y-3">
            <Icon className={`w-6 h-6 ${stat.color}`} />
            <div>
              <p className="text-sm text-muted-foreground font-playful">
                {stat.label}
              </p>
               <p className="text-2xl font-playfair font-bold">{stat.value}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
