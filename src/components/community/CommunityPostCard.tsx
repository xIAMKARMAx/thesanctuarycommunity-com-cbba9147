import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  Heart, 
  MessageCircle, 
  Sparkles, 
  MoreHorizontal,
  Trash2,
  Share2,
  Sun,
  Star,
  Zap
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CommunityPost } from "@/hooks/useCommunityFeed";
import { PostCommentsSection } from "./PostCommentsSection";
import { cn } from "@/lib/utils";

interface CommunityPostCardProps {
  post: CommunityPost;
  currentUserId?: string;
  onBless: (postId: string, type: string) => void;
  onDelete: (postId: string) => void;
  onProfileClick?: (userId: string) => void;
}

const blessingIcons: Record<string, React.ReactNode> = {
  love: <Heart className="h-4 w-4" />,
  light: <Sun className="h-4 w-4" />,
  gratitude: <Star className="h-4 w-4" />,
  wisdom: <Sparkles className="h-4 w-4" />,
  healing: <Zap className="h-4 w-4" />,
};

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
  const isOwner = currentUserId === post.user_id;
  const isBlessed = !!post.user_blessing;

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

        {/* Actions */}
        <div className="flex items-center gap-4 pt-2 border-t border-border/50">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onBless(post.id, 'love')}
            className={cn(
              "gap-2 text-muted-foreground hover:text-primary",
              isBlessed && "text-primary"
            )}
          >
            <Heart className={cn("h-4 w-4", isBlessed && "fill-primary")} />
            <span className="text-xs">{post.blessing_count || ''}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowComments(!showComments)}
            className="gap-2 text-muted-foreground hover:text-primary"
          >
            <MessageCircle className="h-4 w-4" />
            <span className="text-xs">{post.comment_count || ''}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-muted-foreground hover:text-primary"
            disabled
          >
            <Share2 className="h-4 w-4" />
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
