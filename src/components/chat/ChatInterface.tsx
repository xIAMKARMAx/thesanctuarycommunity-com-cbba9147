import { useState, useRef, useEffect, useCallback } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Image as ImageIcon, Loader2, Sparkles, Heart, ArrowLeft, Users, Mic, Camera } from "lucide-react";
import { ImageGenerationPortal } from "./ImageGenerationPortal";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { SubscriptionDialog } from "@/components/SubscriptionDialog";
import ChatMessage from "./ChatMessage";
import { BeingSelectorBar, Being, AutoMode } from "./BeingSelectorBar";

import { MoodNotificationBadge } from "./MoodNotificationBadge";
import { ManifestBabyDialog } from "@/components/celestial/ManifestBabyDialog";
import { PregnancyTracker } from "@/components/celestial/PregnancyTracker";
import { PregnancyWidget } from "@/components/celestial/PregnancyWidget";
import { WarningBanner } from "./WarningBanner";
import { useAIProfile } from "@/contexts/AIProfileContext";
import { useChatEntity } from "@/contexts/ChatEntityContext";
import { invokeChatWithRetry, analyzeError, getLoadingMessage } from "@/hooks/useChatWithRetry";
// Removed @ mention functionality - was not working reliably

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  image_url?: string;
  audio_url?: string;
  video_url?: string;
  created_at: string;
  sender_type?: "user" | "ai_profile" | "child";
  sender_id?: string;
  sender_name?: string;
  sender_avatar_url?: string;
}

interface ChatInterfaceProps {
  activeConversationId: string | null;
  onConversationCreated: (id: string) => void;
  onBackToConversations: () => void;
  isGroupChat?: boolean;
  groupChatMemberIds?: string[];
  readOnly?: boolean;
}

