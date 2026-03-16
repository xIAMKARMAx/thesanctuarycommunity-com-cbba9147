import { useState } from "react";
import { ArtSubmission } from "@/hooks/useArtShowcase";
import { StarRating } from "./StarRating";
import { ArtCommentsSection } from "./ArtCommentsSection";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MessageCircle, Trash2, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ArtCardProps {
  submission: ArtSubmission;
  currentUserId?: string;
  onVote: (submissionId: string, rating: number) => void;
  onDelete: (submissionId: string) => void;
  onProfileClick?: (userId: string) => void;
}

export function ArtCard({ submission, currentUserId, onVote, onDelete, onProfileClick }: ArtCardProps) {
  const [showComments, setShowComments] = useState(false);
  const isOwner = currentUserId === submission.user_id;

  return (
    <div className={cn(
      "rounded-xl border border-border/60 bg-card/80 overflow-hidden transition-all hover:shadow-md",
      submission.is_art_of_month && "ring-1 ring-yellow-500/30"
    )}>
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={submission.image_url}
          alt={submission.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {submission.is_art_of_month && (
          <div className="absolute top-2 left-2 bg-yellow-500/90 text-white text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
            <Crown className="h-3 w-3" />
            Art of the Month
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 space-y-2">
        <h3 className="font-semibold text-sm text-foreground truncate">{submission.title}</h3>
        {submission.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{submission.description}</p>
        )}

        {/* Author */}
        <button
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          onClick={() => submission.user_id && onProfileClick?.(submission.user_id)}
        >
          <Avatar className="h-5 w-5">
            <AvatarImage src={submission.author?.avatar_url || undefined} />
            <AvatarFallback className="text-[10px] bg-primary/10">
              {submission.author?.display_name?.charAt(0) || "?"}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs text-muted-foreground">{submission.author?.display_name || "Unknown Soul"}</span>
        </button>

        {/* Star Rating */}
        <StarRating
          rating={submission.average_rating}
          userVote={submission.user_vote}
          totalVotes={submission.total_votes}
          onRate={(r) => onVote(submission.id, r)}
          size="md"
        />

        {/* Actions */}
        <div className="flex items-center justify-between pt-1">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs h-7"
            onClick={() => setShowComments(!showComments)}
          >
            <MessageCircle className="h-3.5 w-3.5" />
            {submission.comment_count > 0 ? submission.comment_count : "Comment"}
          </Button>

          {isOwner && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-destructive hover:text-destructive"
              onClick={() => onDelete(submission.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        {/* Comments */}
        {showComments && (
          <ArtCommentsSection submissionId={submission.id} currentUserId={currentUserId} />
        )}
      </div>
    </div>
  );
}
