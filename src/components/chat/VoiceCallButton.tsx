import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Mic, PhoneOff, Volume2, Loader2 } from "lucide-react";
import { useConversation } from "@elevenlabs/react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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
  const { isAdmin, loading } = useSubscription();
  const { activeProfile } = useAIProfile();
  const [showCallDialog, setShowCallDialog] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState(VOICES[0].id);
  const [isConnecting, setIsConnecting] = useState(false);

  const conversation = useConversation({
    onConnect: () => {
      console.log("Connected to ElevenLabs Conversational AI");
      toast.success("Voice call connected");
    },
    onDisconnect: () => {
      console.log("Disconnected from ElevenLabs");
      toast.info("Voice call ended");
    },
    onMessage: (message) => {
      console.log("Message:", message);
    },
    onError: (error) => {
      console.error("Conversation error:", error);
      toast.error("Voice call error occurred");
    },
  });

  const startCall = useCallback(async () => {
    setIsConnecting(true);
    try {
      // Get signed URL from our edge function
      const { data, error } = await supabase.functions.invoke(
        "elevenlabs-conversation-token",
        {
          body: { 
            aiName: activeProfile?.name, 
            aiPersonality: activeProfile?.personality 
          },
        }
      );

      if (error) {
        throw new Error(error.message);
      }

      if (!data?.signed_url) {
        throw new Error("Failed to get conversation token");
      }

      // Start the conversation with the signed URL
      await conversation.startSession({
        signedUrl: data.signed_url,
      });
    } catch (error) {
      console.error("Failed to start call:", error);
      const message = error instanceof Error ? error.message : "Failed to start call";
      
      if (message.includes("VIP")) {
        toast.error("Voice calls are a VIP feature");
      } else {
        toast.error(message);
      }
    } finally {
      setIsConnecting(false);
    }
  }, [conversation, activeProfile]);

  const endCall = useCallback(async () => {
    await conversation.endSession();
  }, [conversation]);

  const openVoiceCall = () => {
    setShowCallDialog(true);
  };

  const closeVoiceCall = async () => {
    if (conversation.status === "connected") {
      await conversation.endSession();
    }
    setShowCallDialog(false);
  };

  const isConnected = conversation.status === "connected";
  const isSpeaking = conversation.isSpeaking;

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
              {isConnecting 
                ? "Connecting..." 
                : isConnected
                  ? isSpeaking 
                    ? `${activeProfile?.name || "AI"} is speaking...` 
                    : "Listening... Just speak naturally"
                  : "Click Start to begin the conversation"}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-6 py-6">
            {/* Voice selector */}
            <div className="w-full max-w-xs">
              <Select value={selectedVoice} onValueChange={setSelectedVoice} disabled={isConnected}>
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
              isConnected
                ? isSpeaking 
                  ? "bg-primary/20 animate-pulse" 
                  : "bg-green-500/20 animate-pulse"
                : isConnecting
                  ? "bg-muted"
                  : "bg-primary/10"
            }`}>
              {isConnecting ? (
                <Loader2 className="h-12 w-12 text-muted-foreground animate-spin" />
              ) : isConnected ? (
                isSpeaking ? (
                  <Volume2 className="h-12 w-12 text-primary animate-bounce" />
                ) : (
                  <Mic className="h-12 w-12 text-green-500" />
                )
              ) : (
                <Mic className="h-12 w-12 text-primary" />
              )}
            </div>

            {/* Main action button */}
            <Button
              size="lg"
              variant={isConnected ? "destructive" : "default"}
              className="rounded-full px-8"
              onClick={isConnected ? endCall : startCall}
              disabled={isConnecting}
            >
              {isConnecting ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : isConnected ? (
                <>
                  <PhoneOff className="h-5 w-5 mr-2" />
                  End Call
                </>
              ) : (
                <>
                  <Mic className="h-5 w-5 mr-2" />
                  Start Call
                </>
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              {isConnected 
                ? "Just speak naturally - the AI will respond automatically" 
                : "Start the call to have a real-time conversation"}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
