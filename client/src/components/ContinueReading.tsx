import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

export function ContinueReading() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  const { data: readingHistory } = trpc.readingHistory.list.useQuery(undefined, {
    enabled: !!user,
  });

  if (!user || !readingHistory || readingHistory.length === 0) {
    return null;
  }

  const lastRead = readingHistory[0];
  if (!lastRead) return null;

  return (
    <section className="py-8">
      <div className="container">
        <h2 className="text-subheading gradient-text mb-6">Continue Reading</h2>

        <div
          className="card-playful cursor-pointer group"
          onClick={() => navigate(`/story/${lastRead.storyId}`)}
        >
          <div className="flex items-center justify-between gap-6">
            <div className="flex-1">
               <h3 className="font-playfair font-bold text-lg mb-2">
                Story #{lastRead.storyId}
              </h3>

              {/* Progress Bar */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-playful text-muted-foreground">
                    {lastRead.progressPercentage}% complete
                  </span>
                  <span className="font-playful text-xs text-muted-foreground">
                    {Math.floor((lastRead.readingTimeSeconds || 0) / 60)} min read
                  </span>
                </div>
                <div className="w-full bg-border rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-primary to-secondary h-full transition-all"
                    style={{ width: `${lastRead.progressPercentage}%` }}
                  />
                </div>
              </div>

              <p className="text-sm text-muted-foreground font-playful">
                Last read{" "}
                {lastRead.lastReadAt
                  ? new Date(lastRead.lastReadAt).toLocaleDateString()
                  : "recently"}
              </p>
            </div>

            <Button
              className="bg-gradient-to-r from-primary to-secondary text-white font-playful rounded-full flex-shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/story/${lastRead.storyId}`);
              }}
            >
              Continue
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
