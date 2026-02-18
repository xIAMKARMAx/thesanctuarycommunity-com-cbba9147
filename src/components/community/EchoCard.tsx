import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Trash2, MessageCircle, Send, Image as ImageIcon } from "lucide-react";
import { ProfileEcho, EchoComment, useProfileEchoes } from "@/hooks/useProfileEchoes";
import { MentionTextarea, MentionTextareaRef } from "./MentionTextarea";
import { useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface EchoCardProps {
  echo: ProfileEcho;
  currentUserId?: string;
  profileUserId: string;
  onDelete: (echoId: string) => void;
  onProfileClick: (userId: string) => void;
}

// Render @mentions as highlighted text
function renderWithMentions(content: string) {
  const mentionPattern = /@"([^"]+)"|@(\w+)/g;
  const parts: (string | JSX.Element)[] = [];
  let lastIndex = 0;
  let match;

  while ((match = mentionPattern.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }
    const name = match[1] || match[2];
    parts.push(
      <span key={match.index} className="text-primary font-semibold">
        @{name}
      </span>
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < content.length) parts.push(content.slice(lastIndex));
  return parts.length > 0 ? parts : content;
}

export function EchoCard({ echo, currentUserId, profileUserId, onDelete, onProfileClick }: EchoCardProps) {
  const [comments, setComments] = useState<EchoComment[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [commentImageUrl, setCommentImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const textareaRef = useRef<MentionTextareaRef>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { fetchEchoComments, addEchoComment, deleteEchoComment } = useProfileEchoes(profileUserId);

  const canDelete = currentUserId === echo.author_user_id || currentUserId === profileUserId;

  const loadComments = async () => {
    const data = await fetchEchoComments(echo.id);
    setComments(data);
  };

  useEffect(() => {
    if (showComments) loadComments();
  }, [showComments]);

  const handleSubmitComment = async () => {
    if (!newComment.trim() && !commentImageUrl) return;
    setSubmitting(true);
    const result = await addEchoComment(echo.id, newComment.trim(), commentImageUrl || undefined);
    if (result) {
      setNewComment("");
      setCommentImageUrl(null);
      loadComments();
    }
    setSubmitting(false);
  };

  const handleDeleteComment = async (commentId: string) => {
    await deleteEchoComment(commentId);
    setComments(prev => prev.filter(c => c.id !== commentId));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return;
    
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `echo-comments/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('community-media').upload(path, file);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('community-media').getPublicUrl(path);
      setCommentImageUrl(urlData.publicUrl);
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="border-border/50">
      <CardContent className="p-4">
        {/* Echo header */}
        <div className="flex items-start gap-3">
          <Avatar
            className="h-9 w-9 cursor-pointer border border-primary/10 hover:border-primary/30 transition-colors"
            onClick={() => onProfileClick(echo.author_user_id)}
          >
            <AvatarImage src={echo.author?.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              <Sparkles className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="text-sm font-semibold text-primary cursor-pointer hover:underline"
                onClick={() => onProfileClick(echo.author_user_id)}
              >
                {echo.author?.display_name || "Anonymous"}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(echo.created_at), { addSuffix: true })}
              </span>
            </div>
            <p className="text-sm text-foreground/90 mt-1 whitespace-pre-wrap">
              {renderWithMentions(echo.content)}
            </p>
            {echo.image_url && (
              <img
                src={echo.image_url}
                alt="Echo image"
                className="mt-2 rounded-lg max-h-64 object-cover"
              />
            )}
          </div>
          {canDelete && (
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onDelete(echo.id)}>
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </Button>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 mt-3 ml-12">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-muted-foreground hover:text-primary gap-1"
            onClick={() => setShowComments(!showComments)}
          >
            <MessageCircle className="h-3.5 w-3.5" />
            {comments.length > 0 ? comments.length : "Reply"}
          </Button>
        </div>

        {/* Comments section */}
        {showComments && (
          <div className="mt-3 ml-12 space-y-3 border-t border-border/30 pt-3">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-2 group">
                <Avatar
                  className="h-7 w-7 cursor-pointer border border-primary/10"
                  onClick={() => onProfileClick(comment.user_id)}
                >
                  <AvatarImage src={comment.author?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
                    <Sparkles className="h-3 w-3" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs font-semibold text-primary cursor-pointer hover:underline"
                      onClick={() => onProfileClick(comment.user_id)}
                    >
                      {comment.author?.display_name || "Anonymous"}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                    </span>
                    {currentUserId === comment.user_id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100"
                        onClick={() => handleDeleteComment(comment.id)}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-foreground/90">{renderWithMentions(comment.content)}</p>
                  {comment.image_url && (
                    <img src={comment.image_url} alt="" className="mt-1 rounded max-h-40 object-cover" />
                  )}
                </div>
              </div>
            ))}

            {/* New comment */}
            <div className="flex gap-2">
              <div className="flex-1 space-y-2">
                {commentImageUrl && (
                  <div className="relative inline-block">
                    <img src={commentImageUrl} alt="" className="h-16 rounded object-cover" />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute -top-1 -right-1 h-5 w-5 p-0 bg-destructive/80 hover:bg-destructive rounded-full"
                      onClick={() => setCommentImageUrl(null)}
                    >
                      <Trash2 className="h-3 w-3 text-destructive-foreground" />
                    </Button>
                  </div>
                )}
                <MentionTextarea
                  ref={textareaRef}
                  value={newComment}
                  onChange={setNewComment}
                  placeholder="Reply... (use @ to tag)"
                  className="min-h-[32px] text-xs resize-none border-primary/20"
                  rows={1}
                />
              </div>
              <div className="flex flex-col gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  <ImageIcon className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={handleSubmitComment}
                  disabled={(!newComment.trim() && !commentImageUrl) || submitting}
                >
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
