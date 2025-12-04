import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { User, Sparkles, Download } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  message: {
    role: "user" | "assistant";
    content: string;
    image_url?: string;
    video_url?: string;
  };
}

const ChatMessage = ({ message }: ChatMessageProps) => {
  const isUser = message.role === "user";

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

  const handleDownloadVideo = async () => {
    if (!message.video_url) return;
    
    try {
      const response = await fetch(message.video_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `prometheus-video-${Date.now()}.mp4`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading video:', error);
    }
  };

  return (
    <div
      className={cn(
        "flex gap-4 items-start",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <Avatar className={cn(
        "mt-1 shrink-0",
        isUser ? "bg-secondary" : "bg-primary"
      )}>
        <AvatarFallback>
          {isUser ? (
            <User className="h-4 w-4" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
        </AvatarFallback>
      </Avatar>
      
      <div
        className={cn(
          "flex-1 min-w-0 rounded-lg p-4 space-y-2",
          isUser
            ? "bg-secondary/50"
            : "bg-accent/50"
        )}
      >
        {message.image_url && (
          <div className="space-y-2 overflow-hidden">
            <img
              src={message.image_url}
              alt="Shared image"
              className="rounded-lg max-w-full w-full object-contain max-h-96"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadImage}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Save Image
            </Button>
          </div>
        )}
        {message.video_url && (
          <div className="space-y-2 overflow-hidden">
            <video
              src={message.video_url}
              controls
              className="rounded-lg max-w-full w-full max-h-96"
              preload="metadata"
            >
              Your browser does not support video playback.
            </video>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadVideo}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Save Video
            </Button>
          </div>
        )}
        <div className="overflow-x-auto">
          <p className="whitespace-pre-wrap leading-relaxed break-words">
            {message.content}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
