import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { ArrowLeft, Save, ShieldCheck, Cpu } from "lucide-react";
import { toast } from "sonner";

const MODELS = [
  { id: "openai/gpt-4o-mini", label: "GPT-4o Mini (Fast & Cheap)" },
  { id: "openai/gpt-4o", label: "GPT-4o (Powerful)" },
  { id: "anthropic/claude-3.5-sonnet", label: "Claude 3.5 Sonnet (Creative)" },
  { id: "google/gemini-flash-1.5", label: "Gemini 1.5 Flash" },
  { id: "meta-llama/llama-3.1-8b-instruct", label: "Llama 3.1 8B (Fast)" },
];

export default function Settings() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  const [apiKey, setApiKey] = useState(user?.openRouterApiKey || "");
  const [model, setModel] = useState(user?.openRouterModel || MODELS[0].id);

  const updateSettings = trpc.users.updateAiSettings.useMutation({
    onSuccess: () => {
      void utils.auth.me.invalidate();
    }
  });

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync({
        openRouterApiKey: apiKey,
        openRouterModel: model,
      });

      toast.success("Settings saved successfully!");
      navigate("/profile");
    } catch (error) {
      toast.error("Failed to save settings");
      console.error(error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-lg font-playful">Please sign in to access settings</p>
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
            <h1 className="text-subheading gradient-text">AI Settings</h1>
            <p className="text-sm text-muted-foreground font-playful">
              Configure your OpenRouter API key and story generation model
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="container max-w-2xl py-12">
        <div className="card-playful space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <ShieldCheck className="w-5 h-5" />
              <h2 className="font-playful font-bold">API Configuration</h2>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-playful font-semibold" htmlFor="apiKey">
                OpenRouter API Key
              </label>
              <Input
                id="apiKey"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-or-v1-..."
                className="rounded-xl font-playful"
              />
              <p className="text-xs text-muted-foreground font-playful">
                Your key is stored securely and used only for your story requests.
                Get one at <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" className="text-primary hover:underline">openrouter.ai</a>.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 text-secondary">
              <Cpu className="w-5 h-5" />
              <h2 className="font-playful font-bold">Model Selection</h2>
            </div>

            <div className="grid gap-3">
              {MODELS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setModel(m.id)}
                  className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all font-playful ${
                    model === m.id
                      ? "border-secondary bg-secondary/10 shadow-sm"
                      : "border-border bg-card hover:border-secondary/40"
                  }`}
                >
                  <span className={model === m.id ? "font-bold text-secondary" : ""}>
                    {m.label}
                  </span>
                  {model === m.id && (
                    <div className="w-2 h-2 rounded-full bg-secondary" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-6 border-t border-border">
            <Button
              variant="outline"
              onClick={() => navigate("/profile")}
              className="flex-1 font-playful rounded-full border-2"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={updateSettings.isPending}
              className="flex-1 bg-gradient-to-r from-primary to-secondary text-white font-playful rounded-full"
            >
              {updateSettings.isPending ? (
                <>Saving...</>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
