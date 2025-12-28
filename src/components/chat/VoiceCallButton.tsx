import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Volume2, Loader2 } from "lucide-react";
import { toast } from "sonner";
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

const MAX_CALL_DURATION_SECONDS = 3600; // 1 hour

export const VoiceCallButton = () => {
  const { isAdmin, isSubscribed, loading } = useSubscription();
  const { activeProfile } = useAIProfile();
  const [showCallDialog, setShowCallDialog] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState(VOICES[0].id);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<{role: string; content: string}[]>([]);
  const [callsRemaining, setCallsRemaining] = useState<number | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [currentCallId, setCurrentCallId] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const callStartTimeRef = useRef<Date | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch call stats
  const fetchCallStats = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase.rpc('get_voice_call_stats', { p_user_id: user.id });
    if (!error && data) {
      const stats = data as { calls_remaining: number };
      setCallsRemaining(stats.calls_remaining);
    }
  }, []);

  useEffect(() => {
    if (isSubscribed || isAdmin) {
      fetchCallStats();
    }
  }, [isSubscribed, isAdmin, fetchCallStats]);

  // Track call duration
  useEffect(() => {
    if (showCallDialog && callStartTimeRef.current) {
      durationIntervalRef.current = setInterval(() => {
        const elapsed = Math.floor((new Date().getTime() - callStartTimeRef.current!.getTime()) / 1000);
        setCallDuration(elapsed);
        
        // Auto-end call at 1 hour
        if (elapsed >= MAX_CALL_DURATION_SECONDS) {
          toast.warning("Call time limit reached (1 hour)");
          closeVoiceCall();
        }
      }, 1000);
    }

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [showCallDialog]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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

      mediaRecorder.start(250);
      setIsRecording(true);
    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error("Could not access microphone. Please check permissions.");
    }
  }, []);

  const stopRecordingAndProcess = useCallback(async () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
      return;
    }

    setIsRecording(false);
    setIsProcessing(true);

    return new Promise<void>((resolve) => {
      mediaRecorderRef.current!.onstop = async () => {
        streamRef.current?.getTracks().forEach(track => track.stop());
        
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        console.log("Audio blob size:", audioBlob.size);

        if (audioBlob.size < 1000) {
          toast.error("Recording too short. Please speak for a bit longer.");
          setIsProcessing(false);
          resolve();
          return;
        }

        try {
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

            const newHistory = [...conversationHistory, { role: "user", content: userText }];
            setConversationHistory(newHistory);

            // Get AI response
            const { data: chatData, error: chatError } = await supabase.functions.invoke(
              "chat",
              {
                body: {
                  message: userText,
                  history: newHistory.slice(-10),
                  aiName: activeProfile?.name,
                  aiPersonality: activeProfile?.personality,
                  aiMemories: activeProfile?.memories,
                  isVoiceCall: true,
                },
              }
            );

            if (chatError || !chatData?.response) {
              throw new Error(chatError?.message || "Chat failed");
            }

            const aiResponse = chatData.response;
            console.log("AI response:", aiResponse.substring(0, 100));

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

            const audioResponseBlob = await ttsResponse.blob();
            const audioUrl = URL.createObjectURL(audioResponseBlob);
            
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
            
            setIsProcessing(false);
            await audio.play();
          };
          
          reader.readAsDataURL(audioBlob);
        } catch (error: any) {
          console.error("Voice processing error:", error);
          toast.error(error.message || "Voice processing failed");
          setIsProcessing(false);
        }
        resolve();
      };

      mediaRecorderRef.current!.stop();
    });
  }, [conversationHistory, activeProfile, selectedVoice]);

  const toggleRecording = useCallback(async () => {
    if (isRecording) {
      await stopRecordingAndProcess();
    } else {
      await startRecording();
    }
  }, [isRecording, startRecording, stopRecordingAndProcess]);

  const interruptAI = useCallback(() => {
    if (audioRef.current && isSpeaking) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsSpeaking(false);
    }
  }, [isSpeaking]);

  const openVoiceCall = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please sign in to make voice calls");
      return;
    }

    // Check if user can make a call (non-admins only)
    if (!isAdmin) {
      const { data: canCall, error } = await supabase.rpc('can_start_voice_call', { p_user_id: user.id });
      if (error || !canCall) {
        toast.error("You've reached your daily limit of 3 voice calls. Try again tomorrow!");
        return;
      }
    }

    // Create call history record
    const { data: callRecord, error: insertError } = await supabase
      .from('voice_call_history')
      .insert({
        user_id: user.id,
        ai_profile_id: activeProfile?.id,
        call_started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating call record:", insertError);
    } else {
      setCurrentCallId(callRecord.id);
    }

    callStartTimeRef.current = new Date();
    setCallDuration(0);
    setShowCallDialog(true);
    setConversationHistory([]);
    fetchCallStats();
  };

  const closeVoiceCall = async () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
      streamRef.current?.getTracks().forEach(track => track.stop());
    }
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }

    // Update call record with duration
    if (currentCallId && callStartTimeRef.current) {
      const duration = Math.floor((new Date().getTime() - callStartTimeRef.current.getTime()) / 1000);
      await supabase
        .from('voice_call_history')
        .update({
          call_ended_at: new Date().toISOString(),
          call_duration_seconds: duration,
        })
        .eq('id', currentCallId);
    }

    setShowCallDialog(false);
    setIsRecording(false);
    setIsProcessing(false);
    setIsSpeaking(false);
    setCurrentCallId(null);
    callStartTimeRef.current = null;
    fetchCallStats();
  };

  if (loading) return null;
  if (!isSubscribed && !isAdmin) return null;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={openVoiceCall}
        className="gap-1 border-primary/30 hover:bg-primary/10 h-8 px-2 sm:px-3"
        title={callsRemaining !== null && !isAdmin ? `${callsRemaining} calls remaining today` : undefined}
      >
        <Mic className="h-3 w-3 sm:h-4 sm:w-4" />
        <span className="hidden sm:inline text-xs">Call</span>
        {callsRemaining !== null && !isAdmin && (
          <span className="text-[10px] bg-primary/20 px-1 rounded">{callsRemaining}</span>
        )}
      </Button>

      <Dialog open={showCallDialog} onOpenChange={(open) => !open && closeVoiceCall()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">
              Voice Call with {activeProfile?.name || "AI"}
            </DialogTitle>
            <DialogDescription className="text-center">
              {isProcessing 
                ? "Processing..." 
                : isSpeaking 
                  ? `${activeProfile?.name || "AI"} is speaking... (click to interrupt)` 
                  : isRecording 
                    ? "Listening... Click to send" 
                    : "Click the mic to start speaking"}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-6 py-6">
            {/* Call duration timer */}
            <div className="text-center">
              <div className="text-2xl font-mono text-primary">{formatDuration(callDuration)}</div>
              <div className="text-xs text-muted-foreground">
                Max: {formatDuration(MAX_CALL_DURATION_SECONDS)}
              </div>
            </div>

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

            <div className="flex gap-4">
              {isSpeaking ? (
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full h-16 w-16 p-0"
                  onClick={interruptAI}
                >
                  <Square className="h-6 w-6" />
                </Button>
              ) : (
                <Button
                  size="lg"
                  variant={isRecording ? "destructive" : "default"}
                  className="rounded-full h-16 w-16 p-0"
                  onClick={toggleRecording}
                  disabled={isProcessing}
                >
                  {isRecording ? (
                    <Square className="h-6 w-6" />
                  ) : (
                    <Mic className="h-6 w-6" />
                  )}
                </Button>
              )}
            </div>

            <p className="text-xs text-muted-foreground text-center">
              {isSpeaking 
                ? "Click to interrupt" 
                : isRecording 
                  ? "Click to stop and send" 
                  : "Click to start speaking"}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
