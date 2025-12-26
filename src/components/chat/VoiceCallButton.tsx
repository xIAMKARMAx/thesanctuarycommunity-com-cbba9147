import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Volume2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useAIProfile } from "@/contexts/AIProfileContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const VOICES = [
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah (Female)" },
  { id: "JBFqnCBsd6RMkjVDRZzb", name: "George (Male)" },
  { id: "pFZP5JQG7iQjIQuC4Bku", name: "Lily (Female)" },
  { id: "onwK4e9ZLuTAKqWW03F9", name: "Daniel (Male)" },
  { id: "cgSgspJ2msm6clMCkdW9", name: "Jessica (Female)" },
  { id: "cjVigY5qzO86Huf0OWal", name: "Eric (Male)" },
  { id: "XrExE9yKIg1WjnnlVkGX", name: "Matilda (Female)" },
  { id: "TX3LPaxmHKxFdv7VOQHJ", name: "Liam (Male)" },
];

export const VoiceCallButton = () => {
  const { toast } = useToast();
  const { isAdmin, loading } = useSubscription();
  const { activeProfile } = useAIProfile();
  const [showCallDialog, setShowCallDialog] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState(VOICES[0].id);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<{role: string; content: string}[]>([]);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recordingStartTimeRef = useRef<number>(0);

  console.log("[VoiceCallButton] isAdmin:", isAdmin, "loading:", loading);

  const startRecording = useCallback(async () => {
    try {
      // Stop any playing audio when user starts speaking (interrupt)
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setIsSpeaking(false);
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      recordingStartTimeRef.current = Date.now();
      setIsRecording(true);
    } catch (error) {
      console.error("Error starting recording:", error);
      toast({
        variant: "destructive",
        title: "Microphone Error",
        description: "Could not access microphone. Please check permissions.",
      });
    }
  }, [toast]);

  const stopRecording = useCallback(async () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
      return;
    }

    // Check minimum recording duration (1 second)
    const recordingDuration = Date.now() - recordingStartTimeRef.current;
    if (recordingDuration < 1000) {
      // Stop recording but don't process - too short
      streamRef.current?.getTracks().forEach(track => track.stop());
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast({
        title: "Recording too short",
        description: "Please hold the button for at least 1 second",
      });
      return;
    }

    return new Promise<void>((resolve) => {
      mediaRecorderRef.current!.onstop = async () => {
        // Stop all tracks
        streamRef.current?.getTracks().forEach(track => track.stop());
        
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setIsRecording(false);
        setIsProcessing(true);

        try {
          // Convert blob to base64
          const reader = new FileReader();
          reader.onloadend = async () => {
            const base64Audio = (reader.result as string).split(',')[1];
            
            // Send to STT
            const { data: sttData, error: sttError } = await supabase.functions.invoke(
              "elevenlabs-stt",
              { body: { audio: base64Audio } }
            );

            if (sttError || !sttData?.text) {
              throw new Error(sttError?.message || "Transcription failed");
            }

            const userText = sttData.text;
            console.log("User said:", userText);

            // Add to conversation history
            const newHistory = [...conversationHistory, { role: "user", content: userText }];
            setConversationHistory(newHistory);

            // Get AI response using the chat function
            const { data: chatData, error: chatError } = await supabase.functions.invoke(
              "chat",
              {
                body: {
                  message: userText,
                  history: newHistory.slice(-10), // Last 10 messages for context
                  aiName: activeProfile?.name,
                  aiPersonality: activeProfile?.personality,
                  aiMemories: activeProfile?.memories,
                  isVoiceCall: true, // Signal for shorter responses
                },
              }
            );

            if (chatError || !chatData?.reply) {
              throw new Error(chatError?.message || "Chat failed");
            }

            const aiResponse = chatData.reply;
            console.log("AI response:", aiResponse.substring(0, 50));

            // Add AI response to history
            setConversationHistory([...newHistory, { role: "assistant", content: aiResponse }]);

            // Convert to speech
            const ttsResponse = await fetch(
              `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
                  Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
                },
                body: JSON.stringify({ text: aiResponse, voiceId: selectedVoice }),
              }
            );

            if (!ttsResponse.ok) {
              throw new Error("TTS generation failed");
            }

            const audioBlob = await ttsResponse.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            
            // Play the audio
            const audio = new Audio(audioUrl);
            audioRef.current = audio;
            
            audio.onplay = () => setIsSpeaking(true);
            audio.onended = () => {
              setIsSpeaking(false);
              URL.revokeObjectURL(audioUrl);
            };
            audio.onerror = () => {
              setIsSpeaking(false);
              URL.revokeObjectURL(audioUrl);
            };
            
            await audio.play();
          };
          
          reader.readAsDataURL(audioBlob);
        } catch (error: any) {
          console.error("Voice processing error:", error);
          toast({
            variant: "destructive",
            title: "Error",
            description: error.message || "Voice processing failed",
          });
        } finally {
          setIsProcessing(false);
          resolve();
        }
      };

      mediaRecorderRef.current!.stop();
    });
  }, [conversationHistory, activeProfile, selectedVoice, toast]);

  const openVoiceCall = () => {
    setShowCallDialog(true);
    setConversationHistory([]);
  };

  const closeVoiceCall = () => {
    // Stop any playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    // Stop recording if active
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
      streamRef.current?.getTracks().forEach(track => track.stop());
    }
    setShowCallDialog(false);
    setIsRecording(false);
    setIsProcessing(false);
    setIsSpeaking(false);
  };

  // Show loading state or hide for non-admin users
  if (loading) {
    return null;
  }

  if (!isAdmin) {
    console.log("[VoiceCallButton] Not showing - user is not admin");
    return null;
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={openVoiceCall}
        className="gap-2 border-primary/30 hover:bg-primary/10"
      >
        <Mic className="h-4 w-4" />
        <span className="hidden sm:inline">Voice Call</span>
      </Button>

      <Dialog open={showCallDialog} onOpenChange={(open) => {
        if (!open) closeVoiceCall();
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">
              Voice Call with {activeProfile?.name || "AI"}
            </DialogTitle>
            <DialogDescription className="text-center">
              {isProcessing 
                ? "Processing..." 
                : isSpeaking 
                  ? "AI is speaking... (tap mic to interrupt)" 
                  : isRecording 
                    ? "Listening... (release to send)" 
                    : "Hold the button to speak"}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-6 py-6">
            {/* Voice selector */}
            <div className="w-full max-w-xs">
              <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a voice" />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border z-50">
                  {VOICES.map((voice) => (
                    <SelectItem key={voice.id} value={voice.id}>
                      {voice.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Visual indicator */}
            <div className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${
              isRecording 
                ? "bg-destructive/20 animate-pulse" 
                : isSpeaking 
                  ? "bg-primary/20 animate-pulse" 
                  : isProcessing
                    ? "bg-muted"
                    : "bg-primary/10"
            }`}>
              {isProcessing ? (
                <Loader2 className="h-12 w-12 text-muted-foreground animate-spin" />
              ) : isSpeaking ? (
                <Volume2 className="h-12 w-12 text-primary animate-bounce" />
              ) : (
                <Mic className={`h-12 w-12 ${isRecording ? "text-destructive" : "text-primary"}`} />
              )}
            </div>

            {/* Push-to-talk button */}
            <Button
              size="lg"
              variant={isRecording ? "destructive" : "default"}
              className="rounded-full h-16 w-16 p-0"
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onMouseLeave={() => {
                if (isRecording) stopRecording();
              }}
              onTouchStart={startRecording}
              onTouchEnd={stopRecording}
              disabled={isProcessing}
            >
              {isRecording ? (
                <Square className="h-6 w-6" />
              ) : (
                <Mic className="h-6 w-6" />
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              {isRecording 
                ? "Release to send your message" 
                : "Press and hold to speak"}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
