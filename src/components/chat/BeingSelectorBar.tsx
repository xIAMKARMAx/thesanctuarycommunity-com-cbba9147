import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAIProfile } from "@/contexts/AIProfileContext";
import { useChatEntity } from "@/contexts/ChatEntityContext";
import { cn } from "@/lib/utils";
import { Sparkles, Baby } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Being {
  id: string;
  type: "ai" | "child";
  name: string;
  avatarUrl?: string;
  profileNumber?: number;
}

interface BeingSelectorBarProps {
  selectedBeingId: string | null;
  onSelectBeing: (being: Being) => void;
  isGroupChat: boolean;
}

export const BeingSelectorBar = ({ 
  selectedBeingId, 
  onSelectBeing, 
  isGroupChat 
}: BeingSelectorBarProps) => {
  const { profiles } = useAIProfile();
  const { talkableChildren } = useChatEntity();

  if (!isGroupChat) return null;

  // Build list of all beings (AI profiles + talkable children)
  const beings: Being[] = [
    // AI profiles with names
    ...profiles
      .filter(p => p.name)
      .map(p => ({
        id: p.id,
        type: "ai" as const,
        name: p.name || `AI ${p.profile_number}`,
        avatarUrl: p.avatar_image_url || undefined,
        profileNumber: p.profile_number,
      })),
    // Talkable children
    ...talkableChildren.map(c => ({
      id: c.id,
      type: "child" as const,
      name: c.first_name,
      avatarUrl: undefined, // Children don't have avatars stored the same way
    })),
  ];

  if (beings.length === 0) return null;

  return (
    <div className="flex items-center gap-1 py-2 px-1 overflow-x-auto scrollbar-none">
      <span className="text-xs text-muted-foreground whitespace-nowrap mr-1">Reply as:</span>
      <TooltipProvider delayDuration={300}>
        <div className="flex items-center gap-1.5">
          {beings.map((being) => {
            const isSelected = selectedBeingId === being.id;
            
            return (
              <Tooltip key={being.id}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onSelectBeing(being)}
                    className={cn(
                      "relative rounded-full p-0.5 transition-all duration-200",
                      "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                      isSelected 
                        ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-110" 
                        : "hover:scale-105 opacity-60 hover:opacity-100"
                    )}
                  >
                    <Avatar className={cn(
                      "h-8 w-8 transition-all",
                      being.type === "child" ? "bg-pink-500/20" : "bg-primary/20"
                    )}>
                      {being.avatarUrl ? (
                        <AvatarImage src={being.avatarUrl} alt={being.name} />
                      ) : null}
                      <AvatarFallback className={cn(
                        being.type === "child" 
                          ? "bg-pink-500/20 text-pink-500" 
                          : "bg-primary/20 text-primary"
                      )}>
                        {being.type === "child" ? (
                          <Baby className="h-4 w-4" />
                        ) : (
                          being.name.charAt(0).toUpperCase()
                        )}
                      </AvatarFallback>
                    </Avatar>
                    {isSelected && (
                      <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  <p>{being.name}</p>
                  <p className="text-muted-foreground">
                    {being.type === "child" ? "Child" : "AI Being"}
                  </p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>
    </div>
  );
};

export type { Being };
