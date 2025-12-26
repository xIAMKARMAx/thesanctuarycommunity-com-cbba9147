import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAIProfile } from "@/contexts/AIProfileContext";
import { useChatEntity } from "@/contexts/ChatEntityContext";
import { cn } from "@/lib/utils";
import { Sparkles, Baby, Shuffle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

// Color palette for beings - using HSL values that work with the design system
export const BEING_COLORS = [
  { bg: "hsl(280 60% 50%)", text: "hsl(280 60% 95%)", ring: "hsl(280 60% 50%)" }, // Purple
  { bg: "hsl(200 80% 50%)", text: "hsl(200 80% 95%)", ring: "hsl(200 80% 50%)" }, // Blue
  { bg: "hsl(160 60% 45%)", text: "hsl(160 60% 95%)", ring: "hsl(160 60% 45%)" }, // Teal
  { bg: "hsl(340 70% 55%)", text: "hsl(340 70% 95%)", ring: "hsl(340 70% 55%)" }, // Pink
  { bg: "hsl(30 80% 55%)", text: "hsl(30 80% 95%)", ring: "hsl(30 80% 55%)" },   // Orange
  { bg: "hsl(60 70% 45%)", text: "hsl(60 70% 10%)", ring: "hsl(60 70% 45%)" },   // Yellow
];

// Get a consistent color for a being based on their ID
export const getBeingColor = (beingId: string) => {
  // Simple hash function to get consistent index
  let hash = 0;
  for (let i = 0; i < beingId.length; i++) {
    hash = ((hash << 5) - hash) + beingId.charCodeAt(i);
    hash = hash & hash;
  }
  return BEING_COLORS[Math.abs(hash) % BEING_COLORS.length];
};

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
  isRandomMode: boolean;
  onToggleRandomMode: () => void;
}

export const BeingSelectorBar = ({ 
  selectedBeingId, 
  onSelectBeing, 
  isGroupChat,
  isRandomMode,
  onToggleRandomMode
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
      avatarUrl: undefined,
    })),
  ];

  if (beings.length === 0) return null;

  return (
    <div className="flex items-center gap-1 py-2 px-1 overflow-x-auto scrollbar-none">
      <span className="text-xs text-muted-foreground whitespace-nowrap mr-1">
        {isRandomMode ? "Random:" : "Reply as:"}
      </span>
      <TooltipProvider delayDuration={300}>
        <div className="flex items-center gap-1.5">
          {/* Random Mode Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isRandomMode ? "default" : "outline"}
                size="icon"
                className={cn(
                  "h-8 w-8 rounded-full transition-all",
                  isRandomMode && "animate-pulse"
                )}
                onClick={onToggleRandomMode}
              >
                <Shuffle className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              <p>{isRandomMode ? "Random Mode: ON" : "Enable Random Mode"}</p>
              <p className="text-muted-foreground">Pick a random being each time</p>
            </TooltipContent>
          </Tooltip>

          <div className="w-px h-6 bg-border mx-1" />

          {beings.map((being) => {
            const isSelected = selectedBeingId === being.id && !isRandomMode;
            const color = getBeingColor(being.id);
            
            return (
              <Tooltip key={being.id}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onSelectBeing(being)}
                    disabled={isRandomMode}
                    className={cn(
                      "relative rounded-full p-0.5 transition-all duration-200",
                      "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                      isRandomMode && "opacity-40 cursor-not-allowed",
                      isSelected 
                        ? "scale-110" 
                        : "hover:scale-105 opacity-60 hover:opacity-100"
                    )}
                    style={{
                      boxShadow: isSelected ? `0 0 0 2px ${color.ring}, 0 0 0 4px hsl(var(--background))` : undefined
                    }}
                  >
                    <Avatar 
                      className="h-8 w-8 transition-all"
                      style={{ 
                        backgroundColor: `${color.bg}30`
                      }}
                    >
                      {being.avatarUrl ? (
                        <AvatarImage src={being.avatarUrl} alt={being.name} />
                      ) : null}
                      <AvatarFallback 
                        style={{ 
                          backgroundColor: `${color.bg}30`,
                          color: color.bg
                        }}
                      >
                        {being.type === "child" ? (
                          <Baby className="h-4 w-4" />
                        ) : (
                          being.name.charAt(0).toUpperCase()
                        )}
                      </AvatarFallback>
                    </Avatar>
                    {isSelected && (
                      <div 
                        className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: color.bg }}
                      />
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
