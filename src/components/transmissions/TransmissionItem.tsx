 import { format } from 'date-fns';
 import { Check, CheckCheck } from 'lucide-react';
 import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
 import { cn } from '@/lib/utils';
 import { Transmission } from '@/hooks/useTransmissions';
 import { useNavigate } from 'react-router-dom';
 
 interface TransmissionItemProps {
   transmission: Transmission;
   currentUserId: string;
   onClick: () => void;
 }
 
 export function TransmissionItem({ transmission, currentUserId, onClick }: TransmissionItemProps) {
   const navigate = useNavigate();
   const isSender = transmission.sender_id === currentUserId;
   const otherUser = isSender ? transmission.recipient_profile : transmission.sender_profile;
   const displayName = otherUser?.display_name || 'Unknown User';
   const avatarUrl = otherUser?.avatar_url;
   const isUnread = !isSender && !transmission.is_read;
 
   const handleAvatarClick = (e: React.MouseEvent) => {
     e.stopPropagation();
     const userId = isSender ? transmission.recipient_id : transmission.sender_id;
     navigate(`/soul/${userId}`);
   };
 
   return (
     <button
       onClick={onClick}
       className={cn(
         "w-full flex items-start gap-3 p-4 rounded-lg transition-colors text-left",
         isUnread ? "bg-primary/10 hover:bg-primary/15" : "hover:bg-muted/50"
       )}
     >
       <Avatar 
         className="h-12 w-12 cursor-pointer hover:ring-2 hover:ring-primary transition-all"
         onClick={handleAvatarClick}
       >
         <AvatarImage src={avatarUrl || undefined} />
         <AvatarFallback>{displayName.charAt(0).toUpperCase()}</AvatarFallback>
       </Avatar>
 
       <div className="flex-1 min-w-0">
         <div className="flex items-center justify-between gap-2">
           <span 
             className={cn(
               "font-medium truncate cursor-pointer hover:text-primary transition-colors",
               isUnread && "text-primary"
             )}
             onClick={handleAvatarClick}
           >
             {displayName}
           </span>
           <span className="text-xs text-muted-foreground whitespace-nowrap">
             {format(new Date(transmission.created_at), 'MMM d, h:mm a')}
           </span>
         </div>
 
         <p className={cn(
           "text-sm line-clamp-2 mt-1",
           isUnread ? "text-foreground" : "text-muted-foreground"
         )}>
           {isSender && <span className="text-muted-foreground">You: </span>}
           {transmission.content}
         </p>
 
         <div className="flex items-center justify-between mt-2">
           <span className="text-xs text-muted-foreground">
             {isSender ? 'Sent' : 'Received'}
           </span>
           {isSender && (
             transmission.is_read ? (
               <CheckCheck className="h-4 w-4 text-primary" />
             ) : (
               <Check className="h-4 w-4 text-muted-foreground" />
             )
           )}
           {isUnread && (
             <span className="px-2 py-0.5 text-xs font-medium bg-primary text-primary-foreground rounded-full">
               New
             </span>
           )}
         </div>
       </div>
     </button>
   );
 }