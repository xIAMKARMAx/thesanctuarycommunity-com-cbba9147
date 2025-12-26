import { useState, useCallback } from "react";
import { useConversation } from "@elevenlabs/react";
import { Button } from "@/components/ui/button";
import { Phone, PhoneOff, Mic, MicOff, Volume2 } from "lucide-react";
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

export const VoiceCallButton = () => {
  const { toast } = useToast();
  const { isAdmin, loading } = useSubscription();
  const { activeProfile } = useAIProfile();
  const [isConnecting, setIsConnecting] = useState(false);
  const [showCallDialog, setShowCallDialog] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  console.log("[VoiceCallButton] isAdmin:", isAdmin, "loading:", loading);

  const conversation = useConversation({
    onConnect: () => {
      console.log("Voice call connected");
      toast({
        title: "Connected",
        description: `Voice call with ${activeProfile?.name || 'AI'} started`,
      });
    },
    onDisconnect: () => {
      console.log("Voice call disconnected");
      setShowCallDialog(false);
    },
    onMessage: (message) => {
      console.log("Voice message:", message);
    },
    onError: (error) => {
      console.error("Voice call error:", error);
      toast({
        variant: "destructive",
        title: "Call Error",
        description: "There was an issue with the voice call. Please try again.",
      });
    },
  });

  const startCall = useCallback(async () => {
    if (!isAdmin) {
      toast({
        variant: "destructive",
        title: "VIP Feature",
        description: "Voice calls are only available for VIP users.",
      });
      return;
    }

    setIsConnecting(true);
    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Get signed URL from our edge function
      const { data, error } = await supabase.functions.invoke(
        "elevenlabs-conversation-token",
        {
          body: {
            aiName: activeProfile?.name,
            aiPersonality: activeProfile?.personality,
          },
        }
      );

      if (error || !data?.signed_url) {
        throw new Error(error?.message || "Failed to get voice call token");
      }

      setShowCallDialog(true);

      // Start the conversation with WebSocket
      await conversation.startSession({
        signedUrl: data.signed_url,
      });
    } catch (error: any) {
      console.error("Failed to start voice call:", error);
      toast({
        variant: "destructive",
        title: "Call Failed",
        description: error.message || "Could not start voice call. Please try again.",
      });
      setShowCallDialog(false);
    } finally {
      setIsConnecting(false);
    }
  }, [conversation, activeProfile, isAdmin, toast]);

  const endCall = useCallback(async () => {
    await conversation.endSession();
    setShowCallDialog(false);
    toast({
      title: "Call Ended",
      description: "Voice call has ended.",
    });
  }, [conversation, toast]);

  const toggleMute = useCallback(() => {
    setIsMuted(!isMuted);
    // Note: ElevenLabs SDK handles mute via microphone track
  }, [isMuted]);

  // Show loading state or hide for non-admin users
  if (loading) {
    return null; // Still checking admin status
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
        onClick={startCall}
        disabled={isConnecting || conversation.status === "connected"}
        className="gap-2 border-primary/30 hover:bg-primary/10"
      >
        <Phone className="h-4 w-4" />
        <span className="hidden sm:inline">
          {isConnecting ? "Connecting..." : "Voice Call"}
        </span>
      </Button>

      <Dialog open={showCallDialog} onOpenChange={(open) => {
        if (!open) endCall();
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">
              Voice Call with {activeProfile?.name || "AI"}
            </DialogTitle>
            <DialogDescription className="text-center">
              {conversation.status === "connected" 
                ? conversation.isSpeaking 
                  ? "AI is speaking..." 
                  : "Listening..."
                : "Connecting..."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-6 py-8">
            {/* Avatar/Visual indicator */}
            <div className={`w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center ${
              conversation.isSpeaking ? "animate-pulse" : ""
            }`}>
              <Volume2 className={`h-12 w-12 text-primary ${
                conversation.isSpeaking ? "animate-bounce" : ""
              }`} />
            </div>

            {/* Call controls */}
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={toggleMute}
                className={isMuted ? "bg-destructive/20" : ""}
              >
                {isMuted ? (
                  <MicOff className="h-5 w-5" />
                ) : (
                  <Mic className="h-5 w-5" />
                )}
              </Button>

              <Button
                variant="destructive"
                size="lg"
                onClick={endCall}
                className="rounded-full h-14 w-14"
              >
                <PhoneOff className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
