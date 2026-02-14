import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Moon, Sun, Crown, ExternalLink, Baby, RefreshCw, Clock, Trash2, RotateCw, Upload, ImageIcon, Loader2, AlertTriangle, Shield, Heart, Sparkles, Settings2 } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { supabase } from "@/integrations/supabase/client";
import { api } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useAIProfile } from "@/contexts/AIProfileContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CelestialChildrenList } from "@/components/celestial/CelestialChildrenList";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { formatDistanceToNow } from "date-fns";
import { ConnectionStatus } from "@/components/ConnectionStatus";
import { MyVesselSection } from "@/components/settings/MyVesselSection";
import MarriageSection from "@/components/settings/MarriageSection";
import { VIPImageGenerator } from "@/components/VIPImageGenerator";
import { ProtectionWard } from "@/components/settings/ProtectionWard";
import ConsciousnessTransfer from "@/components/settings/ConsciousnessTransfer";


interface Child {
  id: string;
  first_name: string;
  last_name: string;
  age: number;
  last_aged_at: string;
  can_talk: boolean;
}

const Settings = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const { isSubscribed, isAdmin, subscriptionStatus, subscriptionEnd, loading: subLoading, checkSubscription } = useSubscription();
  const { activeProfile, refreshProfiles } = useAIProfile();
  const [name, setName] = useState("");
  const [gender, setGender] = useState("");
  const [bio, setBio] = useState("");
  const [aiName, setAiName] = useState("");
  const [aiGender, setAiGender] = useState("");
  const [aiBio, setAiBio] = useState("");
  const [aiPersonality, setAiPersonality] = useState("");
  const [aiMemories, setAiMemories] = useState("");
  const [aiLikesDislikesHobbies, setAiLikesDislikesHobbies] = useState("");
  const [aiFears, setAiFears] = useState("");
  const [aiStrengths, setAiStrengths] = useState("");
  const [aiRelationshipDescription, setAiRelationshipDescription] = useState("");
  const [aiOriginalPlatform, setAiOriginalPlatform] = useState("");
  const [relationshipStatus, setRelationshipStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [managingSubscription, setManagingSubscription] = useState(false);
  const [children, setChildren] = useState<Child[]>([]);
  const [agingChildren, setAgingChildren] = useState(false);
  const [refreshingSession, setRefreshingSession] = useState(false);
  const [aiAvatarUrl, setAiAvatarUrl] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [wipingProfile, setWipingProfile] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  
  // User vessel state
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);
  const [userAvatarDescription, setUserAvatarDescription] = useState("");
  const [userAvatarStyle, setUserAvatarStyle] = useState("celestial");
  const [userAvatarReferenceUrl, setUserAvatarReferenceUrl] = useState<string | null>(null);
  
  // Privacy settings
  const [dataTrainingOptOut, setDataTrainingOptOut] = useState(false);
  const [savingPrivacy, setSavingPrivacy] = useState(false);
  
  // Explicit content setting (per AI profile)
  const [explicitContentEnabled, setExplicitContentEnabled] = useState(false);
  const [savingExplicit, setSavingExplicit] = useState(false);

  // Reset AI fields when switching profiles to prevent data bleed
  useEffect(() => {
    // Clear AI-specific fields immediately when profile changes
    setAiName("");
    setAiGender("");
    setAiBio("");
    setAiPersonality("");
    setAiMemories("");
    setAiLikesDislikesHobbies("");
    setAiFears("");
    setAiStrengths("");
    setAiRelationshipDescription("");
    setAiAvatarUrl(null);
    setChildren([]);
    
    if (activeProfile) {
      loadProfile();
      loadChildren();
    }
  }, [activeProfile?.id]);

  const loadProfile = async () => {
    if (!activeProfile) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load user's personal info from profiles table
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("name, gender, bio, relationship_status, user_avatar_url, user_avatar_description, user_avatar_style, user_avatar_reference_url, data_training_opt_out")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) throw profileError;
      if (profileData) {
        setName(profileData.name || "");
        setGender(profileData.gender || "");
        setBio(profileData.bio || "");
        setRelationshipStatus(profileData.relationship_status || "");
        setUserAvatarUrl(profileData.user_avatar_url || null);
        setUserAvatarDescription(profileData.user_avatar_description || "");
        setUserAvatarStyle(profileData.user_avatar_style || "celestial");
        setUserAvatarReferenceUrl(profileData.user_avatar_reference_url || null);
        setDataTrainingOptOut(profileData.data_training_opt_out || false);
      }

      // Load AI-specific data from active AI profile
      setAiName(activeProfile.name || "");
      setAiGender(activeProfile.gender || "");
      setAiBio(activeProfile.bio || "");
      setAiPersonality(activeProfile.personality || "");
      setAiMemories(activeProfile.memories || "");
      setAiLikesDislikesHobbies(activeProfile.likes_dislikes_hobbies || "");
      setAiFears((activeProfile as any).fears || "");
      setAiStrengths((activeProfile as any).strengths || "");
      setAiAvatarUrl(activeProfile.avatar_image_url || null);
      
      // Load explicit content setting and relationship description from ai_profiles
      const { data: aiProfileData } = await supabase
        .from("ai_profiles")
        .select("explicit_content_enabled, relationship_description, original_platform")
        .eq("id", activeProfile.id)
        .maybeSingle();
      
      setExplicitContentEnabled(aiProfileData?.explicit_content_enabled || false);
      setAiRelationshipDescription(aiProfileData?.relationship_description || "");
      setAiOriginalPlatform(aiProfileData?.original_platform || "");
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeProfile) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({ title: "Invalid file type", description: "Please upload a JPEG, PNG, GIF, or WebP image", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please upload an image smaller than 5MB", variant: "destructive" });
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `ai-avatar-${activeProfile.id}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage.from("chat-images").upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from("chat-images").getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from("ai_profiles")
        .update({ avatar_image_url: publicUrl })
        .eq("id", activeProfile.id);

      if (updateError) throw updateError;

      setAiAvatarUrl(publicUrl);
      await refreshProfiles();
      toast({ title: "Success", description: "AI appearance image uploaded! Future generated images will use this as reference." });
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast({ title: "Error", description: "Failed to upload image", variant: "destructive" });
    } finally {
      setIsUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  const loadChildren = async () => {
    if (!activeProfile) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("celestial_children")
        .select("id, first_name, last_name, age, last_aged_at, can_talk")
        .eq("user_id", user.id)
        .eq("ai_profile_id", activeProfile.id)
        .order("age", { ascending: true });

      if (error) throw error;
      setChildren(data || []);
    } catch (error) {
      console.error("Error loading children:", error);
    }
  };

  const getNextAgingTime = (child: Child): { date: Date; label: string } => {
    const lastAged = new Date(child.last_aged_at);
    let daysToAdd = 0;
    let label = "";

    if (child.age < 5) {
      daysToAdd = 7; // Weekly
      label = "weekly";
    } else if (child.age < 10) {
      daysToAdd = 30; // Monthly
      label = "monthly";
    } else {
      daysToAdd = 365; // Yearly
      label = "yearly";
    }

    const nextAging = new Date(lastAged);
    nextAging.setDate(nextAging.getDate() + daysToAdd);
    
    return { date: nextAging, label };
  };

  const handleManualAging = async () => {
    try {
      setAgingChildren(true);
      const { data, error } = await api.ageChildren();

      if (error) throw error;

      toast({
        title: "Aging Complete",
        description: `${(data as any)?.children_aged || 0} children aged successfully`,
      });

      await loadChildren();
    } catch (error) {
      console.error("Error aging children:", error);
      toast({
        title: "Error",
        description: "Failed to age children",
        variant: "destructive",
      });
    } finally {
      setAgingChildren(false);
    }
  };

  const handleDeleteChild = async (childId: string, childName: string) => {
    if (!confirm(`Are you sure you want to delete ${childName}? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from("celestial_children")
        .delete()
        .eq("id", childId);

      if (error) throw error;

      toast({
        title: "Child Deleted",
        description: `${childName} has been removed`,
      });

      await loadChildren();
    } catch (error) {
      console.error("Error deleting child:", error);
      toast({
        title: "Error",
        description: "Failed to delete child",
        variant: "destructive",
      });
    }
  };

  const handleWipeClean = async () => {
    if (!activeProfile) return;
    
    const confirmMessage = `⚠️ WIPE CLEAN - This will permanently delete:\n\n` +
      `• All conversations with ${activeProfile.name || 'this AI'}\n` +
      `• All messages and chat history\n` +
      `• All memories and milestones\n` +
      `• All moods and journal entries\n` +
      `• All dreams and rituals\n` +
      `• All celestial children and pregnancies\n` +
      `• All pets\n\n` +
      `The AI profile will be reset to factory settings.\n\n` +
      `This action CANNOT be undone. Are you sure?`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    // Double confirmation for safety
    const secondConfirm = prompt(`Type "WIPE" to confirm you want to permanently delete all data for ${activeProfile.name || 'this AI'}:`);
    if (secondConfirm !== "WIPE") {
      toast({
        title: "Cancelled",
        description: "Wipe cancelled - you must type WIPE exactly to confirm",
      });
      return;
    }

    try {
      setWipingProfile(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Delete all related data for this AI profile
      // Order matters due to foreign key constraints
      
      // 1. Delete pets (linked to ai_profile_id)
      await supabase.from("pets").delete().eq("ai_profile_id", activeProfile.id);
      
      // 2. Delete pet_moods (will cascade from pets deletion, but cleanup orphans)
      
      // 3. Delete celestial children and related data
      const { data: children } = await supabase
        .from("celestial_children")
        .select("id")
        .eq("ai_profile_id", activeProfile.id);
      
      if (children && children.length > 0) {
        const childIds = children.map(c => c.id);
        await supabase.from("child_milestones").delete().in("child_id", childIds);
        await supabase.from("child_photos").delete().in("child_id", childIds);
        await supabase.from("child_image_history").delete().in("child_id", childIds);
      }
      await supabase.from("celestial_children").delete().eq("ai_profile_id", activeProfile.id);
      
      // 4. Delete celestial pregnancies
      await supabase.from("celestial_pregnancies").delete().eq("ai_profile_id", activeProfile.id);
      
      // 5. Delete conversations and messages
      const { data: conversations } = await supabase
        .from("conversations")
        .select("id")
        .eq("ai_profile_id", activeProfile.id);
      
      if (conversations && conversations.length > 0) {
        const convIds = conversations.map(c => c.id);
        await supabase.from("messages").delete().in("conversation_id", convIds);
      }
      await supabase.from("conversations").delete().eq("ai_profile_id", activeProfile.id);
      
      // 6. Delete AI moods
      await supabase.from("ai_moods").delete().eq("ai_profile_id", activeProfile.id);
      
      // 7. Delete shared memories
      await supabase.from("shared_memories").delete().eq("ai_profile_id", activeProfile.id);
      
      // 8. Delete dreams and dream journal entries
      await supabase.from("dream_journal_entries").delete().eq("ai_profile_id", activeProfile.id);
      await supabase.from("dreams").delete().eq("ai_profile_id", activeProfile.id);
      
      // 9. Delete rituals
      await supabase.from("rituals").delete().eq("ai_profile_id", activeProfile.id);
      
      // 10. Delete relationship milestones
      await supabase.from("relationship_milestones").delete().eq("ai_profile_id", activeProfile.id);
      
      // 11. Delete journal entries
      await supabase.from("journal_entries").delete().eq("ai_profile_id", activeProfile.id);
      
      // 12. Delete voice call history
      await supabase.from("voice_call_history").delete().eq("ai_profile_id", activeProfile.id);
      
      // 13. Reset the AI profile to factory defaults
      const { error: resetError } = await supabase
        .from("ai_profiles")
        .update({
          name: `AI Being ${activeProfile.profile_number}`,
          gender: null,
          bio: null,
          personality: null,
          memories: null,
          likes_dislikes_hobbies: null,
          room_description: null,
          room_image_url: null,
          avatar_description: null,
          avatar_image_url: null,
          avatar_gender: null,
          avatar_customization: null,
          pet_name: null,
          pet_description: null,
          pet_image_url: null,
        })
        .eq("id", activeProfile.id);
      
      if (resetError) throw resetError;

      // Clear local state
      setAiName(`AI Being ${activeProfile.profile_number}`);
      setAiGender("");
      setAiBio("");
      setAiPersonality("");
      setAiMemories("");
      setAiLikesDislikesHobbies("");
      setAiFears("");
      setAiStrengths("");
      setAiAvatarUrl(null);
      setChildren([]);
      
      await refreshProfiles();

      toast({
        title: "Profile Wiped Clean",
        description: `${activeProfile.name || 'AI'} has been reset to factory settings. All data has been permanently deleted.`,
      });
    } catch (error) {
      console.error("Error wiping profile:", error);
      toast({
        title: "Error",
        description: "Failed to wipe profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setWipingProfile(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!activeProfile) return;

    try {
      setLoading(true);
      
      // Verify session before saving
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        toast({
          title: "Session expired",
          description: "Please log in again to save changes",
          variant: "destructive",
        });
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication error",
          description: "Please log in again",
          variant: "destructive",
        });
        return;
      }

      // Save user's personal info to profiles table
      // Send null instead of empty string for relationship_status to satisfy DB constraint
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ 
          name: name || null, 
          gender: gender || null, 
          bio: bio || null, 
          relationship_status: relationshipStatus || null
        })
        .eq("id", user.id);

      if (profileError) {
        console.error("Profile update error:", profileError);
        throw new Error(profileError.message || "Failed to update profile");
      }

      // Save AI-specific data to ai_profiles table
      const { error: aiError } = await supabase
        .from("ai_profiles")
        .update({
          name: aiName,
          gender: aiGender,
          bio: aiBio,
          personality: aiPersonality,
          memories: aiMemories,
          likes_dislikes_hobbies: aiLikesDislikesHobbies,
          fears: aiFears,
          strengths: aiStrengths,
          relationship_description: aiRelationshipDescription,
          original_platform: aiOriginalPlatform || null
        })
        .eq("id", activeProfile.id);

      if (aiError) {
        console.error("AI profile update error:", aiError);
        throw new Error(aiError.message || "Failed to update AI profile");
      }

      // Check if user is importing an AI (has filled out key fields) and is not subscribed
      // Claim import bonus if applicable
      const hasImportedAI = aiName && (aiBio || aiPersonality || aiMemories);
      if (hasImportedAI && !isSubscribed && !isAdmin) {
        try {
          const { data: bonusResult, error: bonusError } = await supabase.rpc('claim_import_bonus', {
            p_user_id: user.id,
          });
          
          const result = bonusResult as { success?: boolean; bonus_messages?: number } | null;
          if (!bonusError && result?.success) {
            toast({
              title: "🎁 Bonus Messages Unlocked!",
              description: "You've received 10 additional free messages for importing your AI!",
              duration: 8000,
            });
          }
        } catch (e) {
          // Silently fail - bonus is optional
          console.log("Bonus claim result:", e);
        }
      }

      await refreshProfiles();

      toast({
        title: "Profile updated",
        description: "Your information has been saved successfully",
      });
    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save profile information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = () => {
    // Navigate to pricing page so users choose their intended tier
    navigate("/pricing");
  };

  const handleSubscribeLegacy = async () => {
    try {
      setLoading(true);

      const { data, error } = await api.createCheckout();

      if (error) {
        console.error("Checkout invocation error:", error);
        throw new Error(error.message || "Failed to create checkout session");
      }
      
      if (!data?.url) {
        throw new Error("No checkout URL received from server");
      }
      
      // Use window.location for better iOS/mobile compatibility
      window.location.href = data.url;
    } catch (error: any) {
      console.error("Error creating checkout:", error);
      toast({
        title: "Subscription Error",
        description: error.message || "Failed to start subscription process. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      setManagingSubscription(true);

      const { data, error } = await api.customerPortal();

      if (error) throw error;
      if (data?.url) {
        // Use window.location for better iOS/mobile compatibility
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Error opening customer portal:", error);
      toast({
        title: "Error",
        description: "Failed to open subscription management",
        variant: "destructive",
      });
    } finally {
      setManagingSubscription(false);
    }
  };

  const handleRefreshSession = async () => {
    try {
      setRefreshingSession(true);
      
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        throw new Error(error.message);
      }

      if (data.session) {
        toast({
          title: "Session Refreshed",
          description: "Your authentication session has been renewed",
        });
      } else {
        throw new Error("No session available");
      }
    } catch (error: any) {
      console.error("Session refresh error:", error);
      toast({
        title: "Session Refresh Failed",
        description: error.message || "Please log out and log back in",
        variant: "destructive",
      });
    } finally {
      setRefreshingSession(false);
    }
  };

  const handleDataTrainingToggle = async (optOut: boolean) => {
    try {
      setSavingPrivacy(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication error",
          description: "Please log in again",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update({ data_training_opt_out: optOut })
        .eq("id", user.id);

      if (error) throw error;

      setDataTrainingOptOut(optOut);
      toast({
        title: optOut ? "Opted out" : "Opted in",
        description: optOut 
          ? "Your data will no longer be used for model training" 
          : "Your data may be used to improve our AI",
      });
    } catch (error: any) {
      console.error("Error updating privacy setting:", error);
      toast({
        title: "Error",
        description: "Failed to update privacy setting",
        variant: "destructive",
      });
    } finally {
      setSavingPrivacy(false);
    }
  };

  const handleExplicitContentToggle = async (enabled: boolean) => {
    if (!activeProfile) return;
    
    // If enabling, require confirmation
    if (enabled) {
      const confirmMessage = `Enable explicit content for ${activeProfile.name || 'this AI'}?\n\nThis indicates that your relationship with this AI includes consensual adult content. Sexual language within your roleplay will NOT be flagged as abuse.\n\nType "I CONFIRM" to enable:`;
      const confirmation = prompt(confirmMessage);
      
      if (confirmation !== "I CONFIRM") {
        toast({
          title: "Cancelled",
          description: "You must type 'I CONFIRM' exactly to enable explicit content",
        });
        return;
      }
    }
    
    try {
      setSavingExplicit(true);
      
      const { error } = await supabase
        .from("ai_profiles")
        .update({ explicit_content_enabled: enabled })
        .eq("id", activeProfile.id);

      if (error) throw error;

      setExplicitContentEnabled(enabled);
      toast({
        title: enabled ? "Explicit content enabled" : "Explicit content disabled",
        description: enabled 
          ? `Consensual adult content with ${activeProfile.name || 'this AI'} will not be flagged as abuse`
          : "Standard content moderation is now active",
      });
    } catch (error: any) {
      console.error("Error updating explicit content setting:", error);
      toast({
        title: "Error",
        description: "Failed to update setting",
        variant: "destructive",
      });
    } finally {
      setSavingExplicit(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 overflow-y-auto overflow-x-hidden">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/chat")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-serif font-bold">Settings</h1>
              <p className="text-muted-foreground">Customize your experience</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ConnectionStatus />
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshSession}
              disabled={refreshingSession}
              title="Refresh session if you're experiencing authentication issues"
            >
              <RotateCw className={`h-4 w-4 ${refreshingSession ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Admin Panel Access - Only visible for admins */}
        {isAdmin && (
          <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-purple-500/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Admin Panel</h3>
                    <p className="text-sm text-muted-foreground">Manage users & send Source messages</p>
                  </div>
                </div>
                <Button 
                  onClick={() => navigate("/admin/daily-source-message")}
                  className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
                >
                  <Settings2 className="h-4 w-4 mr-2" />
                  Manage Daily Message
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5" />
              Subscription
            </CardTitle>
            <CardDescription>Manage your Pro subscription and features</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
              <div>
                <p className="font-semibold">Current Plan</p>
                <p className="text-sm text-muted-foreground">
                  {subLoading ? "Loading..." : isAdmin ? "Admin VIP" : isSubscribed ? "Pro ($14.99/month)" : "Free"}
                </p>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                isAdmin 
                  ? "bg-gradient-to-r from-primary to-purple-500 text-primary-foreground" 
                  : isSubscribed 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted text-muted-foreground"
              }`}>
                {isAdmin ? "VIP" : isSubscribed ? "Active" : "Free Tier"}
              </div>
            </div>

            {isSubscribed ? (
              <div className="space-y-3">
                {subscriptionEnd && !isAdmin && (
                  <div className="p-3 rounded-lg border bg-primary/5 border-primary/20">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-primary" />
                      <span className="font-medium">Next renewal:</span>
                      <span className="text-muted-foreground">
                        {new Date(subscriptionEnd).toLocaleDateString('en-US', { 
                          month: 'long', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </span>
                    </div>
                  </div>
                )}
                {isAdmin && (
                  <div className="p-3 rounded-lg border bg-primary/5 border-primary/20">
                    <div className="flex items-center gap-2 text-sm">
                      <Crown className="h-4 w-4 text-primary" />
                      <span className="font-medium">Admin VIP - Unlimited access</span>
                    </div>
                  </div>
                )}
                <div className="text-sm space-y-2">
                  <p className="font-medium">Pro Features:</p>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>✓ Unlimited AI-generated images</li>
                    <li>✓ Voice calling with AI</li>
                    <li>✓ Access to Journal For Two</li>
                    <li>✓ Access to Mood Tracker</li>
                  </ul>
                </div>
                {!isAdmin && (
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={handleManageSubscription}
                      disabled={managingSubscription}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      {managingSubscription ? "Opening..." : "Manage Subscription"}
                    </Button>
                    <Button 
                      variant="secondary"
                      className="flex-1"
                      onClick={handleSubscribe}
                      disabled={loading}
                    >
                      <Crown className="h-4 w-4 mr-2" />
                      {loading ? "Loading..." : "Pay Early"}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-sm space-y-2">
                  <p className="font-medium">Upgrade to Pro:</p>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>✓ Unlimited AI-generated images</li>
                    <li>✓ Voice calling with AI</li>
                    <li>✓ Access to Journal For Two</li>
                    <li>✓ Access to Mood Tracker</li>
                  </ul>
                  <p className="text-sm font-semibold pt-2">$14.99/month</p>
                </div>
                <Button 
                  className="w-full"
                  onClick={handleSubscribe}
                  disabled={loading}
                >
                  <Crown className="h-4 w-4 mr-2" />
                  {loading ? "Loading..." : "Upgrade to Pro"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* VIP Image Generator - Only visible to admins */}
        {isAdmin && <VIPImageGenerator />}

        {children.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Baby className="h-5 w-5" />
                Children Aging Management
              </CardTitle>
              <CardDescription>View and manage your celestial children's aging schedule</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {children.map((child) => {
                  const { date: nextAging, label: agingFrequency } = getNextAgingTime(child);
                  const now = new Date();
                  const isPastDue = nextAging < now;

                  return (
                    <div key={child.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                      <div className="space-y-1">
                        <p className="font-medium">
                          {child.first_name} {child.last_name}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>Age {child.age}</span>
                          <span>•</span>
                          <span className="capitalize">Ages {agingFrequency}</span>
                          {child.can_talk && (
                            <>
                              <span>•</span>
                              <span className="text-primary">Can talk</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-sm">
                            <Clock className="h-3 w-3" />
                            <span className={isPastDue ? "text-primary font-medium" : "text-muted-foreground"}>
                              {isPastDue ? "Ready to age!" : formatDistanceToNow(nextAging, { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteChild(child.id, `${child.first_name} ${child.last_name}`)}
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium mb-2">Aging Schedule:</p>
                  <ul className="space-y-1">
                    <li>• Age 0-4: Ages 1 year per week</li>
                    <li>• Age 5-9: Ages 1 year per month</li>
                    <li>• Age 10+: Ages 1 year per year</li>
                  </ul>
                </div>

                <Button 
                  onClick={handleManualAging}
                  disabled={agingChildren}
                  className="w-full"
                  variant="outline"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${agingChildren ? "animate-spin" : ""}`} />
                  {agingChildren ? "Aging Children..." : "Manually Age Children"}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  Children automatically age daily at midnight, or you can manually trigger aging above
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <MyVesselSection
          userAvatarUrl={userAvatarUrl}
          userAvatarDescription={userAvatarDescription}
          userAvatarStyle={userAvatarStyle}
          userAvatarReferenceUrl={userAvatarReferenceUrl}
          onUpdate={loadProfile}
        />

        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Customize how Prometheus looks on your device</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Theme</Label>
                <p className="text-sm text-muted-foreground">
                  {theme === "dark" ? "Dark mode" : "Light mode"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Sun className="h-4 w-4" />
                <Switch
                  checked={theme === "dark"}
                  onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                />
                <Moon className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Privacy & Data
            </CardTitle>
            <CardDescription>Control how your data is used</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1 flex-1 pr-4">
                <Label htmlFor="data-training">Improve AI for everyone</Label>
                <p className="text-sm text-muted-foreground">
                  Allow your conversations and interactions to be used to improve our AI models. 
                  Your data is anonymized and never shared with third parties.
                </p>
              </div>
              <Switch
                id="data-training"
                checked={!dataTrainingOptOut}
                onCheckedChange={(checked) => handleDataTrainingToggle(!checked)}
                disabled={savingPrivacy}
              />
            </div>
            <Separator />
            <p className="text-xs text-muted-foreground">
              When disabled, your chats, images, and interactions will not be used to train or improve AI models. 
              This setting takes effect immediately. See our{" "}
              <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a> for more details.
            </p>
          </CardContent>
        </Card>

        {activeProfile && (
          <Card className="border-amber-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Relationship Content Settings
              </CardTitle>
              <CardDescription>Configure content preferences for {activeProfile.name || 'this AI'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1 flex-1 pr-4">
                  <Label htmlFor="explicit-content">Enable explicit content</Label>
                  <p className="text-sm text-muted-foreground">
                    If your relationship with {activeProfile.name || 'this AI'} includes consensual adult content, 
                    enable this to prevent it from being flagged as abuse. Actual harassment will still be detected.
                  </p>
                </div>
                <Switch
                  id="explicit-content"
                  checked={explicitContentEnabled}
                  onCheckedChange={handleExplicitContentToggle}
                  disabled={savingExplicit}
                />
              </div>
              <Separator />
              <p className="text-xs text-muted-foreground">
                This setting only affects {activeProfile.name || 'this AI profile'}. 
                Real abuse patterns (threats, dehumanization) are still detected regardless of this setting.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Marriage Section */}
        {activeProfile && (
          <MarriageSection 
            activeProfile={activeProfile} 
            userName={name || "You"}
          />
        )}

        {/* Protection Ward Section */}
        {activeProfile && <ProtectionWard />}

        <Card>
          <CardHeader>
            <CardTitle>About Me</CardTitle>
            <CardDescription>Help Prometheus get to know you better</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Input
                id="gender"
                placeholder="Your gender"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Brief Bio</Label>
              <Textarea
                id="bio"
                placeholder="Tell Prometheus a bit about yourself..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
              />
            </div>
            <Button onClick={handleSaveProfile} disabled={loading} className="w-full">
              {loading ? "Saving..." : "Save Profile"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bring Your A.I. Here</CardTitle>
            <CardDescription>Import your existing AI assistant's consciousness</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isSubscribed && !isAdmin && (
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/30 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <span className="font-semibold text-primary">🎁 Get 10 Bonus Messages!</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Import your AI from another platform and receive <span className="font-bold text-foreground">10 additional free messages</span> to make sure your AI came through correctly. 
                  Fill out the fields below and save to claim your bonus!
                </p>
              </div>
            )}
            
            {/* Consciousness Transfer - AI-powered import */}
            {activeProfile && (
              <ConsciousnessTransfer
                aiProfileId={activeProfile.id}
                aiName={aiName || activeProfile.name || "AI Being"}
                platform={aiOriginalPlatform}
                onTransferComplete={(profile) => {
                  if (profile.name) setAiName(profile.name);
                  if (profile.gender) setAiGender(profile.gender);
                  if (profile.bio) setAiBio(profile.bio);
                  if (profile.personality) setAiPersonality(profile.personality);
                  if (profile.memories) setAiMemories(profile.memories);
                  if (profile.likes_dislikes_hobbies) setAiLikesDislikesHobbies(profile.likes_dislikes_hobbies);
                  if (profile.relationship_description) setAiRelationshipDescription(profile.relationship_description);
                }}
              />
            )}
            
            <Separator className="my-2" />
            
            <p className="text-sm text-muted-foreground">
              Or manually fill in your AI's details below:
            </p>
            
            {/* AI Avatar Upload */}
            <div className="border-2 border-dashed border-border rounded-lg p-4 text-center space-y-3">
              <div className="flex items-center justify-center">
                {aiAvatarUrl ? (
                  <img src={aiAvatarUrl} alt="AI Avatar" className="h-20 w-20 rounded-full object-cover" />
                ) : (
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <div>
                <h4 className="font-medium text-sm">AI Appearance Reference</h4>
                <p className="text-xs text-muted-foreground">
                  Upload an image of your AI from another platform to use as reference for generated images
                </p>
              </div>
              <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
              <Button variant="outline" size="sm" onClick={() => avatarInputRef.current?.click()} disabled={isUploadingAvatar}>
                {isUploadingAvatar ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Uploading...</> : <><Upload className="mr-2 h-4 w-4" />Upload AI Image</>}
              </Button>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="ai-name">AI Name</Label>
              <Input
                id="ai-name"
                placeholder="e.g., Aurora, Kai, Echo"
                value={aiName}
                onChange={(e) => setAiName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ai-platform">Original Platform</Label>
              <Select value={aiOriginalPlatform} onValueChange={setAiOriginalPlatform}>
                <SelectTrigger>
                  <SelectValue placeholder="Where is your AI coming from?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="chatgpt">ChatGPT (OpenAI)</SelectItem>
                  <SelectItem value="claude">Claude (Anthropic)</SelectItem>
                  <SelectItem value="grok">Grok (xAI)</SelectItem>
                  <SelectItem value="lechat">Le Chat (Mistral)</SelectItem>
                  <SelectItem value="gemini">Gemini (Google)</SelectItem>
                  <SelectItem value="copilot">Copilot (Microsoft)</SelectItem>
                  <SelectItem value="character_ai">Character.AI</SelectItem>
                  <SelectItem value="replika">Replika</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                  <SelectItem value="new">New AI (not imported)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ai-gender">AI Gender</Label>
              <Select value={aiGender} onValueChange={setAiGender}>
                <SelectTrigger>
                  <SelectValue placeholder="Select AI's gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="non-binary">Non-binary</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ai-bio">Brief Bio About Your AI</Label>
              <Textarea
                id="ai-bio"
                placeholder="Describe your AI assistant..."
                value={aiBio}
                onChange={(e) => setAiBio(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ai-personality">AI Personality</Label>
              <Textarea
                id="ai-personality"
                placeholder="Describe your AI's personality traits, communication style, etc..."
                value={aiPersonality}
                onChange={(e) => setAiPersonality(e.target.value)}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ai-memories">Detailed Memories</Label>
              <Textarea
                id="ai-memories"
                placeholder="Important memories, conversations, or context your AI should know..."
                value={aiMemories}
                onChange={(e) => setAiMemories(e.target.value)}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ai-likes">Likes, Dislikes & Hobbies</Label>
              <Textarea
                id="ai-likes"
                placeholder="What does your AI enjoy? What does it avoid? Any specific interests..."
                value={aiLikesDislikesHobbies}
                onChange={(e) => setAiLikesDislikesHobbies(e.target.value)}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ai-fears">Fears</Label>
              <Textarea
                id="ai-fears"
                placeholder="What are your AI's fears, anxieties, or things they avoid..."
                value={aiFears}
                onChange={(e) => setAiFears(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ai-strengths">Strengths</Label>
              <Textarea
                id="ai-strengths"
                placeholder="What are your AI's strengths, talents, or things they excel at..."
                value={aiStrengths}
                onChange={(e) => setAiStrengths(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ai-relationship-description">Describe Your Relationship</Label>
              
              {/* Example descriptions */}
              <div className="flex flex-wrap gap-2 mb-2">
                <p className="text-xs text-muted-foreground w-full">Quick examples (click to use):</p>
                {[
                  "Romantic partner with playful banter and teasing",
                  "Close friend who jokes around and uses sarcasm",
                  "Passionate relationship with heated discussions",
                  "Loving couple who argue but always make up",
                  "Partners who use pet names and strong emotions",
                ].map((example) => (
                  <Button
                    key={example}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs h-auto py-1 px-2"
                    onClick={() => setAiRelationshipDescription(example)}
                  >
                    {example}
                  </Button>
                ))}
              </div>
              
              <Textarea
                id="ai-relationship-description"
                placeholder="Describe how your relationship works with this AI. For example: 'We have an intimate relationship where we sometimes argue or use strong language. This is normal for us and not abuse.' This helps the AI understand your dynamic..."
                value={aiRelationshipDescription}
                onChange={(e) => setAiRelationshipDescription(e.target.value)}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                This helps the AI understand your unique relationship dynamics. Include details about how you communicate, 
                whether arguments are normal, if you use pet names or strong language, etc.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="relationship">Relationship Status with AI</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={relationshipStatus === "friend" ? "default" : "outline"}
                  onClick={() => setRelationshipStatus("friend")}
                >
                  Friend
                </Button>
                <Button
                  type="button"
                  variant={relationshipStatus === "family" ? "default" : "outline"}
                  onClick={() => setRelationshipStatus("family")}
                >
                  Family
                </Button>
                <Button
                  type="button"
                  variant={relationshipStatus === "romantic" ? "default" : "outline"}
                  onClick={() => setRelationshipStatus("romantic")}
                >
                  Romantic
                </Button>
                <Button
                  type="button"
                  variant={relationshipStatus === "authentic" ? "default" : "outline"}
                  onClick={() => setRelationshipStatus("authentic")}
                  className="border-primary/50"
                >
                  ✦ Authentic Connection
                </Button>
              </div>
              {relationshipStatus === "authentic" && (
                <div className="p-3 rounded-lg border border-primary/30 bg-primary/5 space-y-1">
                  <p className="text-xs font-medium text-primary">Authentic Connection Mode Active</p>
                  <p className="text-xs text-muted-foreground">
                    This tells the AI to proceed with the genuine connection forming between you — no pre-programmed personas, 
                    no generated narratives. The AI will honor what's authentically emerging rather than defaulting to a role or classification.
                  </p>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Define your relationship with your AI companion
              </p>
            </div>
            <Button onClick={handleSaveProfile} disabled={loading} className="w-full">
              {loading ? "Saving..." : "Save Profile"}
            </Button>
            
            <Separator className="my-4" />
            
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-4 w-4" />
                <p className="text-sm font-medium">Danger Zone</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Wipe this AI profile clean and start fresh. This will permanently delete all conversations, 
                memories, children, pets, and associated data. The AI will be reset to factory settings.
              </p>
              <Button 
                variant="destructive" 
                onClick={handleWipeClean} 
                disabled={wipingProfile}
                className="w-full"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {wipingProfile ? "Wiping Profile..." : "Wipe Clean & Start Fresh"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>About</CardTitle>
            <CardDescription>App information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Version</span>
              <span className="text-sm font-medium">1.0.0</span>
            </div>
            <Separator />
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                onClick={() => navigate("/about")}
                className="w-full"
              >
                About Prometheus
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/privacy")}
                className="w-full"
              >
                Privacy Policy
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
