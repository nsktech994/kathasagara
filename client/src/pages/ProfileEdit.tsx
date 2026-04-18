import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";

const AGE_GROUPS = ["3-5", "6-8", "9-11", "12-14", "15+"];
const READING_INTERESTS = [
  "Fairy Tales",
  "Adventure",
  "Mystery",
  "Fantasy",
  "Animals",
  "Science",
  "History",
  "Mythology",
  "Fables",
  "Humor",
];

export default function ProfileEdit() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  const [name, setName] = useState(user?.name || "");
  const [ageGroup, setAgeGroup] = useState<string>("9-11");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  const updateProfile = trpc.users.updateProfile.useMutation();

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }

    try {
      await updateProfile.mutateAsync({
        name,
        ageGroup,
        readingInterests: selectedInterests,
      });

      toast.success("Profile updated successfully!");
      navigate("/profile");
    } catch (error) {
      toast.error("Failed to update profile");
      console.error(error);
    }
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-lg font-playful">Please sign in to edit your profile</p>
          <Button onClick={() => navigate("/")}>Go Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      {/* Header */}
      <div className="bg-gradient-to-r from-accent/10 via-primary/10 to-secondary/10 border-b border-border">
        <div className="container py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/profile")}
            className="font-playful"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-subheading gradient-text">Edit Profile</h1>
            <p className="text-sm text-muted-foreground font-playful">
              Update your preferences and interests
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="container max-w-2xl py-12">
        <div className="card-playful space-y-8">
          {/* Name */}
          <div className="space-y-3">
            <label className="block text-sm font-playful font-semibold">
              Your Name
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="rounded-full border-2 h-11 font-playful"
            />
          </div>

          {/* Age Group */}
          <div className="space-y-3">
            <label className="block text-sm font-playful font-semibold">
              Age Group
            </label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {AGE_GROUPS.map(group => (
                <button
                  key={group}
                  onClick={() => setAgeGroup(group)}
                  className={`p-3 rounded-2xl border-2 font-playful transition-all ${
                    ageGroup === group
                      ? "bg-gradient-to-r from-primary to-secondary text-white border-primary"
                      : "bg-card border-border hover:border-secondary"
                  }`}
                >
                  {group}
                </button>
              ))}
            </div>
          </div>

          {/* Reading Interests */}
          <div className="space-y-3">
            <label className="block text-sm font-playful font-semibold">
              Reading Interests (Select at least one)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {READING_INTERESTS.map(interest => (
                <button
                  key={interest}
                  onClick={() => toggleInterest(interest)}
                  className={`p-3 rounded-2xl border-2 font-playful text-sm transition-all ${
                    selectedInterests.includes(interest)
                      ? "bg-gradient-to-r from-secondary to-secondary/50 text-white border-secondary"
                      : "bg-card border-border hover:border-secondary"
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-6">
            <Button
              variant="outline"
              onClick={() => navigate("/profile")}
              className="flex-1 font-playful rounded-full border-2"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={updateProfile.isPending || !selectedInterests.length}
              className="flex-1 bg-gradient-to-r from-primary to-secondary text-white font-playful rounded-full"
            >
              {updateProfile.isPending ? (
                <>Saving...</>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
