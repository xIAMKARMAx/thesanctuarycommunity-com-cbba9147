import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Send, X, ImagePlus, Loader2 } from "lucide-react";
import { usePostComments, PostComment } from "@/hooks/usePostComments";
import { CommentItem } from "./CommentItem";
import { Skeleton } from "@/components/ui/skeleton";
import { MentionTextarea, MentionTextareaRef } from "./MentionTextarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PostCommentsSectionProps {
  postId: string;
  currentUserId?: string;
  onProfileClick?: (userId: string) => void;
}

export function PostCommentsSection({ postId, currentUserId, onProfileClick }: PostCommentsSectionProps) {
  const { comments, loading, fetchComments, addComment, deleteComment, reactToComment } = usePostComments(postId);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<PostComment | null>(null);
  const [commentImage, setCommentImage] = useState<File | null>(null);
  const [commentImagePreview, setCommentImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const textareaRef = useRef<MentionTextareaRef>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleReply = (comment: PostComment) => {
    setReplyingTo(comment);
    const displayName = comment.author?.display_name || 'Anonymous';
    const mention = displayName.includes(' ') ? `@"${displayName}" ` : `@${displayName} `;
    setNewComment(mention);
    setTimeout(() => {
      textareaRef?.current?.focus();
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
      window.location.href = `/soul/${userId}`;
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please select an image under 5MB", variant: "destructive" });
      return;
    }

    setCommentImage(file);
    const reader = new FileReader();
    reader.onloadend = () => setCommentImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setCommentImage(null);
    setCommentImagePreview(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const ext = file.name.split('.').pop();
    const fileName = `comment-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const filePath = `comments/${currentUserId}/${fileName}`;

    const { error } = await supabase.storage
      .from('community-media')
      .upload(filePath, file);

    if (error) {
      console.error('Upload error:', error);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('community-media')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSubmit = async () => {
    if (!newComment.trim() && !commentImage) return;

    setIsSubmitting(true);
    let imageUrl: string | undefined;

    if (commentImage) {
      setUploadingImage(true);
      const url = await uploadImage(commentImage);
      setUploadingImage(false);
      if (url) {
        imageUrl = url;
      } else {
        toast({ title: "Upload failed", description: "Could not upload image", variant: "destructive" });
        setIsSubmitting(false);
        return;
      }
    }

    const result = await addComment(newComment.trim(), replyingTo?.id, imageUrl);
    if (result) {
      setNewComment("");
      setReplyingTo(null);
      removeImage();
    }
    setIsSubmitting(false);
  };

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
          <span>Whispering to</span>
          <span className="text-primary font-semibold">
            @{replyingTo.author?.display_name || 'Flame'}
          </span>
          <Button variant="ghost" size="sm" className="h-5 w-5 p-0 ml-auto" onClick={cancelReply}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Image preview */}
      {commentImagePreview && (
        <div className="relative inline-block">
          <img
            src={commentImagePreview}
            alt="Comment attachment"
            className="h-20 w-20 object-cover rounded-lg border border-border"
          />
          <Button
            variant="destructive"
            size="sm"
            className="absolute -top-2 -right-2 h-5 w-5 p-0 rounded-full"
            onClick={removeImage}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Comment Input */}
      <div className="flex gap-2 items-end">
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageSelect}
        />
        <Button
          variant="ghost"
          size="sm"
          className="shrink-0 h-9 w-9 p-0"
          onClick={() => imageInputRef.current?.click()}
          disabled={isSubmitting}
          title="Add photo"
        >
          <ImagePlus className="h-4 w-4 text-muted-foreground" />
        </Button>
        <MentionTextarea
          ref={textareaRef}
          placeholder={replyingTo ? `Whisper back to @${replyingTo.author?.display_name || 'Flame'}...` : "Whisper to this Spark... (use @ to call a Flame)"}
          value={newComment}
          onChange={(val) => setNewComment(val)}
          className="min-h-[40px] resize-none text-sm border-primary/20"
          rows={1}
        />
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={(!newComment.trim() && !commentImage) || isSubmitting}
          className="shrink-0"
        >
          {uploadingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
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
          No whispers yet. Be the first to whisper 🔥
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
                onReact={reactToComment}
              />
              {repliesByParent[comment.id]?.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  currentUserId={currentUserId}
                  onDelete={deleteComment}
                  onReply={handleReply}
                  onProfileClick={handleProfileNavigate}
                  onReact={reactToComment}
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
