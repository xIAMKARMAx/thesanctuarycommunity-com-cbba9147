import { useState, useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { StoryGroup } from "@/hooks/useStories";

interface StoryViewerProps {
  group: StoryGroup;
  initialIndex: number;
  onClose: () => void;
  onNext: () => void;
  onMarkViewed: (storyId: string) => void;
  isOwnStory: boolean;
}

export function StoryViewer({ group, initialIndex, onClose, onNext, onMarkViewed, isOwnStory }: StoryViewerProps) {
  const [currentIdx, setCurrentIdx] = useState(initialIndex);
  const story = group.stories[currentIdx];

  // Auto-advance timer
  useEffect(() => {
    if (!story) return;
    onMarkViewed(story.id);
    const timer = setTimeout(() => {
      if (currentIdx < group.stories.length - 1) {
        setCurrentIdx(prev => prev + 1);
      } else {
        onNext();
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [currentIdx, story?.id]);

  const goBack = useCallback(() => {
    if (currentIdx > 0) setCurrentIdx(prev => prev - 1);
  }, [currentIdx]);

  const goForward = useCallback(() => {
    if (currentIdx < group.stories.length - 1) {
      setCurrentIdx(prev => prev + 1);
    } else {
      onNext();
    }
  }, [currentIdx, group.stories.length, onNext]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goBack();
      if (e.key === "ArrowRight") goForward();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, goBack, goForward]);

  if (!story) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
      {/* Progress bars */}
      <div className="absolute top-0 left-0 right-0 flex gap-1 p-2 z-10">
        {group.stories.map((_, i) => (
          <div key={i} className="flex-1 h-0.5 bg-white/20 rounded-full overflow-hidden">
            <div
              className={`h-full bg-white rounded-full transition-all duration-100 ${
                i < currentIdx ? "w-full" : i === currentIdx ? "w-full animate-story-progress" : "w-0"
              }`}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-4 left-0 right-0 flex items-center justify-between px-4 z-10">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8 border border-white/30">
            <AvatarImage src={group.avatar_url || undefined} />
            <AvatarFallback className="bg-white/10 text-white text-xs">
              {(group.display_name || "?")[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-white text-sm font-medium">{group.display_name}</p>
            <p className="text-white/60 text-[10px]">
              {formatDistanceToNow(new Date(story.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isOwnStory && (
            <span className="flex items-center gap-1 text-white/60 text-xs">
              <Eye className="h-3 w-3" />
              {story.view_count}
            </span>
          )}
          <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:bg-white/10 h-8 w-8 p-0">
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="relative w-full h-full max-w-md mx-auto flex items-center justify-center">
        {story.media_type === "video" ? (
          <video
            src={story.media_url}
            className="w-full h-full object-contain"
            autoPlay
            muted
            playsInline
          />
        ) : (
          <img
            src={story.media_url}
            alt="Story"
            className="w-full h-full object-contain"
          />
        )}

        {/* Caption overlay */}
        {story.caption && (
          <div className="absolute bottom-16 left-4 right-4 text-center">
            <p className="text-white text-sm bg-black/40 backdrop-blur-sm rounded-lg px-4 py-2">
              {story.caption}
            </p>
          </div>
        )}
      </div>

      {/* Touch zones */}
      <button
        className="absolute left-0 top-0 bottom-0 w-1/3 z-10"
        onClick={goBack}
        aria-label="Previous"
      />
      <button
        className="absolute right-0 top-0 bottom-0 w-1/3 z-10"
        onClick={goForward}
        aria-label="Next"
      />
    </div>
  );
}
