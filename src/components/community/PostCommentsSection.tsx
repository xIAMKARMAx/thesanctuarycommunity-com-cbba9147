 import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Send, X } from "lucide-react";
import { usePostComments, PostComment } from "@/hooks/usePostComments";
import { CommentItem } from "./CommentItem";
import { Skeleton } from "@/components/ui/skeleton";
import { MentionTextarea, MentionTextareaRef } from "./MentionTextarea";

interface PostCommentsSectionProps {
  postId: string;
  currentUserId?: string;
   onProfileClick?: (userId: string) => void;
}

 export function PostCommentsSection({ postId, currentUserId, onProfileClick }: PostCommentsSectionProps) {
  const { comments, loading, fetchComments, addComment, deleteComment } = usePostComments(postId);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<PostComment | null>(null);
  const textareaRef = useRef<MentionTextareaRef>(null);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

   const handleReply = (comment: PostComment) => {
     setReplyingTo(comment);
     const displayName = comment.author?.display_name || 'Anonymous';
     // Use quotes if name has spaces
     const mention = displayName.includes(' ') ? `@"${displayName}" ` : `@${displayName} `;
     setNewComment(mention);
     // Focus the textarea
     setTimeout(() => {
       textareaRef?.current?.focus();
       // Move cursor to end
       const len = mention.length;
       textareaRef?.current?.setSelectionRange(len, len);
     }, 50);
   };
 
   const cancelReply = () => {
     setReplyingTo(null);
     setNewComment("");
   };
 
   const handleProfileNavigate = (userId: string) => {
     if (onProfileClick) {
       onProfileClick(userId);
     } else {
       // Fallback: navigate directly
       window.location.href = `/soul/${userId}`;
     }
   };
 
  const handleSubmit = async () => {
    if (!newComment.trim()) return;
    
    setIsSubmitting(true);
     const result = await addComment(newComment.trim(), replyingTo?.id);
    if (result) {
      setNewComment("");
       setReplyingTo(null);
    }
    setIsSubmitting(false);
  };

   // Organize comments into threads (top-level + replies)
   const topLevelComments = comments.filter(c => !c.parent_comment_id);
   const repliesByParent = comments.reduce((acc, comment) => {
     if (comment.parent_comment_id) {
       if (!acc[comment.parent_comment_id]) {
         acc[comment.parent_comment_id] = [];
       }
       acc[comment.parent_comment_id].push(comment);
     }
     return acc;
   }, {} as Record<string, PostComment[]>);
 
  return (
    <div className="mt-4 pt-4 border-t border-border/50 space-y-4">
       {/* Reply indicator */}
       {replyingTo && (
         <div className="flex items-center gap-2 text-xs text-muted-foreground bg-primary/5 px-3 py-2 rounded-lg">
           <span>Replying to</span>
           <span className="text-primary font-semibold">
             @{replyingTo.author?.display_name || 'Anonymous'}
           </span>
           <Button
             variant="ghost"
             size="sm"
             className="h-5 w-5 p-0 ml-auto"
             onClick={cancelReply}
           >
             <X className="h-3 w-3" />
           </Button>
         </div>
       )}
 
      {/* Comment Input */}
       <div className="flex gap-2">
        <MentionTextarea
            ref={textareaRef}
            placeholder={replyingTo ? `Reply to @${replyingTo.author?.display_name || 'Anonymous'}...` : "Share your thoughts... (use @ to mention someone)"}
           value={newComment}
           onChange={(val) => setNewComment(val)}
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
           {topLevelComments.map((comment) => (
             <div key={comment.id} className="space-y-2">
               <CommentItem
                 comment={comment}
                 currentUserId={currentUserId}
                 onDelete={deleteComment}
                 onReply={handleReply}
                 onProfileClick={handleProfileNavigate}
               />
               {/* Replies to this comment */}
               {repliesByParent[comment.id]?.map((reply) => (
                 <CommentItem
                   key={reply.id}
                   comment={reply}
                   currentUserId={currentUserId}
                   onDelete={deleteComment}
                   onReply={handleReply}
                   onProfileClick={handleProfileNavigate}
                   isReply
                 />
               ))}
             </div>
          ))}
        </div>
      )}
    </div>
  );
}
