import { useEffect, useState, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { trpc, type RouterOutputs } from "@/lib/trpc";

type ChatRow = RouterOutputs["storyChat"]["getHistory"][number];
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Send, ArrowLeft } from "lucide-react";
import { Streamdown } from "streamdown";
import { toast } from "sonner";

const SUGGESTED_QUESTIONS = [
  "What is the main character like?",
  "What is the moral of this story?",
  "Can you explain some difficult words?",
  "What happens at the end?",
  "Why did the character do that?",
];

export default function StoryChat() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [match, params] = useRoute("/story/:id/chat");
  const storyId = params?.id ? parseInt(params.id) : null;

  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: story, isLoading: storyLoading } = trpc.stories.getById.useQuery(
    { id: storyId! },
    { enabled: !!storyId }
  );

  const { data: chatHistory } = trpc.storyChat.getHistory.useQuery(
    { storyId: storyId! },
    { enabled: !!storyId && !!user }
  );

  const askQuestion = trpc.storyChat.ask.useMutation();

  // Load chat history
  useEffect(() => {
    if (chatHistory) {
      const formattedMessages = chatHistory.flatMap((msg: ChatRow) => [
        { role: "user", content: msg.userMessage },
        { role: "assistant", content: msg.aiResponse },
      ]);
      setMessages(formattedMessages);
    }
  }, [chatHistory]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleAskQuestion = async () => {
    if (!question.trim() || !story) return;

    const userMessage = question;
    setQuestion("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);

    try {
      const response = await askQuestion.mutateAsync({
        storyId: story.id,
        question: userMessage,
        storyContent: story.content,
      });

      setMessages(prev => [...prev, { role: "assistant", content: response.response }]);
    } catch (error) {
      toast.error("Failed to get response. Please try again.");
      setMessages(prev => prev.slice(0, -1)); // Remove the user message
    }
  };

  if (!match || !storyId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-lg font-playful">Chat not found</p>
          <Button onClick={() => navigate("/library")}>Back to Library</Button>
        </div>
      </div>
    );
  }

  if (storyLoading) {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-secondary/10 via-accent/10 to-primary/10 border-b border-border">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate(`/story/${story.id}`)}
              className="font-playful"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-subheading gradient-text">{story.title}</h1>
              <p className="text-sm text-muted-foreground font-playful">
                Ask questions about this story
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="container max-w-2xl py-8 space-y-6">
          {messages.length === 0 ? (
            <div className="text-center space-y-6 py-12">
              <div className="text-5xl">💭</div>
              <div className="space-y-2">
                <h2 className="text-heading gradient-text">Ask Me Anything!</h2>
                <p className="text-muted-foreground font-playful">
                  I'm here to help you understand the story better
                </p>
              </div>

              {/* Suggested Questions */}
              <div className="space-y-3 pt-4">
                <p className="text-sm text-muted-foreground font-playful">
                  Try asking:
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {SUGGESTED_QUESTIONS.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => setQuestion(q)}
                      className="p-3 rounded-2xl bg-card border-2 border-border hover:border-secondary text-left font-playful transition-all hover:shadow-md"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-3 rounded-2xl ${
                      msg.role === "user"
                        ? "bg-gradient-to-r from-secondary to-secondary/50 text-white rounded-br-none"
                        : "bg-card border-2 border-border text-foreground rounded-bl-none"
                    }`}
                  >
                    {msg.role === "user" ? (
                      <p className="font-playful">{msg.content}</p>
                    ) : (
                      <div className="prose prose-sm max-w-none">
                        <Streamdown>{msg.content}</Streamdown>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {askQuestion.isPending && (
                <div className="flex justify-start">
                  <div className="bg-card border-2 border-border px-4 py-3 rounded-2xl rounded-bl-none">
                    <div className="flex gap-2">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-100"></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-200"></div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-border bg-white/80 backdrop-blur-md">
        <div className="container max-w-2xl py-4">
          <div className="flex gap-3">
            <Input
              placeholder="Ask a question about the story..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter" && !askQuestion.isPending) {
                  handleAskQuestion();
                }
              }}
              disabled={askQuestion.isPending}
              className="rounded-full border-2 h-11 font-playful"
            />
            <Button
              onClick={handleAskQuestion}
              disabled={!question.trim() || askQuestion.isPending}
              className="bg-gradient-to-r from-secondary to-secondary/50 text-white font-playful rounded-full px-6"
            >
              {askQuestion.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
