import { useState } from "react";
import { useArtComments } from "@/hooks/useArtShowcase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Send, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ArtCommentsSectionProps {
  submissionId: string;
  currentUserId?: string;
}

export function ArtCommentsSection({ submissionId, currentUserId }: ArtCommentsSectionProps) {
  const { comments, loading, addComment, deleteComment } = useArtComments(submissionId);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!text.trim()) return;
    setSending(true);
    await addComment(text.trim());
    setText("");
    setSending(false);
  };

  return (
    <div className="border-t border-border/40 pt-2 mt-2 space-y-2">
      {loading ? (
        <div className="flex justify-center py-2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-2 group">
              <Avatar className="h-5 w-5 flex-shrink-0 mt-0.5">
                <AvatarImage src={c.author?.avatar_url || undefined} />
                <AvatarFallback className="text-[9px] bg-primary/10">
                  {c.author?.display_name?.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium text-foreground">{c.author?.display_name || "Soul"}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                  </span>
                  {currentUserId === c.user_id && (
                    <button
                      onClick={() => deleteComment(c.id)}
                      className="opacity-0 group-hover:opacity-100 ml-auto transition-opacity"
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </button>
                  )}
                </div>
                <p className="text-xs text-foreground/80">{c.content}</p>
              </div>
            </div>
          ))}
          {comments.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-1">No comments yet</p>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a comment..."
          className="h-8 text-xs"
          maxLength={500}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <Button size="sm" className="h-8 px-2" onClick={handleSend} disabled={sending || !text.trim()}>
          {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
        </Button>
      </div>
    </div>
  );
}
