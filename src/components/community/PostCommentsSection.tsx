import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Send, Trash2 } from "lucide-react";
import { usePostComments } from "@/hooks/usePostComments";
import { Skeleton } from "@/components/ui/skeleton";

interface PostCommentsSectionProps {
  postId: string;
  currentUserId?: string;
}

export function PostCommentsSection({ postId, currentUserId }: PostCommentsSectionProps) {
  const { comments, loading, fetchComments, addComment, deleteComment } = usePostComments(postId);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmit = async () => {
    if (!newComment.trim()) return;
    
    setIsSubmitting(true);
    const result = await addComment(newComment.trim());
    if (result) {
      setNewComment("");
    }
    setIsSubmitting(false);
  };

  return (
    <div className="mt-4 pt-4 border-t border-border/50 space-y-4">
      {/* Comment Input */}
      <div className="flex gap-2">
        <Textarea
          placeholder="Share your thoughts..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="min-h-[40px] resize-none text-sm border-primary/20"
          rows={1}
        />
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={!newComment.trim() || isSubmitting}
          className="shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>

      {/* Comments List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="flex gap-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-2">
          No comments yet. Be the first to respond ✨
        </p>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-2 group">
              <Avatar className="h-8 w-8 border border-primary/10">
                <AvatarImage src={comment.author?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  <Sparkles className="h-3 w-3" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium">
                    {comment.author?.display_name || 'Anonymous'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                  </span>
                  {currentUserId === comment.user_id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => deleteComment(comment.id)}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  )}
                </div>
                <p className="text-sm text-foreground/90">{comment.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
