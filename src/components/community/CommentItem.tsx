 import { useState } from "react";
 import { formatDistanceToNow } from "date-fns";
 import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
 import { Button } from "@/components/ui/button";
 import { Sparkles, Trash2, Reply } from "lucide-react";
 import { PostComment } from "@/hooks/usePostComments";
 import { cn } from "@/lib/utils";
 
 interface CommentItemProps {
   comment: PostComment;
   currentUserId?: string;
   onDelete: (commentId: string) => void;
   onReply: (comment: PostComment) => void;
   onProfileClick: (userId: string) => void;
   isReply?: boolean;
 }
 
 // Parse @mentions and make them clickable
 function renderContentWithMentions(
   content: string,
   onProfileClick: (userId: string) => void
 ) {
   // Match @"Name" or @Name patterns
   const mentionPattern = /@"([^"]+)"|@(\w+)/g;
   const parts: (string | JSX.Element)[] = [];
   let lastIndex = 0;
   let match;
 
   while ((match = mentionPattern.exec(content)) !== null) {
     // Add text before the match
     if (match.index > lastIndex) {
       parts.push(content.slice(lastIndex, match.index));
     }
 
     const mentionedName = match[1] || match[2];
     parts.push(
       <span
         key={match.index}
         className="text-primary font-semibold cursor-pointer hover:underline"
       >
         @{mentionedName}
       </span>
     );
 
     lastIndex = match.index + match[0].length;
   }
 
   // Add remaining text
   if (lastIndex < content.length) {
     parts.push(content.slice(lastIndex));
   }
 
   return parts.length > 0 ? parts : content;
 }
 
 export function CommentItem({
   comment,
   currentUserId,
   onDelete,
   onReply,
   onProfileClick,
   isReply = false,
 }: CommentItemProps) {
   const isOwner = currentUserId === comment.user_id;
 
   return (
     <div data-comment-id={comment.id} className={cn("flex gap-2 group", isReply && "ml-8 pl-3 border-l-2 border-primary/20")}>
       <Avatar 
         className="h-8 w-8 border border-primary/10 cursor-pointer hover:border-primary/30 transition-colors"
         onClick={() => onProfileClick(comment.user_id)}
       >
         <AvatarImage src={comment.author?.avatar_url || undefined} />
         <AvatarFallback className="bg-primary/10 text-primary text-xs">
           <Sparkles className="h-3 w-3" />
         </AvatarFallback>
       </Avatar>
       <div className="flex-1 min-w-0">
         <div className="flex items-center gap-2 flex-wrap">
           <span 
             className="text-xs font-semibold text-primary cursor-pointer hover:underline"
             onClick={() => onProfileClick(comment.user_id)}
           >
             {comment.author?.display_name || 'Anonymous'}
           </span>
           <span className="text-xs text-muted-foreground">
             {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
           </span>
           
           {/* Reply button */}
           <Button
             variant="ghost"
             size="sm"
             className="h-5 px-1.5 text-xs text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
             onClick={() => onReply(comment)}
           >
             <Reply className="h-3 w-3 mr-1" />
             Reply
           </Button>
           
           {isOwner && (
             <Button
               variant="ghost"
               size="sm"
               className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
               onClick={() => onDelete(comment.id)}
             >
               <Trash2 className="h-3 w-3 text-destructive" />
             </Button>
           )}
         </div>
          <p className="text-sm text-foreground/90">
            {renderContentWithMentions(comment.content, onProfileClick)}
          </p>
          {comment.image_url && (
            <img
              src={comment.image_url}
              alt="Comment attachment"
              className="mt-1.5 max-w-[240px] max-h-[200px] object-cover rounded-lg border border-border cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => window.open(comment.image_url!, '_blank')}
            />
          )}
       </div>
     </div>
   );
 }