import { useEffect, useState, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { trpc, type RouterOutputs } from "@/lib/trpc";

type RecordingRow = RouterOutputs["readAlong"]["getRecordings"][number];
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Loader2, Mic2, Square, Play, ArrowLeft } from "lucide-react";
import { Streamdown } from "streamdown";
import { toast } from "sonner";

export default function ReadAlong() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [match, params] = useRoute("/story/:id/read-along");
  const storyId = params?.id ? parseInt(params.id) : null;

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const { data: story, isLoading: storyLoading } = trpc.stories.getById.useQuery(
    { id: storyId! },
    { enabled: !!storyId }
  );

  const { data: recordings } = trpc.readAlong.getRecordings.useQuery(
    { storyId: storyId! },
    { enabled: !!storyId && !!user }
  );

  const saveRecording = trpc.readAlong.saveRecording.useMutation();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => {
        chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingTime(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      toast.error("Failed to access microphone. Please check permissions.");
      console.error(error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);

      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  };

  const handleSaveRecording = async () => {
    if (!audioBlob || !story) return;

    try {
      const uint8Array = new Uint8Array(await audioBlob.arrayBuffer());
      await saveRecording.mutateAsync({
        storyId: story.id,
        audioBlob: uint8Array,
        durationSeconds: recordingTime,
      });

      toast.success("Recording saved! Your reading practice is complete.");
      setTimeout(() => {
        navigate(`/story/${story.id}`);
      }, 1500);
    } catch (error) {
      toast.error("Failed to save recording. Please try again.");
      console.error(error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!match || !storyId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-lg font-playful">Page not found</p>
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      {/* Header */}
      <div className="bg-gradient-to-r from-accent/10 via-primary/10 to-secondary/10 border-b border-border">
        <div className="container py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate(`/story/${story.id}`)}
            className="font-playful"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-subheading gradient-text">Read-Along Practice</h1>
            <p className="text-sm text-muted-foreground font-playful">
              Record yourself reading "{story.title}"
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Story Content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card-playful space-y-4">
              <h2 className="text-heading">Story to Read</h2>
              <div className="prose prose-sm max-w-none">
                <Streamdown>{story.content}</Streamdown>
              </div>
            </div>
          </div>

          {/* Recording Panel */}
          <div className="lg:col-span-1">
            <div className="card-playful space-y-6 sticky top-4">
              <div className="text-center space-y-4">
                <div className="text-6xl">🎤</div>
                <h3 className="text-subheading">Recording</h3>
              </div>

              {/* Recording Time */}
              <div className="text-center p-6 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl">
                <p className="text-sm text-muted-foreground font-playful mb-2">
                  Recording Time
                </p>
                 <p className="text-4xl font-playfair font-bold text-primary">
                  {formatTime(recordingTime)}
                </p>
              </div>

              {/* Recording Controls */}
              <div className="space-y-3">
                {!audioUrl ? (
                  <>
                    {!isRecording ? (
                      <Button
                        onClick={startRecording}
                        className="w-full bg-gradient-to-r from-accent to-accent/50 text-white font-playful py-6 rounded-full text-lg"
                      >
                        <Mic2 className="w-5 h-5 mr-2" />
                        Start Recording
                      </Button>
                    ) : (
                      <Button
                        onClick={stopRecording}
                        className="w-full bg-destructive text-white font-playful py-6 rounded-full text-lg"
                      >
                        <Square className="w-5 h-5 mr-2" />
                        Stop Recording
                      </Button>
                    )}
                  </>
                ) : (
                  <>
                    <div className="p-4 bg-card border-2 border-border rounded-2xl space-y-3">
                      <p className="text-sm font-playful text-center">
                        Recording saved!
                      </p>
                      <audio
                        src={audioUrl}
                        controls
                        className="w-full rounded-lg"
                      />
                    </div>

                    <Button
                      onClick={() => {
                        setAudioBlob(null);
                        setAudioUrl(null);
                        setRecordingTime(0);
                      }}
                      variant="outline"
                      className="w-full font-playful rounded-full border-2"
                    >
                      Record Again
                    </Button>

                    <Button
                      onClick={handleSaveRecording}
                      disabled={saveRecording.isPending}
                      className="w-full bg-gradient-to-r from-primary to-secondary text-white font-playful py-6 rounded-full"
                    >
                      {saveRecording.isPending ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Play className="w-5 h-5 mr-2" />
                          Save Recording
                        </>
                      )}
                    </Button>
                  </>
                )}
              </div>

              {/* Tips */}
              <div className="p-4 bg-secondary/10 rounded-2xl space-y-2">
                <p className="text-sm font-playful font-semibold text-secondary">
                  Tips for Great Reading:
                </p>
                <ul className="text-xs text-muted-foreground font-playful space-y-1">
                  <li>✓ Read slowly and clearly</li>
                  <li>✓ Use different voices for characters</li>
                  <li>✓ Take pauses between sentences</li>
                  <li>✓ Have fun with it!</li>
                </ul>
              </div>

              {/* Previous Recordings */}
              {recordings && recordings.length > 0 && (
                <div className="space-y-3 border-t border-border pt-4">
                  <p className="text-sm font-playful font-semibold">
                    Previous Recordings
                  </p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {recordings.map((rec: RecordingRow, idx: number) => (
                      <div
                        key={rec.id}
                        className="p-3 bg-card border border-border rounded-lg space-y-2"
                      >
                        <p className="text-xs text-muted-foreground font-playful">
                          Recording {idx + 1}
                        </p>
                        {rec.audioUrl && (
                          <audio
                            src={rec.audioUrl}
                            controls
                            className="w-full h-6 rounded"
                          />
                        )}
                        {rec.transcription && (
                          <p className="text-xs text-foreground font-playful line-clamp-2">
                            {rec.transcription}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
