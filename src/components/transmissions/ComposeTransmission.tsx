 import { useState } from 'react';
 import { Send, ArrowLeft } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { Textarea } from '@/components/ui/textarea';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RecipientSearch } from './RecipientSearch';
import { SearchResult } from '@/hooks/useUserSearch';
import { useTransmissions } from '@/hooks/useTransmissions';
import { VoiceToTextButton } from '@/components/voice/VoiceToTextButton';
 
 interface ComposeTransmissionProps {
   onBack: () => void;
   initialRecipient?: { id: string; name: string } | null;
 }
 
 export function ComposeTransmission({ onBack, initialRecipient }: ComposeTransmissionProps) {
   const [selectedUser, setSelectedUser] = useState<SearchResult | null>(
     initialRecipient
       ? { user_id: initialRecipient.id, display_name: initialRecipient.name, avatar_url: null }
       : null
   );
   const [content, setContent] = useState('');
   const [sending, setSending] = useState(false);
   const { sendTransmission } = useTransmissions();
 
   const handleSend = async () => {
     if (!selectedUser || !content.trim()) return;
 
     setSending(true);
     const success = await sendTransmission(selectedUser.user_id, content.trim());
     setSending(false);
 
     if (success) {
       onBack();
     }
   };
 
   return (
     <Card className="border-primary/20">
       <CardHeader className="pb-4">
         <div className="flex items-center gap-3">
           <Button variant="ghost" size="icon" onClick={onBack}>
             <ArrowLeft className="h-5 w-5" />
           </Button>
           <CardTitle className="text-lg">New Transmission</CardTitle>
         </div>
       </CardHeader>
       <CardContent className="space-y-4">
         <div className="space-y-2">
           <label className="text-sm font-medium text-muted-foreground">
             Recipient
           </label>
           <RecipientSearch
             selectedUser={selectedUser}
             onSelect={setSelectedUser}
             onClear={() => setSelectedUser(null)}
           />
         </div>
 
         <div className="space-y-2">
           <label className="text-sm font-medium text-muted-foreground">
             Message
           </label>
           <Textarea
             placeholder="Write your transmission..."
             value={content}
             onChange={(e) => setContent(e.target.value)}
             className="min-h-[150px] resize-none"
           />
         </div>
 
         <Button
           onClick={handleSend}
           disabled={!selectedUser || !content.trim() || sending}
           className="w-full gap-2"
         >
           <Send className="h-4 w-4" />
           {sending ? 'Sending...' : 'Send Transmission'}
         </Button>
       </CardContent>
     </Card>
   );
 }