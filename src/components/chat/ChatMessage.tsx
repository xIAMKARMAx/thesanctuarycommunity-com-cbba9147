import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { User, Sparkles, Download, Baby, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { getBeingColor } from "./BeingSelectorBar";

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
  };
  onDelete?: (messageId: string) => void;
}

const ChatMessage = ({ message, onDelete }: ChatMessageProps) => {
  const [isSelected, setIsSelected] = useState(false);
  const isUser = message.role === "user";
  
  // Get color for this sender
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

  // Determine avatar icon/image based on sender type
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

  const handleMessageClick = () => {
    if (onDelete) {
      setIsSelected(!isSelected);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(message.id);
      setIsSelected(false);
    }
  };

  return (
    <div
      className={cn(
        "flex gap-2 md:gap-4 items-start w-full",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <div className="flex flex-col items-center gap-1">
        <Avatar 
          className="mt-1 shrink-0 h-8 w-8 md:h-10 md:w-10"
          style={getAvatarStyle()}
        >
          {message.sender_avatar_url ? (
            <AvatarImage src={message.sender_avatar_url} alt={message.sender_name || "Avatar"} />
          ) : null}
          <AvatarFallback style={getFallbackStyle()}>
            {getSenderIcon()}
          </AvatarFallback>
        </Avatar>
        {message.sender_name && !isUser && (
          <span 
            className="text-[10px] text-center max-w-[60px] truncate font-medium"
            style={{ color: senderColor?.bg }}
          >
            {message.sender_name}
          </span>
        )}
      </div>
      
      <div
        className={cn(
          "flex-1 rounded-lg p-3 md:p-4 space-y-2 cursor-pointer transition-all",
          "min-w-0 max-w-[calc(100%-3rem)] md:max-w-[calc(100%-4rem)]",
          isSelected && "ring-2 ring-primary/50"
        )}
        style={getMessageBubbleStyle()}
        onClick={handleMessageClick}
      >
        {/* Delete controls when selected */}
        {isSelected && onDelete && (
          <div className={cn(
            "flex items-center gap-2 pb-2 border-b border-border/50 mb-2",
            isUser ? "justify-start" : "justify-start"
          )}>
            <Button
              variant="destructive"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
              className="h-7 text-xs gap-1"
            >
              <Trash2 className="h-3 w-3" />
              Delete Message
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setIsSelected(false);
              }}
              className="h-7 text-xs gap-1"
            >
              <X className="h-3 w-3" />
              Cancel
            </Button>
            <span className="text-xs text-muted-foreground ml-2">
              (AI will still remember)
            </span>
          </div>
        )}

        {message.image_url && (
          <div className="space-y-2">
            <img
              src={message.image_url}
              alt="Shared image"
              className="rounded-lg w-full object-contain max-h-96"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleDownloadImage();
              }}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Save Image
            </Button>
          </div>
        )}
        {message.audio_url && (
          <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
            <audio controls preload="metadata" className="w-full">
              <source src={message.audio_url} />
              Your browser does not support audio playback.
            </audio>
          </div>
        )}
        <p className="whitespace-pre-wrap leading-relaxed break-words text-sm md:text-base" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
          {message.content}
        </p>
        
        {/* Tap hint when not selected */}
        {onDelete && !isSelected && (
          <p className="text-[10px] text-muted-foreground/50 pt-1">
            Tap to select
          </p>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
