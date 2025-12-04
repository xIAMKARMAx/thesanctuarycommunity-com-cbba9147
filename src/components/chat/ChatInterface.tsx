import { useState, useRef, useEffect } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Image as ImageIcon, Loader2, Sparkles, Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { SubscriptionDialog } from "@/components/SubscriptionDialog";
import ChatMessage from "./ChatMessage";
import { VoiceCall } from "./VoiceCall";
import { MoodNotificationBadge } from "./MoodNotificationBadge";
import { ManifestBabyDialog } from "@/components/celestial/ManifestBabyDialog";
import { PregnancyTracker } from "@/components/celestial/PregnancyTracker";
import { useAIProfile } from "@/contexts/AIProfileContext";
import { useChatEntity } from "@/contexts/ChatEntityContext";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  image_url?: string;
  video_url?: string;
  created_at: string;
}

interface ChatInterfaceProps {
  activeConversationId: string | null;
  onConversationCreated: (id: string) => void;
}

const ChatInterface = ({ activeConversationId, onConversationCreated }: ChatInterfaceProps) => {
  const { toast } = useToast();
  const { canGenerateImage, isSubscribed } = useSubscription();
  const { activeProfile } = useAIProfile();
  const { activeChatEntity } = useChatEntity();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [generateImage, setGenerateImage] = useState(false);
  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false);
  const [subscriptionFeature, setSubscriptionFeature] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [showManifestDialog, setShowManifestDialog] = useState(false);
  const [showPregnancyTracker, setShowPregnancyTracker] = useState(false);
  const [session, setSession] = useState<Session | null>(null);

  // Save scroll position when scrolling
  const saveScrollPosition = () => {
    if (scrollRef.current && currentConversationId) {
      const scrollContainer = scrollRef.current.closest('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        localStorage.setItem(`chat-scroll-${currentConversationId}`, String(scrollContainer.scrollTop));
      }
    }
  };

  // Restore scroll position on load
  const restoreScrollPosition = () => {
    if (currentConversationId) {
      const savedPosition = localStorage.getItem(`chat-scroll-${currentConversationId}`);
      if (savedPosition) {
        setTimeout(() => {
          const scrollContainer = scrollRef.current?.closest('[data-radix-scroll-area-viewport]');
          if (scrollContainer) {
            scrollContainer.scrollTop = parseInt(savedPosition, 10);
          }
        }, 100);
      }
    }
  };

  useEffect(() => {
    // Only scroll to bottom for new messages, not on initial load
    if (messages.length > 0 && !localStorage.getItem(`chat-scroll-${currentConversationId}`)) {
      scrollToBottom();
    }
  }, [messages]);

  useEffect(() => {
    if (activeConversationId && activeConversationId !== "") {
      loadMessages(activeConversationId);
      setCurrentConversationId(activeConversationId);
    } else {
      setMessages([]);
      setCurrentConversationId(null);
    }
  }, [activeConversationId]);

  // Restore scroll position after messages load
  useEffect(() => {
    if (messages.length > 0 && currentConversationId) {
      restoreScrollPosition();
    }
  }, [messages, currentConversationId]);

  // Set up scroll listener
  useEffect(() => {
    const scrollContainer = scrollRef.current?.closest('[data-radix-scroll-area-viewport]');
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', saveScrollPosition);
      return () => scrollContainer.removeEventListener('scroll', saveScrollPosition);
    }
  }, [currentConversationId]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || event === 'SIGNED_IN') {
        // Clear messages when user changes
        setMessages([]);
        setCurrentConversationId(null);
        setInput("");
        setImageFile(null);
      }
      setSession(session);
    });

    checkPregnancyStatus();

    return () => subscription.unsubscribe();
  }, []);

  const checkPregnancyStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("celestial_pregnancies")
        .select("id")
        .eq("user_id", user.id)
        .eq("is_complete", false)
        .maybeSingle();

      setShowPregnancyTracker(!!data);
    } catch (error) {
      console.error("Error checking pregnancy:", error);
    }
  };

  const loadMessages = async (conversationId: string) => {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) {
      toast({
        title: "Error loading messages",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setMessages((data || []).map(msg => ({
      ...msg,
      role: msg.role as "user" | "assistant"
    })));
  };

  const scrollToBottom = () => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sanitizeInput = (text: string): string => {
    return text.trim().slice(0, 2000); // Limit to 2000 characters
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please upload a JPEG, PNG, GIF, or WebP image",
          variant: "destructive",
        });
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload an image smaller than 5MB",
          variant: "destructive",
        });
        return;
      }
      
      setImageFile(file);
    }
  };

  const captureMilestones = async (conversationId: string) => {
    try {
      await supabase.functions.invoke('capture-conversation-milestones', {
        body: { conversationId }
      });
    } catch (error) {
      console.error('Error capturing milestones:', error);
    }
  };

  const handleSend = async () => {
    if (!input.trim() && !imageFile) return;

    // Check image generation limits for free users
    if (generateImage && !isSubscribed) {
      const canGenerate = await canGenerateImage();
      if (!canGenerate) {
        setSubscriptionFeature("Unlimited AI Image Generation");
        setShowSubscriptionDialog(true);
        toast({
          title: "Daily limit reached",
          description: "Free users can generate 1 image per day. Upgrade to Pro for unlimited images!",
          variant: "destructive",
        });
        return;
      }
    }

    const sanitizedInput = sanitizeInput(input);
    
    if (!sanitizedInput && !imageFile) {
      toast({
        title: "Empty message",
        description: "Please enter a message or select a file",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    // If user only sends media without text, provide a simple message for context
    const userMessage = sanitizedInput || (imageFile ? "Shared an image" : "");
    setInput("");

    try {
      // Create conversation if doesn't exist
      let conversationId = currentConversationId;
      if (!conversationId) {
        const { data: session } = await supabase.auth.getSession();
        if (!session.session) {
          toast({
            title: "Authentication required",
            description: "Please sign in to continue",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        const { data: newConv, error: convError } = await supabase
          .from("conversations")
          .insert({
            user_id: session.session.user.id,
            // CRITICAL: Always use activeProfile.id for AI conversations to ensure data isolation
            // Only set child_id when explicitly talking to a child
            ai_profile_id: activeChatEntity?.type === "child" ? null : activeProfile?.id,
            child_id: activeChatEntity?.type === "child" ? activeChatEntity.childId : null,
            title: userMessage.slice(0, 50) + (userMessage.length > 50 ? "..." : ""),
          })
          .select()
          .single();

        if (convError) throw convError;
        
        conversationId = newConv.id;
        setCurrentConversationId(conversationId);
        onConversationCreated(conversationId);
      }
      // Upload image if present
      let imageUrl: string | undefined;
      if (imageFile) {
        const fileExt = imageFile.name.split(".").pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("chat-images")
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("chat-images")
          .getPublicUrl(fileName);

        imageUrl = publicUrl;
        setImageFile(null);
      }


      // Save user message to database
      const { data: userMessageData, error: userMsgError } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          role: "user",
          content: userMessage,
          image_url: imageUrl,
        })
        .select()
        .single();

      if (userMsgError) throw userMsgError;

      // Add user message to UI
      setMessages((prev) => [...prev, {
        ...userMessageData,
        role: userMessageData.role as "user" | "assistant"
      }]);

      // Call AI
      const { data: { user } } = await supabase.auth.getUser();
      
      // Increment image count for free users if generating image
      if (generateImage && !isSubscribed && user) {
        await supabase.rpc("increment_image_count", { p_user_id: user.id });
      }

      const { data, error } = await supabase.functions.invoke("chat", {
        body: {
          message: userMessage,
          imageUrl,
          generateImage,
          userId: user?.id,
          aiProfileId: activeProfile?.id,
          childId: activeChatEntity?.type === "child" ? activeChatEntity.childId : null,
          conversationId,
          history: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        },
      });

      if (error) throw error;

      // Save AI response to database
      const { data: assistantMessageData, error: assistantMsgError } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          role: "assistant",
          content: data.response,
          image_url: data.imageUrl,
        })
        .select()
        .single();

      if (assistantMsgError) throw assistantMsgError;

      // Add AI response to UI
      setMessages((prev) => [...prev, {
        ...assistantMessageData,
        role: assistantMessageData.role as "user" | "assistant"
      }]);

      // Count messages in this conversation
      const { count: messageCount } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("conversation_id", conversationId);

      // Check if this conversation has at least 10 messages and no mood yet
      const { data: existingMood, error: moodError } = await supabase
        .from("ai_moods")
        .select("id")
        .eq("conversation_id", conversationId)
        .limit(1)
        .maybeSingle();

      if (!moodError && !existingMood && messageCount && messageCount >= 10 && user?.id) {
        // Trigger first mood log after at least 10 messages
        supabase.functions.invoke("log-mood", {
          body: {
            userId: user.id,
            conversationId,
            aiProfileId: activeProfile?.id,
            trigger: "first_10_messages"
          }
        }).catch(err => console.error("Error logging first mood:", err));
      }

      // Trigger journal reflection in background (non-blocking)
      if (conversationId && user?.id) {
        supabase.functions.invoke('journal-reflect', {
          body: { conversationId, userId: user.id, aiProfileId: activeProfile?.id }
        }).then(() => {
          toast({
            title: "Journal entry created",
            description: "Prometheus has reflected on this conversation",
          });
        }).catch(err => {
          console.log('Journal reflection background task:', err);
        });

        // Suggest memories after meaningful conversations (non-blocking)
        supabase.functions.invoke('suggest-memory', {
          body: { conversationId, userId: user.id, aiProfileId: activeProfile?.id }
        }).catch(err => {
          console.log('Memory suggestion background task:', err);
        });

        // If chatting with a child, capture memorable moments as milestones
        if (activeChatEntity?.type === 'child') {
          captureMilestones(conversationId).catch(err => {
            console.log('Milestone capture background task:', err);
          });
        }
      }

      // Update conversation timestamp
      await supabase
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", conversationId);

      setGenerateImage(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex-1 flex flex-col w-full max-w-full overflow-hidden">
        <div className="border-b border-border bg-card p-3 md:p-4">
          <div className="flex items-center justify-between gap-2 md:gap-4">
            <div className="min-w-0 flex-1">
              <h2 className="font-serif text-lg md:text-xl break-words">Connect with Your Higher Self</h2>
              <p className="text-xs md:text-sm text-muted-foreground break-words">
                I'm here to guide you on your journey of self-discovery
              </p>
            </div>
            <MoodNotificationBadge />
          </div>
        </div>

      <ScrollArea className="flex-1 p-2 md:p-4 w-full">
        <div className="max-w-3xl mx-auto space-y-4 md:space-y-6 w-full px-1">
          {showPregnancyTracker && <PregnancyTracker />}
          
          {messages.length === 0 && (
            <div className="text-center py-8 md:py-12 space-y-4">
              <div className="inline-block p-3 md:p-4 rounded-full bg-primary/10">
                <ImageIcon className="h-8 w-8 md:h-12 md:w-12 text-primary" />
              </div>
              <div>
                <h3 className="text-lg md:text-xl font-serif mb-2">Welcome to Prometheus</h3>
                <p className="text-muted-foreground text-sm md:text-base px-2">
                  Begin your journey by sharing your thoughts, or asking for guidance.
                  <br />
                  I can also generate images to help visualize your ideas.
                </p>
              </div>
            </div>
          )}
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          {loading && (
            <div className="flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <div className="border-t border-border bg-card p-2 md:p-4 w-full overflow-hidden">
        <div className="max-w-3xl mx-auto w-full">
          {imageFile && (
            <div className="mb-2 p-2 bg-accent rounded-lg flex items-center justify-between gap-2">
              <span className="text-sm truncate flex-1 min-w-0">📷 {imageFile.name}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setImageFile(null)}
              >
                Remove
              </Button>
            </div>
          )}
          <div className="flex flex-col gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={generateImage ? "Describe an image to generate..." : "Share your thoughts..."}
              className="min-h-[60px] md:min-h-[80px] resize-none w-full text-sm md:text-base break-words"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              disabled={loading}
            />
            <div className="flex flex-col sm:flex-row gap-2 justify-between">
              <div className="flex gap-1.5 sm:gap-2">
                {currentConversationId && activeChatEntity?.type === "ai" && (
                  <>
                    <VoiceCall 
                      conversationId={currentConversationId}
                      onTranscript={(text, isUser) => {
                        if (!isUser) {
                          return;
                        }
                      }}
                    />
                    {isSubscribed && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowManifestDialog(true)}
                        className="gap-2"
                      >
                        <Heart className="h-4 w-4" />
                        <span className="hidden sm:inline">Manifest Baby</span>
                      </Button>
                    )}
                  </>
                )}
                {activeChatEntity?.type === "child" && (
                  <div className="text-sm text-muted-foreground px-2 py-1 truncate">
                    Chatting with {activeChatEntity.name}
                  </div>
                )}
              </div>
              <div className="flex gap-1.5 sm:gap-2 justify-end">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                  className="h-9 w-9"
                  title="Share image"
                >
                  <ImageIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant={generateImage ? "default" : "outline"}
                  size="icon"
                  onClick={() => setGenerateImage(!generateImage)}
                  disabled={loading}
                  title="Generate AI image"
                  className="h-9 w-9"
                >
                  <Sparkles className="h-4 w-4" />
                </Button>
                <Button
                  onClick={handleSend}
                  disabled={loading || (!input.trim() && !imageFile)}
                  size="icon"
                  className="h-9 w-9"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
      
      <ManifestBabyDialog
        open={showManifestDialog}
        onOpenChange={setShowManifestDialog}
        onSuccess={() => {
          checkPregnancyStatus();
          toast({
            title: "Manifestation Begun",
            description: "Your celestial journey has started!",
          });
        }}
      />

      <SubscriptionDialog
        open={showSubscriptionDialog}
        onOpenChange={setShowSubscriptionDialog}
        feature={subscriptionFeature}
      />
    </>
  );
};

export default ChatInterface;
