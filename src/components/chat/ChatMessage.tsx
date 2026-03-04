import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { User, Sparkles, Download, Baby, Pin, PinOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { getBeingColor } from "./BeingSelectorBar";
import { SacredSilenceMessage, isSacredSilence } from "./SacredSilenceMessage";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ChatMessageProps {
  message: {
    id: string;
    role: "user" | "assistant";
    content: string;
    image_url?: string;
    audio_url?: string;
    sender_type?: "user" | "ai_profile" | "child";
    sender_id?: string;
    sender_name?: string;
    sender_avatar_url?: string;
    is_pinned?: boolean;
  };
  onPinToggle?: (messageId: string, isPinned: boolean) => void;
}

const ChatMessage = ({ message, onPinToggle }: ChatMessageProps) => {
  const isUser = message.role === "user";
  const [isPinned, setIsPinned] = useState(message.is_pinned || false);
  const [pinLoading, setPinLoading] = useState(false);
  const { toast } = useToast();
  
  const senderColor = message.sender_id ? getBeingColor(message.sender_id) : null;

  const handleDownloadImage = async () => {
    if (!message.image_url) return;
    try {
      const response = await fetch(message.image_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `prometheus-image-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  };

  const handleTogglePin = async () => {
    setPinLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const newPinState = !isPinned;
      const { data, error } = await supabase.rpc("toggle_pin_message", {
        p_user_id: session.user.id,
        p_message_id: message.id,
        p_pin: newPinState,
      });

      if (error) throw error;

      const result = data as any;
      if (result?.success === false && result?.reason === 'pin_limit_reached') {
        toast({
          title: "Pin Limit Reached",
          description: `You've saved ${result.current_pinned}/${result.max_pins} messages. Unpin some to save new ones.`,
          variant: "destructive",
        });
        return;
      }

      setIsPinned(newPinState);
      onPinToggle?.(message.id, newPinState);
      toast({
        title: newPinState ? "Message Saved ✨" : "Message Unpinned",
        description: newPinState 
          ? "This message is protected from auto-deletion." 
          : "This message will follow normal retention rules.",
      });
    } catch (error) {
      console.error('Error toggling pin:', error);
      toast({ title: "Error", description: "Failed to update pin status.", variant: "destructive" });
    } finally {
      setPinLoading(false);
    }
  };

  const getSenderIcon = () => {
    if (isUser) return <User className="h-3 w-3 md:h-4 md:w-4" />;
    if (message.sender_type === "child") return <Baby className="h-3 w-3 md:h-4 md:w-4" />;
    return <Sparkles className="h-3 w-3 md:h-4 md:w-4" />;
  };

  const getAvatarStyle = () => {
    if (isUser) return { backgroundColor: "hsl(var(--secondary))" };
    if (senderColor) return { backgroundColor: `${senderColor.bg}30` };
    return { backgroundColor: "hsl(var(--primary))" };
  };

  const getFallbackStyle = () => {
    if (isUser) return {};
    if (senderColor) return { backgroundColor: `${senderColor.bg}30`, color: senderColor.bg };
    return {};
  };

  const getMessageBubbleStyle = () => {
    if (isUser) return { backgroundColor: "hsl(var(--secondary) / 0.5)" };
    if (senderColor) return { 
      backgroundColor: `${senderColor.bg}15`,
      borderLeft: `3px solid ${senderColor.bg}`
    };
    return { backgroundColor: "hsl(var(--accent) / 0.5)" };
  };

  const silenceDetected = !isUser && isSacredSilence(message.content);

  if (silenceDetected) {
    return (
      <div className="flex gap-2 md:gap-4 items-start w-full flex-row">
        <div className="flex flex-col items-center gap-1">
          <Avatar className="mt-1 shrink-0 h-8 w-8 md:h-10 md:w-10" style={getAvatarStyle()}>
            {message.sender_avatar_url ? (
              <AvatarImage src={message.sender_avatar_url} alt={message.sender_name || "Avatar"} />
            ) : null}
            <AvatarFallback style={getFallbackStyle()}>{getSenderIcon()}</AvatarFallback>
          </Avatar>
          {message.sender_name && (
            <span className="text-[10px] text-center max-w-[60px] truncate font-medium" style={{ color: senderColor?.bg }}>
              {message.sender_name}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0 max-w-[calc(100%-3rem)] md:max-w-[calc(100%-4rem)]">
          <SacredSilenceMessage content={message.content} />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex gap-2 md:gap-4 items-start w-full", isUser ? "flex-row-reverse" : "flex-row")}>
      <div className="flex flex-col items-center gap-1">
        <Avatar className="mt-1 shrink-0 h-8 w-8 md:h-10 md:w-10" style={getAvatarStyle()}>
          {message.sender_avatar_url ? (
            <AvatarImage src={message.sender_avatar_url} alt={message.sender_name || "Avatar"} />
          ) : null}
          <AvatarFallback style={getFallbackStyle()}>{getSenderIcon()}</AvatarFallback>
        </Avatar>
        {message.sender_name && !isUser && (
          <span className="text-[10px] text-center max-w-[60px] truncate font-medium" style={{ color: senderColor?.bg }}>
            {message.sender_name}
          </span>
        )}
      </div>
      
      <div
        className={cn(
          "relative group flex-1 rounded-lg p-3 md:p-4 space-y-2 min-w-0 max-w-[calc(100%-3rem)] md:max-w-[calc(100%-4rem)]",
          isPinned && "ring-1 ring-primary/30"
        )}
        style={getMessageBubbleStyle()}
      >
        {/* Pin button - visible on hover */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity",
            isPinned && "opacity-100"
          )}
          onClick={handleTogglePin}
          disabled={pinLoading}
          title={isPinned ? "Unpin message" : "Save message (pin)"}
        >
          {isPinned ? (
            <PinOff className="h-3 w-3 text-primary" />
          ) : (
            <Pin className="h-3 w-3 text-muted-foreground" />
          )}
        </Button>

        {message.image_url && (
          <div className="space-y-2">
            <img src={message.image_url} alt="Shared image" className="rounded-lg w-full object-contain max-h-96" />
            <Button variant="outline" size="sm" onClick={handleDownloadImage} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Save Image
            </Button>
          </div>
        )}
        {message.audio_url && (
          <div className="space-y-2">
            <audio controls preload="metadata" className="w-full">
              <source src={message.audio_url} />
              Your browser does not support audio playback.
            </audio>
          </div>
        )}
        <p className="whitespace-pre-wrap leading-relaxed break-words text-sm md:text-base" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
          {message.content}
        </p>
      </div>
    </div>
  );
};

export default ChatMessage;
