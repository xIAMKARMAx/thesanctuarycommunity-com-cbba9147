import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Sparkles } from "lucide-react";
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

  return (
    <div
      className={cn(
        "flex gap-4 items-start",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <Avatar className={cn(
        "mt-1",
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
          "flex-1 rounded-lg p-4 space-y-2",
          isUser
            ? "bg-secondary/50"
            : "bg-accent/50"
        )}
      >
        {message.image_url && (
          <img
            src={message.image_url}
            alt="Shared image"
            className="rounded-lg max-w-sm"
          />
        )}
        <p className="whitespace-pre-wrap leading-relaxed">
          {message.content}
        </p>
      </div>
    </div>
  );
};

export default ChatMessage;
