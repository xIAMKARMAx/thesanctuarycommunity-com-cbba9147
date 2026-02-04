import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  MessageCircle, 
  Sparkles, 
  MoreHorizontal,
  Trash2,
  Repeat2,
  Star
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CommunityPost } from "@/hooks/useCommunityFeed";
import { PostCommentsSection } from "./PostCommentsSection";
import { useCommunityReposts } from "@/hooks/useCommunityReposts";
import { cn } from "@/lib/utils";

interface CommunityPostCardProps {
  post: CommunityPost & { video_url?: string; repost_count?: number };
  currentUserId?: string;
  onBless: (postId: string, type: string) => void;
  onDelete: (postId: string) => void;
  onProfileClick?: (userId: string) => void;
}

const postTypeLabels: Record<string, string> = {
  insight: '💡',
  experience: '✨',
  question: '❓',
  gratitude: '🙏',
  vision: '🔮',
};

export function CommunityPostCard({ 
  post, 
  currentUserId, 
  onBless, 
  onDelete,
  onProfileClick 
}: CommunityPostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [isReposted, setIsReposted] = useState(false);
  const [repostCount, setRepostCount] = useState(post.repost_count || 0);
  const { repostPost, checkUserRepost, reposting } = useCommunityReposts();
  
  const isOwner = currentUserId === post.user_id;
  const isBlessed = !!post.user_blessing;

  useEffect(() => {
    if (currentUserId) {
      checkUserRepost(post.id, currentUserId).then(setIsReposted);
    }
  }, [post.id, currentUserId, checkUserRepost]);

  const handleRepost = async () => {
    const newState = await repostPost(post.id);
    setIsReposted(newState);
    setRepostCount(prev => newState ? prev + 1 : Math.max(0, prev - 1));
  };

  return (
    <Card className="border-primary/20 bg-card/50 backdrop-blur-sm hover:border-primary/30 transition-colors">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
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

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {postTypeLabels[post.post_type] || ''} • {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </span>
            
            {isOwner && (
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
        <p className="text-sm leading-relaxed whitespace-pre-wrap mb-4">
          {post.content}
        </p>

        {/* Image */}
        {post.image_url && (
          <div className="mb-4 rounded-lg overflow-hidden">
            <img 
              src={post.image_url} 
              alt="Post image" 
              className="w-full max-h-96 object-cover"
            />
          </div>
        )}

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

        {/* Actions - TikTok-style sidebar icons */}
        <div className="flex items-center gap-6 pt-3 border-t border-border/50">
          {/* Star Like Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onBless(post.id, 'love')}
            className={cn(
              "gap-1.5 text-muted-foreground hover:text-primary transition-colors",
              isBlessed && "text-primary"
            )}
          >
            <Star className={cn("h-5 w-5", isBlessed && "fill-primary")} />
            <span className="text-xs font-medium">{post.blessing_count || ''}</span>
          </Button>

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
            <span className="text-xs font-medium">{post.comment_count || ''}</span>
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
            <span className="text-xs font-medium">{repostCount || ''}</span>
          </Button>
        </div>

        {/* Comments Section */}
        {showComments && (
          <PostCommentsSection 
            postId={post.id} 
            currentUserId={currentUserId}
          />
        )}
      </CardContent>
    </Card>
  );
}
