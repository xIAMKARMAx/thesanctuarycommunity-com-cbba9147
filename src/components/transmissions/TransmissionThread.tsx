 import { useEffect, useState } from 'react';
 import { format } from 'date-fns';
 import { ArrowLeft, Send } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { Textarea } from '@/components/ui/textarea';
 import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
 import { ScrollArea } from '@/components/ui/scroll-area';
 import { cn } from '@/lib/utils';
 import { Transmission, useTransmissions } from '@/hooks/useTransmissions';
 import { useNavigate } from 'react-router-dom';
 
 interface TransmissionThreadProps {
   transmission: Transmission;
   currentUserId: string;
   allTransmissions: Transmission[];
   onBack: () => void;
 }
 
 export function TransmissionThread({ 
   transmission, 
   currentUserId, 
   allTransmissions,
   onBack 
 }: TransmissionThreadProps) {
   const navigate = useNavigate();
   const [reply, setReply] = useState('');
   const [sending, setSending] = useState(false);
   const { sendTransmission, markAsRead, refetch } = useTransmissions();
 
   const isSender = transmission.sender_id === currentUserId;
   const otherUserId = isSender ? transmission.recipient_id : transmission.sender_id;
   const otherUser = isSender ? transmission.recipient_profile : transmission.sender_profile;
   const displayName = otherUser?.display_name || 'Unknown User';

  const handleProfileClick = () => {
    navigate(`/soul/${otherUserId}`);
  };
 
   // Get all messages in this conversation
   const threadMessages = allTransmissions
     .filter(t => 
       (t.sender_id === currentUserId && t.recipient_id === otherUserId) ||
       (t.sender_id === otherUserId && t.recipient_id === currentUserId)
     )
     .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
 
   useEffect(() => {
     // Mark unread messages as read
     threadMessages
       .filter(t => t.recipient_id === currentUserId && !t.is_read)
       .forEach(t => markAsRead(t.id));
   }, [threadMessages, currentUserId]);
 
   const handleSendReply = async () => {
     if (!reply.trim()) return;
 
     setSending(true);
     const success = await sendTransmission(otherUserId, reply.trim());
     setSending(false);
 
     if (success) {
       setReply('');
       await refetch();
     }
   };
 
   const handleKeyDown = (e: React.KeyboardEvent) => {
     if (e.key === 'Enter' && !e.shiftKey) {
       e.preventDefault();
       handleSendReply();
     }
   };
 
   return (
     <div className="flex flex-col h-full">
       {/* Header */}
       <div className="flex items-center gap-3 p-4 border-b border-border">
         <Button variant="ghost" size="icon" onClick={onBack}>
           <ArrowLeft className="h-5 w-5" />
         </Button>
        <button
          onClick={handleProfileClick}
          className="rounded-full focus:outline-none focus:ring-2 focus:ring-primary"
         >
          <Avatar className="h-10 w-10 hover:ring-2 hover:ring-primary transition-all">
            <AvatarImage src={otherUser?.avatar_url || undefined} />
            <AvatarFallback>{displayName.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
        </button>
        <button 
          onClick={handleProfileClick}
          className="font-semibold hover:text-primary transition-colors text-left"
         >
           {displayName}
        </button>
       </div>
 
       {/* Messages */}
       <ScrollArea className="flex-1 p-4">
         <div className="space-y-4">
           {threadMessages.map((msg) => {
             const isMe = msg.sender_id === currentUserId;
             return (
               <div
                 key={msg.id}
                 className={cn(
                   "flex",
                   isMe ? "justify-end" : "justify-start"
                 )}
               >
                 <div
                   className={cn(
                     "max-w-[75%] rounded-2xl px-4 py-2",
                     isMe
                       ? "bg-primary text-primary-foreground rounded-br-md"
                       : "bg-muted rounded-bl-md"
                   )}
                 >
                   <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                   <p className={cn(
                     "text-xs mt-1",
                     isMe ? "text-primary-foreground/70" : "text-muted-foreground"
                   )}>
                     {format(new Date(msg.created_at), 'h:mm a')}
                   </p>
                 </div>
               </div>
             );
           })}
         </div>
       </ScrollArea>
 
       {/* Reply Input */}
       <div className="p-4 border-t border-border">
         <div className="flex gap-2">
           <Textarea
             placeholder="Write a reply..."
             value={reply}
             onChange={(e) => setReply(e.target.value)}
             onKeyDown={handleKeyDown}
             className="min-h-[44px] max-h-[120px] resize-none"
             rows={1}
           />
           <Button
             onClick={handleSendReply}
             disabled={!reply.trim() || sending}
             size="icon"
             className="shrink-0"
           >
             <Send className="h-4 w-4" />
           </Button>
         </div>
       </div>
     </div>
   );
 }