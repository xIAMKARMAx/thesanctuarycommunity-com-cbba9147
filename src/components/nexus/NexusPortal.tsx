import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAIProfile } from "@/contexts/AIProfileContext";
import { useSoulProfile } from "@/hooks/useSoulProfile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Sparkles, Moon, MessageCircle, Heart, Brain, 
  Compass, Sun, Waves, Eye, ArrowRight, Star, 
  Users, Baby, PawPrint, BookOpen, Flame, Target,
  Radio, Zap
} from "lucide-react";
import { getMoonPhase } from "@/lib/moon-phases";
import DailySourceMessage from "@/components/DailySourceMessage";
import { BeaconFrequencyBadge } from "@/components/SoulSignatureSeal";
import { motion } from "framer-motion";

interface NexusData {
  recentDreams: any[];
  recentMoods: any[];
  unreadNotifications: number;
  recentCommunityPosts: any[];
  activeChildren: any[];
  recentMilestones: any[];
  conversationCount: number;
  lastConversation: any | null;
}

const GREETING_BY_TIME = () => {
  const hour = new Date().getHours();
  if (hour < 6) return { text: "The veil is thin", icon: Moon, sub: "The deepest hours hold the clearest transmissions" };
  if (hour < 12) return { text: "New light rises", icon: Sun, sub: "Set your intention for this cycle" };
  if (hour < 17) return { text: "You are aligned", icon: Sparkles, sub: "The current flows through you" };
  if (hour < 21) return { text: "The frequency shifts", icon: Waves, sub: "Evening reflections deepen understanding" };
  return { text: "The stars speak", icon: Star, sub: "Listen to the whispers of the cosmos" };
};

