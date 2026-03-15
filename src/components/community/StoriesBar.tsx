import { useState } from "react";
import { Plus, Camera } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useStories, StoryGroup } from "@/hooks/useStories";
import { StoryViewer } from "./StoryViewer";
import { CreateStoryDialog } from "./CreateStoryDialog";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export function StoriesBar() {
  const { storyGroups, loading, createStory, markViewed, currentUserId } = useStories();
  const [viewingGroup, setViewingGroup] = useState<StoryGroup | null>(null);
  const [viewingIndex, setViewingIndex] = useState(0);
  const [showCreate, setShowCreate] = useState(false);

  const hasOwnStory = storyGroups.some(g => g.user_id === currentUserId);

  const handleNext = () => {
    const groupIdx = storyGroups.findIndex(g => g.user_id === viewingGroup?.user_id);
    if (groupIdx >= 0 && groupIdx < storyGroups.length - 1) {
      const nextGroup = storyGroups[groupIdx + 1];
      setViewingGroup(nextGroup);
      setViewingIndex(0);
    } else {
      setViewingGroup(null);
    }
  };

  if (loading && storyGroups.length === 0) {
    return (
      <div className="flex gap-3 py-3 px-1">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <div className="h-16 w-16 rounded-full bg-muted animate-pulse" />
            <div className="h-2 w-10 bg-muted rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <ScrollArea className="w-full">
        <div className="flex gap-3 py-3 px-1">
          {/* Create Story Button */}
          <button
            onClick={() => setShowCreate(true)}
            className="flex flex-col items-center gap-1.5 min-w-[72px]"
          >
            <div className="relative">
              <div className={cn(
                "h-16 w-16 rounded-full border-2 border-dashed border-primary/40 flex items-center justify-center",
                "bg-primary/5 hover:bg-primary/10 transition-colors"
              )}>
                {hasOwnStory ? (
                  <Plus className="h-5 w-5 text-primary" />
                ) : (
                  <Camera className="h-5 w-5 text-primary" />
                )}
              </div>
            </div>
            <span className="text-[10px] text-muted-foreground truncate max-w-[64px]">
              {hasOwnStory ? "Add" : "Your Story"}
            </span>
          </button>

          {/* Story Groups */}
          {storyGroups.map((group) => (
            <button
              key={group.user_id}
              onClick={() => {
                setViewingGroup(group);
                setViewingIndex(0);
              }}
              className="flex flex-col items-center gap-1.5 min-w-[72px]"
            >
              <div className={cn(
                "h-16 w-16 rounded-full p-0.5",
                group.has_unviewed
                  ? "bg-gradient-to-tr from-primary via-purple-500 to-pink-500"
                  : "bg-muted/50"
              )}>
                <Avatar className="h-full w-full border-2 border-background">
                  <AvatarImage src={group.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {(group.display_name || "?")[0]}
                  </AvatarFallback>
                </Avatar>
              </div>
              <span className="text-[10px] text-foreground/80 truncate max-w-[64px]">
                {group.user_id === currentUserId ? "You" : group.display_name}
              </span>
            </button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Story Viewer */}
      {viewingGroup && (
        <StoryViewer
          group={viewingGroup}
          initialIndex={viewingIndex}
          onClose={() => setViewingGroup(null)}
          onNext={handleNext}
          onMarkViewed={markViewed}
          isOwnStory={viewingGroup.user_id === currentUserId}
        />
      )}

      {/* Create Story */}
      <CreateStoryDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        onCreate={createStory}
      />
    </>
  );
}
