import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAIProfile } from "@/contexts/AIProfileContext";
import { useChatEntity } from "@/contexts/ChatEntityContext";
import { cn } from "@/lib/utils";
import { Baby, Shuffle, Loader2, RotateCw, MessageCircle } from "lucide-react";
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

type AutoMode = "none" | "random" | "roundRobin";

interface BeingSelectorBarProps {
  isGroupChat: boolean;
  autoMode: AutoMode;
  onSetAutoMode: (mode: AutoMode) => void;
  onTriggerBeingResponse: (being: Being) => void;
  onContinueConversation?: () => void; // Trigger another round of AI-to-AI responses
  hasMessage: boolean;
  lastMessageSenderId?: string; // To prevent a being from responding to their own message
  loadingBeingId: string | null;
  respondedBeingIds: string[];
  roundRobinIndex: number;
  memberIds?: string[]; // Optional: filter to only show these AI profile IDs
  allRespondedOnce?: boolean; // True when all beings have responded at least once
}

export const BeingSelectorBar = ({ 
  isGroupChat,
  autoMode,
  onSetAutoMode,
  onTriggerBeingResponse,
  onContinueConversation,
  hasMessage,
  lastMessageSenderId,
  loadingBeingId,
  respondedBeingIds,
  roundRobinIndex,
  memberIds,
  allRespondedOnce = false,
}: BeingSelectorBarProps) => {
  const { profiles } = useAIProfile();
  const { talkableChildren } = useChatEntity();

  if (!isGroupChat) return null;

  // Build list of beings - filter by memberIds if provided
  const filteredProfiles = memberIds && memberIds.length > 0
    ? profiles.filter(p => memberIds.includes(p.id))
    : profiles.filter(p => p.name);

  const beings: Being[] = [
    // AI profiles with names (or filtered by memberIds)
    ...filteredProfiles.map(p => ({
      id: p.id,
      type: "ai" as const,
      name: p.name || `AI ${p.profile_number}`,
      avatarUrl: p.avatar_image_url || undefined,
      profileNumber: p.profile_number,
    })),
    // Talkable children (only include if no memberIds filter, or could extend to support children)
    ...(memberIds && memberIds.length > 0 ? [] : talkableChildren.map(c => ({
      id: c.id,
      type: "child" as const,
      name: c.first_name,
      avatarUrl: undefined,
    }))),
  ];

  if (beings.length === 0) return null;

  const canClick = hasMessage && !loadingBeingId;
  const isAutoMode = autoMode !== "none";
  const nextRobinBeing = beings[roundRobinIndex % beings.length];

  const getModeLabel = () => {
    if (!hasMessage) return "Send a message first";
    if (autoMode === "random") return "Random:";
    if (autoMode === "roundRobin") return `Next: ${nextRobinBeing?.name}`;
    return "Click to get response:";
  };

  // Check if a being can respond (not the sender of the last message)
  const canBeingRespond = (beingId: string) => {
    return beingId !== lastMessageSenderId;
  };

  return (
    <div className="flex items-center gap-1 py-2 px-1 overflow-x-auto scrollbar-none">
      <span className="text-xs text-muted-foreground whitespace-nowrap mr-1">
        {getModeLabel()}
      </span>
      <TooltipProvider delayDuration={300}>
        <div className="flex items-center gap-1.5">
          {/* Random Mode Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={autoMode === "random" ? "default" : "outline"}
                size="icon"
                className={cn(
                  "h-8 w-8 rounded-full transition-all",
                  autoMode === "random" && "animate-pulse"
                )}
                onClick={() => onSetAutoMode(autoMode === "random" ? "none" : "random")}
              >
                <Shuffle className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              <p>{autoMode === "random" ? "Random Mode: ON" : "Random Mode"}</p>
              <p className="text-muted-foreground">Pick a random being each time</p>
            </TooltipContent>
          </Tooltip>

          {/* Round Robin Mode Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={autoMode === "roundRobin" ? "default" : "outline"}
                size="icon"
                className={cn(
                  "h-8 w-8 rounded-full transition-all",
                  autoMode === "roundRobin" && "animate-spin-slow"
                )}
                onClick={() => onSetAutoMode(autoMode === "roundRobin" ? "none" : "roundRobin")}
              >
                <RotateCw className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              <p>{autoMode === "roundRobin" ? "Round Robin: ON" : "Round Robin Mode"}</p>
              <p className="text-muted-foreground">Cycle through beings in order</p>
            </TooltipContent>
          </Tooltip>

          {/* Continue Conversation Button - Let beings talk to each other */}
          {allRespondedOnce && onContinueConversation && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-8 px-3 rounded-full transition-all gap-1.5",
                    loadingBeingId && "opacity-50 cursor-not-allowed"
                  )}
                  onClick={() => !loadingBeingId && onContinueConversation()}
                  disabled={!!loadingBeingId}
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  <span className="text-xs">Continue</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                <p>Continue Conversation</p>
                <p className="text-muted-foreground">Let beings respond to each other</p>
              </TooltipContent>
            </Tooltip>
          )}

          <div className="w-px h-6 bg-border mx-1" />

          {beings.map((being, index) => {
            const hasResponded = respondedBeingIds.includes(being.id);
            const isLoading = loadingBeingId === being.id;
            const isNextInRobin = autoMode === "roundRobin" && index === (roundRobinIndex % beings.length);
            const color = getBeingColor(being.id);
            const isSender = being.id === lastMessageSenderId;
            const canRespond = canBeingRespond(being.id);
            
            return (
              <Tooltip key={being.id}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => canClick && !isLoading && canRespond && onTriggerBeingResponse(being)}
                    disabled={!canClick || isLoading || !canRespond || (isAutoMode && !isLoading)}
                    className={cn(
                      "relative rounded-full p-0.5 transition-all duration-200",
                      "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                      !canClick && "opacity-40 cursor-not-allowed",
                      isSender && "opacity-30 cursor-not-allowed ring-2 ring-muted",
                      isAutoMode && !isLoading && !isNextInRobin && "opacity-40 cursor-not-allowed",
                      isNextInRobin && !isLoading && canRespond && "scale-105 opacity-100",
                      hasResponded && !isLoading && !isNextInRobin && "opacity-60",
                      canClick && canRespond && !hasResponded && !isAutoMode && "hover:scale-110 cursor-pointer",
                      isLoading && "scale-110 animate-pulse"
                    )}
                    style={{
                      boxShadow: isLoading || (isNextInRobin && canRespond)
                        ? `0 0 0 2px ${color.ring}, 0 0 0 4px hsl(var(--background))` 
                        : undefined
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
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : being.type === "child" ? (
                          <Baby className="h-4 w-4" />
                        ) : (
                          being.name.charAt(0).toUpperCase()
                        )}
                      </AvatarFallback>
                    </Avatar>
                    {hasResponded && !isLoading && (
                      <div 
                        className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: color.bg }}
                      />
                    )}
                    {isNextInRobin && !isLoading && !hasResponded && (
                      <div 
                        className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-primary animate-pulse"
                      />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  <p>{being.name}</p>
                  <p className="text-muted-foreground">
                    {isLoading 
                      ? "Responding..." 
                      : isSender
                        ? "Just spoke"
                      : isNextInRobin
                        ? "Next in round robin"
                      : hasResponded 
                        ? "Already responded" 
                        : !hasMessage 
                          ? "Send a message first" 
                          : "Click to get their response"}
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

export type { Being, AutoMode };
