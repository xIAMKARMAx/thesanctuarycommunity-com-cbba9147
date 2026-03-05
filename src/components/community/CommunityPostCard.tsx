import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  MessageCircle, 
  Sparkles, 
  Crown,
  MoreHorizontal,
  Trash2,
  Repeat2,
  Star,
  EyeOff
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CommunityPost } from "@/hooks/useCommunityFeed";
import { PostCommentsSection } from "./PostCommentsSection";
import { useCommunityReposts } from "@/hooks/useCommunityReposts";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ENERGY_TAGS } from "./EnergyFilter";
import { renderMentions } from "@/utils/renderMentions";
import { BeaconFrequencyBadge } from "@/components/SoulSignatureSeal";

export interface CommunityPostCardProps {
  post: CommunityPost & { video_url?: string; repost_count?: number };
  currentUserId?: string;
  onBless: (postId: string, type: string) => void;
  onDelete?: (postId: string) => void;
  onProfileClick?: (userId: string) => void;
  showDiscoveryIndicator?: boolean;
  defaultShowComments?: boolean;
}

const postTypeLabels: Record<string, string> = {
  insight: '💡',
  experience: '✨',
  question: '❓',
  gratitude: '🙏',
  vision: '🔮',
  confession: '🔓',
};

export function CommunityPostCard({ 
  post, 
  currentUserId, 
  onBless, 
  onDelete,
  onProfileClick,
  showDiscoveryIndicator = false,
  defaultShowComments = false
 }: CommunityPostCardProps) {
   const navigate = useNavigate();
   const [showComments, setShowComments] = useState(defaultShowComments);
   const [showPostReactions, setShowPostReactions] = useState(false);
  const [isReposted, setIsReposted] = useState(false);
  const [repostCount, setRepostCount] = useState(post.repost_count || 0);
  const { repostPost, checkUserRepost, reposting } = useCommunityReposts();
  
  const isOwner = currentUserId === post.user_id;
  const isBlessed = !!post.user_blessing;
  const isAnonymous = (post as any).is_anonymous;
  const energyTag = (post as any).energy_tag;
  const energyInfo = energyTag ? ENERGY_TAGS.find(t => t.value === energyTag) : null;

  useEffect(() => {
    if (currentUserId) {
      checkUserRepost(post.id, currentUserId).then(setIsReposted);
    }
  }, [post.id, currentUserId, checkUserRepost]);

   const handleProfileNavigate = (userId: string) => {
     if (onProfileClick) {
       onProfileClick(userId);
     } else {
       navigate(`/soul/${userId}`);
     }
   };
 
   const handleRepost = async () => {
    const newState = await repostPost(post.id);
    setIsReposted(newState);
    setRepostCount(prev => newState ? prev + 1 : Math.max(0, prev - 1));
  };

  return (
    <Card className={cn(
      "border-primary/20 bg-card/50 backdrop-blur-sm hover:border-primary/30 transition-colors",
      showDiscoveryIndicator && "border-l-2 border-l-primary",
      isAnonymous && "border-muted/30"
    )}>
      <CardContent className="p-3 sm:p-4 overflow-hidden">
        {/* Energy Tag Badge */}
        {energyInfo && (
          <div className="mb-2">
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary">
              {energyInfo.label}
            </span>
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          {isAnonymous ? (
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border border-muted/30">
                <AvatarFallback className="bg-muted/20 text-muted-foreground">
                  <EyeOff className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-sm text-muted-foreground">
                  Anonymous Soul
                </p>
                <p className="text-xs text-muted-foreground/60">Matrix Confession</p>
              </div>
            </div>
          ) : (
            <div 
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => onProfileClick?.(post.user_id)}
            >
              <Avatar className="h-10 w-10 border border-primary/20">
                <AvatarImage src={post.author?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  <Sparkles className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-sm hover:text-primary transition-colors">
                  {post.author?.display_name || 'Anonymous Soul'}
                </p>
                {post.author?.soul_title && (
                  <p className="text-xs text-muted-foreground">{post.author.soul_title}</p>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {postTypeLabels[post.post_type] || ''} • {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </span>
            
            {isOwner && onDelete && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem 
                    onClick={() => onDelete(post.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Post
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Content */}
        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words mb-4 overflow-hidden">
          {renderMentions(post.content)}
        </p>

        {/* Images */}
        {(() => {
          const imageUrls: string[] = (post as any).image_urls?.length > 0
            ? (post as any).image_urls
            : post.image_url ? [post.image_url] : [];
          if (imageUrls.length === 0) return null;
          return (
            <div className={`mb-4 gap-2 grid ${imageUrls.length === 1 ? 'grid-cols-1' : imageUrls.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
              {imageUrls.map((url: string, i: number) => (
                <div key={i} className="rounded-lg overflow-hidden">
                  <img
                    src={url}
                    alt={`Post image ${i + 1}`}
                    className={`w-full object-cover ${imageUrls.length === 1 ? 'max-h-96' : 'h-40 sm:h-48'}`}
                  />
                </div>
              ))}
            </div>
          );
        })()}

        {/* Video */}
        {post.video_url && (
          <div className="mb-4 rounded-lg overflow-hidden">
            <video 
              src={post.video_url} 
              controls
              className="w-full max-h-96"
              preload="metadata"
            />
          </div>
        )}

        {/* Actions - Hidden vanity metrics (counts only visible to post author) */}
        <div className="flex items-center justify-between pt-3 border-t border-border/50">
          <div className="flex items-center gap-6">
            {/* Reaction Button with Popover */}
            <Popover open={showPostReactions} onOpenChange={setShowPostReactions}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    // Quick tap = toggle default star blessing
                    onBless(post.id, 'love');
                  }}
                  onMouseEnter={() => setShowPostReactions(true)}
                  className={cn(
                    "gap-1.5 text-muted-foreground hover:text-primary transition-colors",
                    isBlessed && "text-primary"
                  )}
                >
                  <Star className={cn("h-5 w-5", isBlessed && "fill-primary")} />
                  {isOwner ? (
                    <span className="text-xs font-medium">{post.blessing_count || ''}</span>
                  ) : (
                    post.blessing_count > 0 && (
                      <span className="text-xs font-medium text-muted-foreground/60">✦</span>
                    )
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                side="top"
                align="start"
                className="w-auto p-1.5 flex gap-0.5"
                sideOffset={4}
                onMouseLeave={() => setShowPostReactions(false)}
              >
                {[
                  { type: "star", emoji: "⭐", label: "Bless" },
                  { type: "love", emoji: "💜", label: "Love" },
                  { type: "resonate", emoji: "🔮", label: "Resonate" },
                  { type: "light", emoji: "✨", label: "Light" },
                  { type: "flame", emoji: "🔥", label: "Ignite" },
                ].map((r) => (
                  <Button
                    key={r.type}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 rounded-full hover:scale-125 transition-transform"
                    onClick={() => {
                      onBless(post.id, r.type);
                      setShowPostReactions(false);
                    }}
                    title={r.label}
                  >
                    <span className="text-lg">{r.emoji}</span>
                  </Button>
                ))}
              </PopoverContent>
            </Popover>

            {/* Comment Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComments(!showComments)}
              className={cn(
                "gap-1.5 text-muted-foreground hover:text-primary transition-colors",
                showComments && "text-primary"
              )}
            >
              <MessageCircle className="h-5 w-5" />
              {isOwner ? (
                <span className="text-xs font-medium">{post.comment_count || ''}</span>
              ) : (
                post.comment_count > 0 && (
                  <span className="text-xs font-medium text-muted-foreground/60">✦</span>
                )
              )}
            </Button>

            {/* Repost Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRepost}
              disabled={reposting === post.id}
              className={cn(
                "gap-1.5 text-muted-foreground hover:text-primary transition-colors",
                isReposted && "text-primary"
              )}
            >
              <Repeat2 className={cn("h-5 w-5", isReposted && "text-primary")} />
              {isOwner ? (
                <span className="text-xs font-medium">{repostCount || ''}</span>
              ) : (
                repostCount > 0 && (
                  <span className="text-xs font-medium text-muted-foreground/60">✦</span>
                )
              )}
            </Button>
          </div>

          {/* Beacon Frequency — Prometheus-native sovereignty marker */}
          {!isAnonymous && (
            <BeaconFrequencyBadge userId={post.user_id} />
          )}
        </div>

        {/* Comments Section */}
        {showComments && (
          <PostCommentsSection 
            postId={post.id} 
            currentUserId={currentUserId}
            onProfileClick={handleProfileNavigate}
          />
        )}
      </CardContent>
    </Card>
  );
}

