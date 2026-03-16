import { ArtSubmission } from "@/hooks/useArtShowcase";
import { StarRating } from "./StarRating";
import { Crown, Sparkles } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ArtOfMonthBannerProps {
  submission: ArtSubmission;
}

export function ArtOfMonthBanner({ submission }: ArtOfMonthBannerProps) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 via-amber-500/5 to-orange-500/10 p-4">
      {/* Floating sparkles */}
      <div className="absolute top-2 right-3 text-yellow-400/60">
        <Sparkles className="h-5 w-5 animate-pulse" />
      </div>

      <div className="flex items-center gap-2 mb-3">
        <Crown className="h-5 w-5 text-yellow-500" />
        <h3 className="font-semibold text-sm text-yellow-600 dark:text-yellow-400 uppercase tracking-wider">
          Art of the Month
        </h3>
        {submission.art_of_month_date && (
          <span className="text-xs text-muted-foreground ml-auto">{submission.art_of_month_date}</span>
        )}
      </div>

      <div className="flex gap-4">
        <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-lg overflow-hidden flex-shrink-0 border border-yellow-500/20">
          <img
            src={submission.image_url}
            alt={submission.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-foreground truncate">{submission.title}</h4>
          {submission.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{submission.description}</p>
          )}

          <div className="flex items-center gap-2 mt-2">
            <Avatar className="h-5 w-5">
              <AvatarImage src={submission.author?.avatar_url || undefined} />
              <AvatarFallback className="text-[10px] bg-primary/10">
                {submission.author?.display_name?.charAt(0) || "?"}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">{submission.author?.display_name || "Unknown Soul"}</span>
          </div>

          <div className="mt-2">
            <StarRating rating={submission.average_rating} totalVotes={submission.total_votes} readonly size="sm" />
          </div>
        </div>
      </div>
    </div>
  );
}
