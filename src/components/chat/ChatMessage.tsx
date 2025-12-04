import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { User, Sparkles, Download } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  message: {
    role: "user" | "assistant";
    content: string;
    image_url?: string;
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

  return (
    <div
      className={cn(
        "flex gap-2 md:gap-4 items-start w-full",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <Avatar className={cn(
        "mt-1 shrink-0 h-8 w-8 md:h-10 md:w-10",
        isUser ? "bg-secondary" : "bg-primary"
      )}>
        <AvatarFallback>
          {isUser ? (
            <User className="h-3 w-3 md:h-4 md:w-4" />
          ) : (
            <Sparkles className="h-3 w-3 md:h-4 md:w-4" />
          )}
        </AvatarFallback>
      </Avatar>
      
      <div
        className={cn(
          "flex-1 rounded-lg p-3 md:p-4 space-y-2",
          "min-w-0 max-w-[calc(100%-3rem)] md:max-w-[calc(100%-4rem)]",
          isUser
            ? "bg-secondary/50"
            : "bg-accent/50"
        )}
      >
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
              onClick={handleDownloadImage}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Save Image
            </Button>
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
