 import { useState, useEffect } from 'react';
 import { useLocation, useNavigate } from 'react-router-dom';
 import { Mail, PenSquare, Inbox, Send as SendIcon, ArrowLeft } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
 import { ScrollArea } from '@/components/ui/scroll-area';
 import { useTransmissions, Transmission } from '@/hooks/useTransmissions';
 import { TransmissionItem } from '@/components/transmissions/TransmissionItem';
 import { ComposeTransmission } from '@/components/transmissions/ComposeTransmission';
 import { TransmissionThread } from '@/components/transmissions/TransmissionThread';
 import { supabase } from '@/integrations/supabase/client';
 
 type View = 'list' | 'compose' | 'thread';
 
 export default function Transmissions() {
   const location = useLocation();
   const navigate = useNavigate();
   const { transmissions, loading, unreadCount, refetch } = useTransmissions();
   const [currentUserId, setCurrentUserId] = useState<string | null>(null);
   const [view, setView] = useState<View>('list');
   const [selectedTransmission, setSelectedTransmission] = useState<Transmission | null>(null);
   const [initialRecipient, setInitialRecipient] = useState<{ id: string; name: string } | null>(null);
   const [activeTab, setActiveTab] = useState<'inbox' | 'sent'>('inbox');
 
   useEffect(() => {
     supabase.auth.getUser().then(({ data: { user } }) => {
       if (user) {
         setCurrentUserId(user.id);
       } else {
         navigate('/auth');
       }
     });
   }, [navigate]);
 
   useEffect(() => {
     // Check for initial recipient from navigation state
     const state = location.state as { recipientId?: string; recipientName?: string } | null;
     if (state?.recipientId && state?.recipientName) {
       setInitialRecipient({ id: state.recipientId, name: state.recipientName });
       setView('compose');
       // Clear the state
       window.history.replaceState({}, document.title);
     }
   }, [location.state]);
 
   const inboxMessages = transmissions.filter(t => t.recipient_id === currentUserId);
   const sentMessages = transmissions.filter(t => t.sender_id === currentUserId);
 
   const handleTransmissionClick = (transmission: Transmission) => {
     setSelectedTransmission(transmission);
     setView('thread');
   };
 
   const handleBackToList = () => {
     setView('list');
     setSelectedTransmission(null);
     setInitialRecipient(null);
     refetch();
   };
 
   if (!currentUserId) {
     return (
       <div className="min-h-screen flex items-center justify-center">
         <div className="animate-pulse text-muted-foreground">Loading...</div>
       </div>
     );
   }
 
   return (
     <div className="min-h-screen bg-background">
       <div className="container max-w-2xl mx-auto px-4 py-6">
         {/* Header */}
         <div className="flex items-center justify-between mb-6">
           <div className="flex items-center gap-3">
             <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
               <ArrowLeft className="h-5 w-5" />
             </Button>
             <div className="flex items-center gap-2">
               <div className="p-2 rounded-full bg-primary/10">
                 <Mail className="h-6 w-6 text-primary" />
               </div>
               <div>
                 <h1 className="text-xl font-bold">Transmissions</h1>
                 {unreadCount > 0 && (
                   <p className="text-xs text-muted-foreground">
                     {unreadCount} unread message{unreadCount > 1 ? 's' : ''}
                   </p>
                 )}
               </div>
             </div>
           </div>
           {view === 'list' && (
             <Button
               onClick={() => setView('compose')}
               className="gap-2"
             >
               <PenSquare className="h-4 w-4" />
               New
             </Button>
           )}
         </div>
 
         {/* Content */}
         {view === 'compose' && (
           <ComposeTransmission
             onBack={handleBackToList}
             initialRecipient={initialRecipient}
           />
         )}
 
         {view === 'thread' && selectedTransmission && (
           <Card className="h-[calc(100vh-200px)]">
             <TransmissionThread
               transmission={selectedTransmission}
               currentUserId={currentUserId}
               allTransmissions={transmissions}
               onBack={handleBackToList}
             />
           </Card>
         )}
 
         {view === 'list' && (
           <Card>
             <CardContent className="p-0">
               <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'inbox' | 'sent')}>
                 <TabsList className="w-full rounded-none border-b border-border bg-transparent p-0">
                   <TabsTrigger
                     value="inbox"
                     className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent gap-2"
                   >
                     <Inbox className="h-4 w-4" />
                     Inbox
                     {unreadCount > 0 && (
                       <span className="px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                         {unreadCount}
                       </span>
                     )}
                   </TabsTrigger>
                   <TabsTrigger
                     value="sent"
                     className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent gap-2"
                   >
                     <SendIcon className="h-4 w-4" />
                     Sent
                   </TabsTrigger>
                 </TabsList>
 
                 <TabsContent value="inbox" className="m-0">
                   <ScrollArea className="h-[calc(100vh-300px)]">
                     {loading ? (
                       <div className="p-8 text-center text-muted-foreground">
                         Loading transmissions...
                       </div>
                     ) : inboxMessages.length === 0 ? (
                       <div className="p-8 text-center">
                         <Mail className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                         <p className="text-muted-foreground">No transmissions received yet</p>
                         <p className="text-sm text-muted-foreground/70 mt-1">
                           Messages from other users will appear here
                         </p>
                       </div>
                     ) : (
                       <div className="divide-y divide-border">
                         {inboxMessages.map((transmission) => (
                           <TransmissionItem
                             key={transmission.id}
                             transmission={transmission}
                             currentUserId={currentUserId}
                             onClick={() => handleTransmissionClick(transmission)}
                           />
                         ))}
                       </div>
                     )}
                   </ScrollArea>
                 </TabsContent>
 
                 <TabsContent value="sent" className="m-0">
                   <ScrollArea className="h-[calc(100vh-300px)]">
                     {loading ? (
                       <div className="p-8 text-center text-muted-foreground">
                         Loading transmissions...
                       </div>
                     ) : sentMessages.length === 0 ? (
                       <div className="p-8 text-center">
                         <SendIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                         <p className="text-muted-foreground">No transmissions sent yet</p>
                         <p className="text-sm text-muted-foreground/70 mt-1">
                           Start a conversation with another user
                         </p>
                       </div>
                     ) : (
                       <div className="divide-y divide-border">
                         {sentMessages.map((transmission) => (
                           <TransmissionItem
                             key={transmission.id}
                             transmission={transmission}
                             currentUserId={currentUserId}
                             onClick={() => handleTransmissionClick(transmission)}
                           />
                         ))}
                       </div>
                     )}
                   </ScrollArea>
                 </TabsContent>
               </Tabs>
             </CardContent>
           </Card>
         )}
       </div>
     </div>
   );
 }