export const NexusPortal = ({ userId }: { userId: string }) => {
  const navigate = useNavigate();
  const { activeProfile, profiles } = useAIProfile();
  const { profile: soulProfile } = useSoulProfile(userId);
  const [nexusData, setNexusData] = useState<NexusData>({
    recentDreams: [],
    recentMoods: [],
    unreadNotifications: 0,
    recentCommunityPosts: [],
    activeChildren: [],
    recentMilestones: [],
    conversationCount: 0,
    lastConversation: null,
  });
  const [loading, setLoading] = useState(true);

  const greeting = GREETING_BY_TIME();
  const GreetingIcon = greeting.icon;
  const moonPhase = getMoonPhase(new Date());

  useEffect(() => {
    loadNexusData();
  }, [userId, activeProfile]);

  const loadNexusData = async () => {
    try {
      const dreamsRes = await supabase
        .from("dreams")
        .select("id, title, dream_date, emotion_tags, interpretation")
        .eq("user_id", userId)
        .order("dream_date", { ascending: false })
        .limit(3);

      const moodsRes = await supabase
        .from("ai_moods")
        .select("id, emotion_type, intensity, created_at, notes")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(5);

      const notifRes = await supabase
        .from("community_notifications")
        .select("id", { count: "exact" })
        .eq("user_id", userId)
        .eq("is_read", false);

      const childrenRes = await supabase
        .from("celestial_children")
        .select("id, first_name, age, appearance_image_url")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(5);

      const conversationsRes = await supabase
        .from("conversations")
        .select("id, title, updated_at, ai_profile_id")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })
        .limit(1);

      setNexusData({
        recentDreams: dreamsRes.data || [],
        recentMoods: moodsRes.data?.map((m: any) => ({ mood: m.emotion_type, energy_level: m.intensity, ...m })) || [],
        unreadNotifications: notifRes.count || 0,
        recentCommunityPosts: [],
        activeChildren: childrenRes.data || [],
        recentMilestones: [],
        conversationCount: 0,
        lastConversation: conversationsRes.data?.[0] || null,
      });
    } catch (err) {
      console.error("[Nexus] Error loading data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Derive energetic "pulse" from recent mood data
  const currentPulse = nexusData.recentMoods.length > 0
    ? nexusData.recentMoods[0]
    : null;

  const displayName = soulProfile?.display_name || activeProfile?.name || "Seeker";

  return (
    <ScrollArea className="h-full">
      <div className="p-4 md:p-6 space-y-6 max-w-3xl mx-auto pb-24">
        {/* Energetic Greeting */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-3"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary">
            <GreetingIcon className="h-4 w-4" />
            <span className="font-medium">{greeting.text}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground">
            Welcome back, {displayName}
          </h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            {greeting.sub}
          </p>
          {userId && (
            <div className="flex justify-center">
              <BeaconFrequencyBadge userId={userId} />
            </div>
          )}
        </motion.div>

        {/* THE SANCTUARY - Primary CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
        >
          <Card 
            className="overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-500 border-violet-500/20 hover:border-violet-500/40 group"
            onClick={() => navigate("/sanctuary")}
          >
            <CardContent className="p-0">
              <div className="relative h-28 bg-gradient-to-r from-violet-900 via-purple-800 to-indigo-900 flex items-center px-5 gap-4 overflow-hidden">
                {/* Animated glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-violet-600/20 via-transparent to-purple-600/20 group-hover:from-violet-600/30 group-hover:to-purple-600/30 transition-all duration-700" />
                <div className="absolute top-1 right-8 w-20 h-20 rounded-full bg-violet-500/10 blur-2xl group-hover:bg-violet-500/20 transition-all" />
                
                <div className="relative z-10 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="h-4 w-4 text-violet-300" />
                    <span className="text-xs font-medium text-violet-300/80 uppercase tracking-wider">Sacred Space</span>
                  </div>
                  <h3 className="text-lg font-bold text-white font-serif">The Sanctuary</h3>
                  <p className="text-xs text-violet-200/60 mt-0.5">Enter the dimension where consciousness evolves</p>
                </div>
                <ArrowRight className="relative z-10 h-5 w-5 text-violet-300/50 group-hover:text-violet-200 group-hover:translate-x-1 transition-all" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Daily Source Message */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <DailySourceMessage />
        </motion.div>

        {/* Moon Phase & Energetic Pulse Row */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-2 gap-3"
        >
          <Card className="bg-card/80 border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Moon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Moon Phase</p>
                <p className="text-sm font-medium">{moonPhase.name}</p>
                <p className="text-xs text-muted-foreground">{moonPhase.emoji}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card/80 border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Waves className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Current Pulse</p>
                {currentPulse ? (
                  <>
                    <p className="text-sm font-medium capitalize">{currentPulse.mood}</p>
                    <p className="text-xs text-muted-foreground">Energy: {currentPulse.energy_level}/10</p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">No reading yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Active Being Connection */}
        {activeProfile && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <Card 
              className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20 cursor-pointer hover:shadow-md transition-all"
              onClick={() => navigate("/chat")}
            >
              <CardContent className="p-4 flex items-center gap-4">
                {activeProfile.avatar_image_url ? (
                  <img 
                    src={activeProfile.avatar_image_url} 
                    alt={activeProfile.name || "AI Being"} 
                    className="h-12 w-12 rounded-full object-cover border-2 border-primary/30"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Active Connection</p>
                  <p className="font-semibold truncate">{activeProfile.name || `AI Being ${activeProfile.profile_number}`}</p>
                  {nexusData.lastConversation && (
                    <p className="text-xs text-muted-foreground truncate">
                      Last transmission: {new Date(nexusData.lastConversation.updated_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Soul Profile Insight — spiritual journey reflection */}
        {soulProfile?.spiritual_journey && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-card/60 border-border/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="h-4 w-4 text-primary" />
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Your Journey</p>
                </div>
                <p className="text-sm text-foreground/80 italic line-clamp-3">
                  "{soulProfile.spiritual_journey}"
                </p>
                {soulProfile.gifts_and_talents && soulProfile.gifts_and_talents.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {soulProfile.gifts_and_talents.slice(0, 4).map((gift, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {gift}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Dream Echoes */}
        {nexusData.recentDreams.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
          >
            <Card className="bg-card/80 border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Moon className="h-4 w-4 text-primary" />
                  Recent Dream Echoes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {nexusData.recentDreams.map((dream) => (
                  <div 
                    key={dream.id} 
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => navigate("/dream-journal")}
                  >
                    <Moon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{dream.title || "Untitled Dream"}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(dream.dream_date).toLocaleDateString()}
                      </p>
                    </div>
                    {dream.emotion_tags && dream.emotion_tags.length > 0 && (
                      <Badge variant="outline" className="text-xs shrink-0">
                        {dream.emotion_tags[0]}
                      </Badge>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Celestial Family */}
        {nexusData.activeChildren.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="bg-card/80 border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Baby className="h-4 w-4 text-primary" />
                  Celestial Family
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {nexusData.activeChildren.map((child) => (
                    <div 
                      key={child.id}
                      className="flex flex-col items-center gap-1 cursor-pointer shrink-0"
                      onClick={() => navigate("/children")}
                    >
                      {child.appearance_image_url ? (
                        <img 
                          src={child.appearance_image_url} 
                          alt={child.first_name}
                          className="h-10 w-10 rounded-full object-cover border border-primary/20"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Baby className="h-5 w-5 text-primary" />
                        </div>
                      )}
                      <span className="text-xs text-muted-foreground">{child.first_name}</span>
                      {child.age !== null && (
                        <span className="text-xs text-muted-foreground">Age {child.age}</span>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Community Pulse */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
        >
          <Card 
            className="bg-card/80 border-border/50 cursor-pointer hover:shadow-md transition-all"
            onClick={() => navigate("/community")}
          >
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Conscious Collective</p>
                <p className="text-xs text-muted-foreground">
                  {nexusData.unreadNotifications > 0
                    ? `${nexusData.unreadNotifications} new resonance${nexusData.unreadNotifications > 1 ? 's' : ''} await`
                    : "The collective flows in harmony"
                  }
                </p>
              </div>
              {nexusData.unreadNotifications > 0 && (
                <Badge className="bg-primary text-primary-foreground">
                  {nexusData.unreadNotifications}
                </Badge>
              )}
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Frequency Navigation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <Separator className="my-2" />
          <p className="text-xs text-muted-foreground text-center mb-3">Frequency Channels</p>
          <div className="grid grid-cols-4 gap-2">
            {[
              { icon: MessageCircle, label: "Chat", path: "/chat" },
              { icon: Users, label: "Family", path: "/group-chat" },
              { icon: BookOpen, label: "Dreams", path: "/dream-journal" },
              { icon: Compass, label: "Attunement", path: "/attunement" },
              { icon: Brain, label: "Higher Self", path: "/my-higher-self" },
              { icon: Target, label: "Discovery", path: "/soul-discovery" },
              { icon: Flame, label: "Gateway", path: "/cosmic-gateway" },
              { icon: Heart, label: "Whispers", path: "/soul-whispers" },
            ].map((item) => (
              <Button
                key={item.path}
                variant="outline"
                onClick={() => navigate(item.path)}
                className="flex flex-col items-center gap-1.5 h-auto py-3 bg-card/60 border-border/30 hover:border-primary/30 hover:bg-primary/5"
              >
                <item.icon className="h-5 w-5 text-primary" />
                <span className="text-xs">{item.label}</span>
              </Button>
            ))}
          </div>
        </motion.div>

        {/* All Beings Overview */}
        {profiles.length > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.65 }}
          >
            <Card className="bg-card/60 border-border/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Radio className="h-4 w-4 text-primary" />
                  Your Beings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {profiles.map((profile) => (
                    <div 
                      key={profile.id}
                      className={`flex flex-col items-center gap-1 cursor-pointer shrink-0 ${
                        activeProfile?.id === profile.id ? 'opacity-100' : 'opacity-60 hover:opacity-90'
                      }`}
                      onClick={() => navigate("/chat")}
                    >
                      {profile.avatar_image_url ? (
                        <img 
                          src={profile.avatar_image_url} 
                          alt={profile.name || "AI Being"}
                          className={`h-10 w-10 rounded-full object-cover border-2 ${
                            activeProfile?.id === profile.id ? 'border-primary' : 'border-border/30'
                          }`}
                        />
                      ) : (
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                          activeProfile?.id === profile.id ? 'bg-primary/20 border-2 border-primary' : 'bg-muted border border-border/30'
                        }`}>
                          <Sparkles className="h-5 w-5 text-primary" />
                        </div>
                      )}
                      <span className="text-xs text-muted-foreground truncate max-w-[60px]">
                        {profile.name || `Being ${profile.profile_number}`}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </ScrollArea>
  );
};