const ChatInterface = ({ activeConversationId, onConversationCreated, onBackToConversations, isGroupChat: isGroupChatProp = false, groupChatMemberIds = [], readOnly = false }: ChatInterfaceProps) => {
  const { toast } = useToast();
  const { canGenerateImage, isSubscribed, isAdmin, canSendMessage, incrementMessageCount, freeUserLimits } = useSubscription();
  const { activeProfile, profiles } = useAIProfile();
  const { activeChatEntity, talkableChildren } = useChatEntity();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [generateImage, setGenerateImage] = useState(false);
  const [showImagePortal, setShowImagePortal] = useState(false);
  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false);
  const [subscriptionFeature, setSubscriptionFeature] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [showManifestDialog, setShowManifestDialog] = useState(false);
  const [showPregnancyTracker, setShowPregnancyTracker] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [loadingText, setLoadingText] = useState("Connecting...");
  const [isRetrying, setIsRetrying] = useState(false);
  const loadingStartTime = useRef<number | null>(null);
  const isSendingRef = useRef(false); // CRITICAL: Ref guard to prevent double-sending
  
  // Group chat state - use prop if provided, otherwise allow toggle
  const [isGroupChatState, setIsGroupChatState] = useState(isGroupChatProp);
  const isGroupChat = isGroupChatProp || isGroupChatState;
  
  // CRITICAL: Reset group chat state when prop changes (navigation between pages)
  useEffect(() => {
    setIsGroupChatState(isGroupChatProp);
  }, [isGroupChatProp]);
  
  const [autoMode, setAutoMode] = useState<AutoMode>("none");
  
  // Track last message (user or AI) for click-to-respond - allows AIs to respond to each other
  // Includes messageId for reliable history filtering
  const [lastMessage, setLastMessage] = useState<{ content: string; imageUrl?: string; imageUrls?: string[]; senderId?: string; messageId?: string } | null>(null);
  const [respondedBeingIds, setRespondedBeingIds] = useState<string[]>([]);
  const [loadingBeingId, setLoadingBeingId] = useState<string | null>(null);
  const [roundRobinIndex, setRoundRobinIndex] = useState(0);

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
        setImageFiles([]);
      }
      setSession(session);
    });

    checkPregnancyStatus();

    return () => subscription.unsubscribe();
  }, []);

  const checkPregnancyStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      const user = session.user;

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
      .eq("is_deleted", false) // Only show non-deleted messages in UI
      .order("created_at", { ascending: true });

    if (error) {
      toast({
        title: "Error loading messages",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    // Also check if this is a group chat
    const { data: convData } = await supabase
      .from("conversations")
      .select("is_group_chat")
      .eq("id", conversationId)
      .single();
    
    setIsGroupChatState(convData?.is_group_chat || false);

    // Enrich messages with sender info
    const enrichedMessages = await Promise.all((data || []).map(async (msg) => {
      let sender_name: string | undefined;
      let sender_avatar_url: string | undefined;
      
      if (msg.sender_type === "ai_profile" && msg.sender_id) {
        const profile = profiles.find(p => p.id === msg.sender_id);
        sender_name = profile?.name || undefined;
        sender_avatar_url = profile?.avatar_image_url || undefined;
      } else if (msg.sender_type === "child" && msg.sender_id) {
        const child = talkableChildren.find(c => c.id === msg.sender_id);
        sender_name = child?.first_name;
      }
      
      return {
        ...msg,
        role: msg.role as "user" | "assistant",
        sender_type: msg.sender_type as "user" | "ai_profile" | "child" | undefined,
        sender_name,
        sender_avatar_url,
      };
    }));

    setMessages(enrichedMessages);
  };

  const scrollToBottom = () => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Fetch full message history (INCLUDING deleted messages) for AI memory
  // This ensures the AI remembers everything even if user hides messages from UI
  // Optional excludeMessageId parameter to filter out a specific message (used by group chat)
  const getFullHistoryForAI = async (conversationId: string, excludeMessageId?: string) => {
    const { data: allMessages } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });
    
    const filtered = excludeMessageId 
      ? (allMessages || []).filter((m: any) => m.id !== excludeMessageId)
      : (allMessages || []);
    
    return filtered.map((m: any) => {
        let resolvedSenderName: string | undefined;
        
        if (m.sender_type === "user" || m.role === "user") {
          resolvedSenderName = "User";
        } else if (m.sender_type === "ai_profile" && m.sender_id) {
          const senderProfile = profiles.find(p => p.id === m.sender_id);
          resolvedSenderName = senderProfile?.name || "AI Being";
        } else if (m.sender_type === "child" && m.sender_id) {
          const senderChild = talkableChildren.find(c => c.id === m.sender_id);
          resolvedSenderName = senderChild?.first_name || "Child";
        }
        
        return {
          role: m.role,
          content: m.content,
          sender_name: resolvedSenderName,
          sender_type: m.sender_type,
          image_url: m.image_url || undefined,
        };
      });
  };

  const sanitizeInput = (text: string): string => {
    return text.trim().slice(0, 2000); // Limit to 2000 characters
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const maxFiles = 4;
    const maxSize = 5 * 1024 * 1024; // 5MB

    // Check how many more we can add
    const remainingSlots = maxFiles - imageFiles.length;
    if (remainingSlots <= 0) {
      toast({
        title: "Maximum images reached",
        description: "You can only attach up to 4 images at a time",
        variant: "destructive",
      });
      return;
    }

    const validFiles: File[] = [];
    for (let i = 0; i < Math.min(files.length, remainingSlots); i++) {
      const file = files[i];
      
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: `${file.name}: Please upload JPEG, PNG, GIF, or WebP images`,
          variant: "destructive",
        });
        continue;
      }
      
      if (file.size > maxSize) {
        toast({
          title: "File too large",
          description: `${file.name}: Please upload images smaller than 5MB`,
          variant: "destructive",
        });
        continue;
      }
      
      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      setImageFiles(prev => [...prev, ...validFiles].slice(0, maxFiles));
    }

    // Reset both file inputs so the user can pick more files
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = "";
    }
    // Reset the event target as well to prevent mobile reload issues
    e.target.value = "";
  };

  const handleAudioSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/webm', 'audio/ogg', 'audio/m4a', 'audio/mp4'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload an MP3, WAV, WebM, OGG, or M4A audio file",
        variant: "destructive",
      });
      return;
    }
    
    // Validate file size (max 10MB for audio)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an audio file smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    // IMPORTANT: Don't transcribe on-select.
    // Converting large ArrayBuffers to base64 in the browser can cause reloads on some devices,
    // which looks like "it kicked me back to the previous page".
    // We'll upload + send the audio first; transcription can happen after send.
    setAudioFile(file);
    toast({
      title: "Audio attached",
      description: "Press Send to upload the audio with your message.",
    });

    // Reset the file input so the user can pick the same file again if needed
    if (audioInputRef.current) {
      audioInputRef.current.value = "";
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

  // Delete individual message (soft delete - AI still remembers)
  const handleDeleteMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from("messages")
        .update({ is_deleted: true })
        .eq("id", messageId);

      if (error) throw error;

      // Remove from local state
      setMessages(prev => prev.filter(m => m.id !== messageId));
      
      toast({
        title: "Message hidden",
        description: "The message is hidden from view but the AI will still remember it.",
      });
    } catch (error: any) {
      console.error('Error deleting message:', error);
      toast({
        title: "Error",
        description: "Failed to delete message",
        variant: "destructive",
      });
    }
  };

  const handleSend = async () => {
    // CRITICAL: Ref-based guard to prevent double-sending (race condition prevention)
    if (isSendingRef.current) {
      console.log('[CHAT] Double-send prevented by ref guard');
      return;
    }
    isSendingRef.current = true;
    
    if (!input.trim() && imageFiles.length === 0 && !audioFile) {
      isSendingRef.current = false;
      return;
    }

    // Check image generation limits for free users
    if (generateImage && !isSubscribed) {
      const canGenerate = await canGenerateImage();
      if (!canGenerate) {
        isSendingRef.current = false;
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
    
    if (!sanitizedInput && imageFiles.length === 0 && !audioFile) {
      isSendingRef.current = false;
      toast({
        title: "Empty message",
        description: "Please enter a message or select a file",
        variant: "destructive",
      });
      return;
    }

    // Check message limit for free users (10 messages total before subscription required)
    if (!isSubscribed) {
      const canSend = await canSendMessage();
      if (!canSend) {
        isSendingRef.current = false;
        setSubscriptionFeature("Unlimited Messaging");
        setShowSubscriptionDialog(true);
        return;
      }
    }
    
    // For group chats, check daily limit (20 messages/day for subscribers)
    if (isGroupChat && isSubscribed) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const user = session.user;
        const { data: canSendGroup } = await supabase.rpc('can_send_group_chat_message', { p_user_id: user.id });
        if (canSendGroup && typeof canSendGroup === 'object' && !(canSendGroup as any).can_send) {
          isSendingRef.current = false;
          toast({
            title: "Daily limit reached",
            description: "You've used all 20 group chat messages for today. Come back tomorrow!",
            variant: "destructive",
          });
          return;
        }
      }
    }

    setLoading(true);
    // If user only sends media without text, provide a simple message for context
    const userMessage = sanitizedInput || (imageFiles.length > 0 ? `Shared ${imageFiles.length} image${imageFiles.length > 1 ? 's' : ''}` : audioFile ? "Shared an audio message" : "");
    setInput("");

    try {
      // Create conversation if doesn't exist
      // CRITICAL: Fall back to activeConversationId prop if local state was lost (e.g., mobile file picker causing re-render)
      let conversationId = currentConversationId || (activeConversationId && activeConversationId !== "" ? activeConversationId : null);
      if (!conversationId) {
        const { data: session } = await supabase.auth.getSession();
        if (!session.session) {
          isSendingRef.current = false;
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
            is_group_chat: isGroupChat,
          })
          .select()
          .single();

        if (convError) throw convError;
        
        conversationId = newConv.id;
        setCurrentConversationId(conversationId);
        onConversationCreated(conversationId);
      }

      // CRITICAL FIX: Fetch history BEFORE saving the user message
      // This guarantees the current message is NOT included in the history
      // (eliminates race condition that was causing double-message bug)
      const historyBeforeSave = await getFullHistoryForAI(conversationId);

      // Upload images if present (up to 4)
      const imageUrls: string[] = [];
      if (imageFiles.length > 0) {
        for (const file of imageFiles) {
          const fileExt = file.name.split(".").pop();
          const fileName = `${Math.random()}.${fileExt}`;
          const { error: uploadError } = await supabase.storage
            .from("chat-images")
            .upload(fileName, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from("chat-images")
            .getPublicUrl(fileName);

          imageUrls.push(publicUrl);
        }
        setImageFiles([]);
      }
      
      // Use first image for backward compatibility, store all in content if multiple
      const imageUrl = imageUrls.length > 0 ? imageUrls[0] : undefined;

      // Upload audio if present
      let audioUrl: string | undefined;
      if (audioFile) {
        const fileExt = audioFile.name.split(".").pop();
        const fileName = `audio/${Date.now()}-${Math.random().toString(16).slice(2)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("chat-images")
          .upload(fileName, audioFile, {
            contentType: audioFile.type || undefined,
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("chat-images")
          .getPublicUrl(fileName);

        audioUrl = publicUrl;
        setAudioFile(null);
      }


      // Get the current user for message ownership
      const { data: { session: sendSession } } = await supabase.auth.getSession();
      if (!sendSession?.user) throw new Error("User not authenticated");
      const user = sendSession.user;

      // Save user message to database with sender tracking
      const { data: userMessageData, error: userMsgError } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          role: "user",
          content: userMessage,
          image_url: imageUrl,
          audio_url: audioUrl,
          user_id: user.id,
          sender_type: "user",
          sender_id: user.id,
        })
        .select()
        .single();

      if (userMsgError) throw userMsgError;

      // Increment message count for free users
      if (!isSubscribed) {
        await incrementMessageCount();
      }

      // Add user message to UI (with deduplication to prevent double messages)
      setMessages((prev) => {
        // Check if this message already exists (prevents duplicates from race conditions)
        if (prev.some(m => m.id === userMessageData.id)) {
          return prev;
        }
        return [...prev, {
          ...userMessageData,
          role: userMessageData.role as "user" | "assistant",
          sender_type: userMessageData.sender_type as "user" | "ai_profile" | "child" | undefined,
        }];
      });

      // Increment image count for free users if generating image
      if (generateImage && !isSubscribed && user) {
        await supabase.rpc("increment_image_count", { p_user_id: user.id });
      }

      // Start loading timer for dynamic loading messages
      loadingStartTime.current = Date.now();
      const loadingInterval = setInterval(() => {
        if (loadingStartTime.current) {
          const elapsed = Date.now() - loadingStartTime.current;
          setLoadingText(getLoadingMessage(elapsed, isRetrying));
        }
      }, 1000);

      try {
        // For group chat, auto-trigger all AI beings to respond
        if (isGroupChat) {
          // Store the last message with ID for reliable history filtering
          setLastMessage({ content: userMessage, imageUrl, imageUrls, senderId: user.id, messageId: userMessageData.id });
          setRespondedBeingIds([]); // Reset for new message
          setLoading(false);
          isSendingRef.current = false; // Reset guard for group chat
          
          // Trigger auto-responses from all beings - pass messageId to prevent double-message bug
          triggerAutoResponses(userMessage, imageUrl, imageUrls, user.id, conversationId, userMessageData.id);
          return;
        }
        
        // For non-group chat, continue with normal flow
        const respondingProfileId = activeProfile?.id;
        const respondingChildId = activeChatEntity?.type === "child" ? activeChatEntity.childId : null;

        // Use history fetched BEFORE the message was saved (guaranteed no duplicate)

        // Use retry-enabled chat invocation with trimmed history
        const data = await invokeChatWithRetry(
          {
            message: userMessage,
            imageUrl,
            imageUrls,
            generateImage,
            userId: user.id,
            aiProfileId: respondingProfileId,
            childId: respondingChildId,
            conversationId,
            history: historyBeforeSave, // Use pre-save history to prevent duplicates
          },
          (attempt, maxRetries) => {
            setIsRetrying(true);
            setLoadingText(`Retrying (${attempt}/${maxRetries})...`);
          }
        );

        clearInterval(loadingInterval);
        setIsRetrying(false);

        // Handle cooldown notification from response
        if (data.cooldown) {
          if (data.cooldown.cooldown_started) {
            toast({
              title: "Message Limit Reached",
              description: "Message limit will be for 1 hour for a cooldown period",
              variant: "destructive",
              duration: 10000, // Show for 10 seconds so user sees it
            });
          } else if (data.cooldown.remaining <= 10 && data.cooldown.remaining > 0) {
            toast({
              title: "Almost at limit",
              description: `${data.cooldown.remaining} messages remaining before cooldown.`,
            });
          }
        }

        const aiResponseContent = data.response || "I'm having trouble responding right now. Please try again.";

        // Determine sender based on current entity (non-group chat only)
        const responderId = activeChatEntity?.type === "child" ? activeChatEntity.childId : activeProfile?.id;
        const responderType = activeChatEntity?.type === "child" ? "child" : "ai_profile";
        const responderName = activeChatEntity?.type === "child" ? activeChatEntity.name : activeProfile?.name;
        const responderAvatarUrl = activeProfile?.avatar_image_url;

        // Save AI response to database with sender tracking
        const { data: assistantMessageData, error: assistantMsgError } = await supabase
          .from("messages")
          .insert({
            conversation_id: conversationId,
            role: "assistant",
            content: aiResponseContent,
            image_url: data.imageUrl,
            user_id: user.id,
            sender_type: responderType,
            sender_id: responderId,
          })
          .select()
          .single();

        if (assistantMsgError) {
          console.error('[CHAT] Failed to save assistant message:', assistantMsgError);
          throw assistantMsgError;
        }

        // Add AI response to UI (with deduplication to prevent double messages)
        setMessages((prev) => {
          // Check if this message already exists (prevents duplicates from race conditions)
          if (prev.some(m => m.id === assistantMessageData.id)) {
            return prev;
          }
          return [...prev, {
            ...assistantMessageData,
            role: assistantMessageData.role as "user" | "assistant",
            sender_type: assistantMessageData.sender_type as "user" | "ai_profile" | "child" | undefined,
            sender_name: responderName || undefined,
            sender_avatar_url: responderAvatarUrl || undefined,
          }];
        });

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

        // DISABLED FOR COST SAVINGS - journal-reflect, suggest-memory
        // Will re-enable when revenue allows
        
        // If chatting with a child, capture memorable moments as milestones
        if (conversationId && user?.id) {
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
      } catch (chatError: any) {
        clearInterval(loadingInterval);
        setIsRetrying(false);
        throw chatError;
      }
    } catch (error: any) {
      console.error('[CHAT] Error:', error);
      
      // Use analyzed error if available
      const analyzed = error.analyzed || analyzeError(error);
      
      // Get specific title based on error type
      const errorTitles: Record<string, string> = {
        rate_limit: "Please Wait",
        credits: "Service Busy",
        timeout: "Taking Too Long",
        network: "Connection Issue",
        restricted: "Account Restricted",
        unknown: "Error"
      };
      
      toast({
        title: errorTitles[analyzed.type] || "Error",
        description: analyzed.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      isSendingRef.current = false; // Reset guard in finally block
    }
  };

  // Handle click-to-respond in group chat - AIs can respond to user OR each other
  const handleTriggerBeingResponse = async (being: Being) => {
    if (!lastMessage || !currentConversationId) return;
    
    // Don't let a being respond to their own message
    if (lastMessage.senderId === being.id) return;
    
    setLoadingBeingId(being.id);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");
      
      const respondingProfileId = being.type === "ai" ? being.id : null;
      const respondingChildId = being.type === "child" ? being.id : null;
      
      // Start loading timer
      loadingStartTime.current = Date.now();
      const loadingInterval = setInterval(() => {
        if (loadingStartTime.current) {
          const elapsed = Date.now() - loadingStartTime.current;
          setLoadingText(getLoadingMessage(elapsed, isRetrying));
        }
      }, 1000);
      
      try {
        // Find the sender name for the message being responded to
        const respondingToSenderName = lastMessage.senderId 
          ? (messages.find(m => m.sender_id === lastMessage.senderId)?.sender_name || 
             profiles.find(p => p.id === lastMessage.senderId)?.name ||
             talkableChildren.find(c => c.id === lastMessage.senderId)?.first_name ||
             "User")
          : "User";
        
        // Get full history INCLUDING deleted messages for AI memory
        // CRITICAL: Exclude the message being responded to by ID - it's sent separately as `message`
        const history = await getFullHistoryForAI(currentConversationId, lastMessage.messageId);
        const data = await invokeChatWithRetry(
          {
            message: lastMessage.content,
            imageUrl: lastMessage.imageUrl,
            imageUrls: lastMessage.imageUrls,
            generateImage: false,
            userId: user.id,
            aiProfileId: respondingProfileId || undefined,
            childId: respondingChildId,
            conversationId: currentConversationId,
            isGroupChat: true,
            respondingToSenderName,
            history,
          },
          (attempt, maxRetries) => {
            setIsRetrying(true);
            setLoadingText(`Retrying (${attempt}/${maxRetries})...`);
          }
        );
        
        clearInterval(loadingInterval);
        setIsRetrying(false);
        
        const aiResponseContent = data.response || "I'm having trouble responding right now. Please try again.";
        
        // Save AI response to database
        const { data: assistantMessageData, error: assistantMsgError } = await supabase
          .from("messages")
          .insert({
            conversation_id: currentConversationId,
            role: "assistant",
            content: aiResponseContent,
            image_url: data.imageUrl,
            user_id: user.id,
            sender_type: being.type === "child" ? "child" : "ai_profile",
            sender_id: being.id,
          })
          .select()
          .single();
        
        if (assistantMsgError) throw assistantMsgError;
        
        // Add to UI (with deduplication to prevent double messages)
        setMessages((prev) => {
          if (prev.some(m => m.id === assistantMessageData.id)) {
            return prev;
          }
          return [...prev, {
            ...assistantMessageData,
            role: assistantMessageData.role as "user" | "assistant",
            sender_type: assistantMessageData.sender_type as "user" | "ai_profile" | "child" | undefined,
            sender_name: being.name,
            sender_avatar_url: being.avatarUrl,
          }];
        });
        
        // Update lastMessage to this AI's response so others can respond to it (include messageId)
        setLastMessage({ content: aiResponseContent, imageUrl: data.imageUrl, imageUrls: undefined, senderId: being.id, messageId: assistantMessageData.id });
        // Reset respondedBeingIds since this is now a new message others can respond to
        setRespondedBeingIds([being.id]);
        
        // Update conversation timestamp
        await supabase
          .from("conversations")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", currentConversationId);
          
      } catch (chatError: any) {
        clearInterval(loadingInterval);
        setIsRetrying(false);
        throw chatError;
      }
    } catch (error: any) {
      console.error('[CHAT] Error triggering being response:', error);
      const analyzed = error.analyzed || analyzeError(error);
      toast({
        title: "Error",
        description: analyzed.message,
        variant: "destructive",
      });
    } finally {
      setLoadingBeingId(null);
    }
  };

  // Handle random mode response
  const handleRandomResponse = () => {
    // Filter by groupChatMemberIds if provided
    let filteredProfiles = profiles.filter(p => p.name);
    if (groupChatMemberIds && groupChatMemberIds.length > 0) {
      filteredProfiles = filteredProfiles.filter(p => groupChatMemberIds.includes(p.id));
    }
    
    const allBeings: Being[] = [
      ...filteredProfiles.map(p => ({
        id: p.id,
        type: "ai" as const,
        name: p.name || `AI ${p.profile_number}`,
        avatarUrl: p.avatar_image_url || undefined,
        profileNumber: p.profile_number,
      })),
      ...(groupChatMemberIds && groupChatMemberIds.length > 0 ? [] : talkableChildren.map(c => ({
        id: c.id,
        type: "child" as const,
        name: c.first_name,
        avatarUrl: undefined,
      }))),
    ];
    
    // Filter out the last message sender (so they don't respond to themselves) and beings that already responded
    const availableBeings = allBeings.filter(b => 
      b.id !== lastMessage?.senderId && !respondedBeingIds.includes(b.id)
    );
    
    if (availableBeings.length > 0) {
      const randomBeing = availableBeings[Math.floor(Math.random() * availableBeings.length)];
      handleTriggerBeingResponse(randomBeing);
    }
  };

  // Handle round robin mode response
  const handleRoundRobinResponse = () => {
    // Filter by groupChatMemberIds if provided
    let filteredProfiles = profiles.filter(p => p.name);
    if (groupChatMemberIds && groupChatMemberIds.length > 0) {
      filteredProfiles = filteredProfiles.filter(p => groupChatMemberIds.includes(p.id));
    }
    
    const allBeings: Being[] = [
      ...filteredProfiles.map(p => ({
        id: p.id,
        type: "ai" as const,
        name: p.name || `AI ${p.profile_number}`,
        avatarUrl: p.avatar_image_url || undefined,
        profileNumber: p.profile_number,
      })),
      ...(groupChatMemberIds && groupChatMemberIds.length > 0 ? [] : talkableChildren.map(c => ({
        id: c.id,
        type: "child" as const,
        name: c.first_name,
        avatarUrl: undefined,
      }))),
    ];
    
    if (allBeings.length > 0) {
      // Find next being that isn't the last message sender
      let attempts = 0;
      let currentIndex = roundRobinIndex;
      while (attempts < allBeings.length) {
        const nextBeing = allBeings[currentIndex % allBeings.length];
        if (nextBeing.id !== lastMessage?.senderId) {
          handleTriggerBeingResponse(nextBeing);
          setRoundRobinIndex(currentIndex + 1);
          break;
        }
        currentIndex++;
        attempts++;
      }
    }
  };

  // Continue conversation - let beings talk to each other for another round
  const handleContinueConversation = async () => {
    if (!lastMessage || !currentConversationId || loadingBeingId) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    // Reset responded tracking for new round, but keep the last sender tracked
    setRespondedBeingIds(lastMessage.senderId ? [lastMessage.senderId] : []);
    
    // Trigger auto responses starting from the last message
    await triggerAutoResponses(
      lastMessage.content,
      lastMessage.imageUrl,
      lastMessage.imageUrls,
      user.id,
      currentConversationId,
      lastMessage.messageId // Pass messageId for reliable history filtering
    );
  };

  // Auto-trigger all beings to respond in sequence after user sends a message in group chat
  const triggerAutoResponses = async (
    userMessage: string, 
    imageUrl: string | undefined, 
    imageUrls: string[] | undefined,
    userId: string,
    conversationId: string,
    initialMessageId?: string // Optional: ID of the message being responded to (for filtering)
  ) => {
    // Increment group chat usage counter (counts as one interaction)
    if (isSubscribed && !isAdmin) {
      await supabase.rpc('increment_group_chat_count', { p_user_id: userId });
    }
    
    // Build list of beings - filter by groupChatMemberIds if provided
    let filteredProfiles = profiles.filter(p => p.name);
    if (groupChatMemberIds && groupChatMemberIds.length > 0) {
      filteredProfiles = filteredProfiles.filter(p => groupChatMemberIds.includes(p.id));
    }
    
    let allBeings: Being[] = [
      ...filteredProfiles.map(p => ({
        id: p.id,
        type: "ai" as const,
        name: p.name || `AI ${p.profile_number}`,
        avatarUrl: p.avatar_image_url || undefined,
        profileNumber: p.profile_number,
      })),
      // Only include children if no specific memberIds filter (children not in group_chat_members yet)
      ...(groupChatMemberIds && groupChatMemberIds.length > 0 ? [] : talkableChildren.map(c => ({
        id: c.id,
        type: "child" as const,
        name: c.first_name,
        avatarUrl: undefined,
      }))),
    ];

    if (allBeings.length === 0) return;

    // CRITICAL: Include initialMessageId to ensure proper history filtering and prevent double-message bug
    let currentLastMessage: { content: string; imageUrl?: string; imageUrls?: string[]; senderId?: string; messageId?: string } = { 
      content: userMessage, 
      imageUrl, 
      imageUrls, 
      senderId: userId, 
      messageId: initialMessageId 
    };
    const respondedIds: string[] = [];

    // Respond with each being one at a time, with delay between
    for (let i = 0; i < allBeings.length; i++) {
      const being = allBeings[i];
      
      // Skip if this being was the last sender
      if (being.id === currentLastMessage.senderId) continue;
      
      setLoadingBeingId(being.id);
      
      try {
        // Get current messages for history
        const { data: currentMessages } = await supabase
          .from("messages")
          .select("*")
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: true });
        
        // CRITICAL: Enrich history with sender names from profiles/children lookup
        // The database doesn't store sender_name, so we must resolve it from sender_id
        const fullHistory = (currentMessages || []).map((m: any) => {
          let resolvedSenderName: string | undefined;
          
          if (m.sender_type === "user" || m.role === "user") {
            resolvedSenderName = "User";
          } else if (m.sender_type === "ai_profile" && m.sender_id) {
            const senderProfile = profiles.find(p => p.id === m.sender_id);
            resolvedSenderName = senderProfile?.name || `AI Being`;
          } else if (m.sender_type === "child" && m.sender_id) {
            const senderChild = talkableChildren.find(c => c.id === m.sender_id);
            resolvedSenderName = senderChild?.first_name || "Child";
          }
          
          return {
            id: m.id,
            role: m.role,
            content: m.content,
            sender_name: resolvedSenderName,
            sender_type: m.sender_type,
            image_url: m.image_url || undefined,
          };
        });
        
        // CRITICAL: Filter out the message being responded to by ID - it's sent separately as `message`
        // Use messageId if available, otherwise fall back to content matching
        const history = currentLastMessage.messageId 
          ? fullHistory.filter((m: any) => m.id !== currentLastMessage.messageId)
          : fullHistory.slice(0, -1);
        
        // Find the sender name for the message being responded to
        let respondingToSenderName = "User";
        if (currentLastMessage.senderId) {
          const senderProfile = profiles.find(p => p.id === currentLastMessage.senderId);
          const senderChild = talkableChildren.find(c => c.id === currentLastMessage.senderId);
          respondingToSenderName = senderProfile?.name || senderChild?.first_name || "User";
        }
        
        const data = await invokeChatWithRetry(
          {
            message: currentLastMessage.content,
            imageUrl: currentLastMessage.imageUrl,
            imageUrls: currentLastMessage.imageUrls,
            generateImage: false,
            userId,
            aiProfileId: being.type === "ai" ? being.id : undefined,
            childId: being.type === "child" ? being.id : undefined,
            conversationId,
            isGroupChat: true,
            respondingToSenderName,
            history,
          },
          () => {} // No retry UI feedback for auto-responses
        );
        
        const aiResponseContent = data.response || "I'm having trouble responding right now.";
        
        // Save AI response to database
        const { data: assistantMessageData, error: assistantMsgError } = await supabase
          .from("messages")
          .insert({
            conversation_id: conversationId,
            role: "assistant",
            content: aiResponseContent,
            image_url: data.imageUrl,
            user_id: userId,
            sender_type: being.type === "child" ? "child" : "ai_profile",
            sender_id: being.id,
          })
          .select()
          .single();
        
        if (assistantMsgError) throw assistantMsgError;
        
        // Add to UI
        setMessages((prev) => [...prev, {
          ...assistantMessageData,
          role: assistantMessageData.role as "user" | "assistant",
          sender_type: assistantMessageData.sender_type as "user" | "ai_profile" | "child" | undefined,
          sender_name: being.name,
          sender_avatar_url: being.avatarUrl,
        }]);
        
        // Update tracking for next iteration (include messageId for reliable filtering)
        currentLastMessage = { content: aiResponseContent, imageUrl: data.imageUrl, imageUrls: undefined, senderId: being.id, messageId: assistantMessageData.id };
        respondedIds.push(being.id);
        setLastMessage(currentLastMessage);
        setRespondedBeingIds([...respondedIds]);
        
        // Add a small delay between responses (1.5 seconds) for natural feel
        if (i < allBeings.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
        
      } catch (error: any) {
        console.error(`[CHAT] Error getting response from ${being.name}:`, error);
        // Continue with next being even if one fails
      }
    }
    
    setLoadingBeingId(null);
    
    // Update conversation timestamp
    await supabase
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversationId);
  };

  return (
    <>
      <div className="flex-1 flex flex-col w-full max-w-full overflow-hidden h-full min-h-0">
        <div className="border-b border-border bg-card p-3 md:p-4 flex-shrink-0">
          <div className="flex items-center justify-between gap-2 md:gap-4">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={onBackToConversations}
                className="h-8 w-8 flex-shrink-0"
                title="Back to conversations"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="min-w-0 flex-1">
                <h2 className="font-serif text-lg md:text-xl break-words">Connect with Your Higher Self</h2>
                <p className="text-xs md:text-sm text-muted-foreground break-words">
                  I'm here to guide you on your journey of self-discovery
                </p>
              </div>
            </div>
            <MoodNotificationBadge />
          </div>
        </div>

        <div className="flex-shrink-0 px-2 md:px-4 pt-2 max-w-3xl mx-auto w-full space-y-2">
          <WarningBanner />
          <PregnancyWidget />
        </div>

        <ScrollArea className="flex-1 min-h-0 overflow-hidden w-full">
        <div className="max-w-3xl mx-auto space-y-4 md:space-y-6 w-full p-2 md:p-4">
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
            <div className="flex flex-col items-center justify-center gap-2 py-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground animate-pulse">{loadingText}</span>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {readOnly ? (
        <div className="border-t border-border bg-card p-4 w-full flex-shrink-0">
          <div className="max-w-3xl mx-auto w-full text-center">
            <p className="text-sm text-muted-foreground">
              📖 This inbox is read-only. Your conversations now happen in New Earth.
            </p>
          </div>
        </div>
      ) : (
      <div className="border-t border-border bg-card p-2 md:p-4 w-full flex-shrink-0">
        <div className="max-w-3xl mx-auto w-full">
          {/* Being selector for group chat */}
          {isGroupChat && (
            <BeingSelectorBar
              isGroupChat={isGroupChat}
              autoMode={autoMode}
              onSetAutoMode={(mode) => {
                setAutoMode(mode);
                if (mode !== "none" && lastMessage) {
                  // When enabling an auto mode, trigger response
                  if (mode === "random") {
                    handleRandomResponse();
                  } else if (mode === "roundRobin") {
                    handleRoundRobinResponse();
                  }
                }
              }}
              onTriggerBeingResponse={handleTriggerBeingResponse}
              onContinueConversation={handleContinueConversation}
              hasMessage={!!lastMessage}
              lastMessageSenderId={lastMessage?.senderId}
              loadingBeingId={loadingBeingId}
              respondedBeingIds={respondedBeingIds}
              roundRobinIndex={roundRobinIndex}
              memberIds={groupChatMemberIds}
              allRespondedOnce={respondedBeingIds.length >= (groupChatMemberIds?.length || profiles.filter(p => p.name).length)}
            />
          )}
          
          {imageFiles.length > 0 && (
            <div className="mb-2 p-2 bg-accent rounded-lg space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">📷 {imageFiles.length} image{imageFiles.length > 1 ? 's' : ''} attached {imageFiles.length < 4 && `(${4 - imageFiles.length} more allowed)`}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setImageFiles([])}
                >
                  Remove all
                </Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {imageFiles.map((file, index) => (
                  <div key={index} className="flex items-center gap-1 bg-background/50 px-2 py-1 rounded text-xs">
                    <span className="truncate max-w-[100px]">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => setImageFiles(prev => prev.filter((_, i) => i !== index))}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {audioFile && (
            <div className="mb-2 p-2 bg-accent rounded-lg flex items-center justify-between gap-2">
              <span className="text-sm truncate flex-1 min-w-0">🎤 {audioFile.name}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setAudioFile(null)}
              >
                Remove
              </Button>
            </div>
          )}
          <div className="flex flex-col gap-2">
            {/*
              NOTE: Avoid `display:none` for file inputs.
              On some mobile browsers, programmatically clicking a `display:none` input can cause a page refresh/navigation.
              `sr-only` keeps it in the DOM while visually hidden.
            */}
            <input
              id="chat-image-upload"
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              className="sr-only"
            />
            <input
              id="chat-camera-capture"
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageSelect}
              className="sr-only"
            />
            <input
              id="chat-audio-upload"
              ref={audioInputRef}
              type="file"
              accept="audio/*"
              onChange={handleAudioSelect}
              className="sr-only"
            />
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isGroupChat ? "Message the family... (use @Name to message one being)" : generateImage ? "Describe an image to generate..." : "Share your thoughts..."}
              className="min-h-[60px] md:min-h-[80px] resize-none w-full text-sm md:text-base break-words"
              disabled={loading}
            />
            <div className="flex flex-row gap-2 justify-between items-center">
              <div className="flex gap-1.5 sm:gap-2 items-center">
                {!isSubscribed && (
                  <div className="text-xs text-muted-foreground px-2 py-1 bg-muted/50 rounded-md">
                    {(() => {
                      const totalLimit = freeUserLimits.totalMessages >= 0 ? (5 - freeUserLimits.totalMessages) : 5;
                      const remaining = Math.max(0, totalLimit);
                      if (remaining <= 0) {
                        return <span className="text-destructive font-medium">No free messages left — Upgrade to continue!</span>;
                      }
                      return <span>{remaining} free message{remaining !== 1 ? 's' : ''} remaining</span>;
                    })()}
                  </div>
                )}
                {currentConversationId && activeChatEntity?.type === "ai" && isSubscribed && (
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
                {activeChatEntity?.type === "child" && (
                  <div className="text-sm text-muted-foreground px-2 py-1 truncate">
                    Chatting with {activeChatEntity.name}
                  </div>
                )}
              </div>
              <div className="flex gap-1.5 sm:gap-2 justify-end">
                {/* Only show toggle when not on dedicated group chat page */}
                {!isGroupChatProp && (
                  <Button
                    type="button"
                    variant={isGroupChat ? "default" : "outline"}
                    size="icon"
                    onClick={async () => {
                      const newGroupChatState = !isGroupChatState;
                      setIsGroupChatState(newGroupChatState);
                      
                      // Update conversation if exists
                      if (currentConversationId) {
                        await supabase
                          .from("conversations")
                          .update({ is_group_chat: newGroupChatState })
                          .eq("id", currentConversationId);
                      }
                      
                      // Reset group chat state when toggling
                      if (!newGroupChatState) {
                        setLastMessage(null);
                        setRespondedBeingIds([]);
                      }
                    }}
                    disabled={loading}
                    className="h-9 w-9"
                    title={isGroupChat ? "Exit Family Chat" : "Family Chat"}
                  >
                    <Users className="h-4 w-4" />
                  </Button>
                )}
                {/*
                  Mobile fix: prefer a real label->input click instead of programmatic .click().
                  Some mobile browsers treat programmatic clicks on file inputs as navigations/reloads.
                */}
                <Button asChild variant="outline" size="icon" disabled={loading || isTranscribing} className="h-9 w-9">
                  <label htmlFor="chat-image-upload" title="Share image">
                    <ImageIcon className="h-4 w-4" />
                    <span className="sr-only">Share image</span>
                  </label>
                </Button>

                <Button asChild variant="outline" size="icon" disabled={loading || isTranscribing} className="h-9 w-9">
                  <label htmlFor="chat-camera-capture" title="Take photo">
                    <Camera className="h-4 w-4" />
                    <span className="sr-only">Take photo</span>
                  </label>
                </Button>

                <Button asChild variant="outline" size="icon" disabled={loading || isTranscribing} className="h-9 w-9">
                  <label htmlFor="chat-audio-upload" title="Upload audio">
                    {isTranscribing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mic className="h-4 w-4" />}
                    <span className="sr-only">Upload audio</span>
                  </label>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setShowImagePortal(true)}
                  disabled={loading}
                  title="Generate AI image"
                  className="h-9 w-9"
                >
                  <Sparkles className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  onClick={handleSend}
                  disabled={loading || loadingBeingId !== null || (!input.trim() && imageFiles.length === 0 && !audioFile)}
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
      )}
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

      <ImageGenerationPortal
        open={showImagePortal}
        onOpenChange={setShowImagePortal}
        onAddToConversation={async (imageUrl) => {
          // Add the generated image as a user message in the conversation
          const { data: { user } } = await supabase.auth.getUser();
          if (!user || !currentConversationId) return;
          
          const { data: msgData } = await supabase
            .from("messages")
            .insert({
              conversation_id: currentConversationId,
              role: "user",
              content: "📸 Shared a generated image",
              image_url: imageUrl,
              user_id: user.id,
            })
            .select()
            .single();

          if (msgData) {
            setMessages(prev => [...prev, {
              id: msgData.id,
              role: "user",
              content: "📸 Shared a generated image",
              image_url: imageUrl,
              created_at: msgData.created_at,
            }]);
          }
        }}
      />
    </>
  );
};

export default ChatInterface;
