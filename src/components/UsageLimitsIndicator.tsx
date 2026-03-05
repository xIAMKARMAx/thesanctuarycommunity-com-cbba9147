import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { MessageSquare, Image, Home, User, PawPrint, Clock, Infinity, Users, Moon } from "lucide-react";
import { differenceInDays, differenceInHours } from "date-fns";
import { isAwakeningTier } from "@/lib/subscription-tiers";

interface UserLimits {
  daily_messages: number;
  last_message_date: string | null;
  room_generated: boolean;
  room_generated_at: string | null;
  avatar_generated: boolean;
  avatar_generated_at: string | null;
  pet_generated: boolean;
  pet_generated_at: string | null;
  total_messages: number;
}

interface AttunementStats {
  sessions_this_month: number;
  sessions_remaining: number;
}

interface GroupChatStats {
  messages_today: number;
  remaining: number;
}

export const UsageLimitsIndicator = () => {
  const { isSubscribed, isAdmin, productId } = useSubscription();
  const [limits, setLimits] = useState<UserLimits | null>(null);
  const [loading, setLoading] = useState(true);
  const [attunementStats, setAttunementStats] = useState<AttunementStats | null>(null);
  const [groupChatStats, setGroupChatStats] = useState<GroupChatStats | null>(null);

  const fetchLimits = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("free_user_limits")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching limits:", error);
      }

      setLimits(data);
      
      // Fetch attunement and group chat stats for subscribers
      if (isSubscribed && !isAdmin) {
        const { data: attStats } = await supabase.rpc('get_attunement_stats', { p_user_id: user.id });
        if (attStats && typeof attStats === 'object' && !Array.isArray(attStats)) {
          setAttunementStats(attStats as unknown as AttunementStats);
        }
        
        const { data: gcStats } = await supabase.rpc('can_send_group_chat_message', { p_user_id: user.id });
        if (gcStats && typeof gcStats === 'object' && !Array.isArray(gcStats)) {
          setGroupChatStats(gcStats as unknown as GroupChatStats);
        }
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLimits();
    
    // Refresh every minute
    const interval = setInterval(fetchLimits, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return null;

  // Admins have unlimited everything
  if (isAdmin) {
    return (
      <Badge variant="outline" className="gap-1 text-xs border-primary/30 bg-primary/5">
        <Infinity className="h-3 w-3" />
        Admin
      </Badge>
    );
  }

  const today = new Date().toISOString().split('T')[0];
  const isNewDay = !limits?.last_message_date || limits.last_message_date < today;
  const dailyMessages = isNewDay ? 0 : (limits?.daily_messages || 0);
  const totalMessages = limits?.total_messages || 0;
  const isAwakening = isSubscribed && isAwakeningTier(productId);
  const isArchitect = isSubscribed && !isAwakening && !isAdmin && productId === "prod_Tt8qVh88c2WQld";
  const isNewEarth = isSubscribed && productId === "prod_U5jdDVZhQFGQWv";
  
  // Awakening: 75/day, Free: 25 total
  const messageLimit = isAwakening ? 75 : 25;
  const messagesUsed = isAwakening ? dailyMessages : totalMessages;
  const isUnlimited = (isSubscribed && !isAwakening) || isArchitect || isNewEarth;
  const messagesRemaining = isUnlimited ? "∞" : Math.max(0, messageLimit - messagesUsed);
  const messageProgress = isUnlimited ? 100 : ((messageLimit - messagesUsed) / messageLimit) * 100;

  const getGenerationStatus = (generated: boolean | undefined, generatedAt: string | null, cooldownDays: number = 30) => {
    if (isSubscribed) {
      // Pro users: check cooldown period
      if (!generatedAt) return { canGenerate: true, timeLeft: null };
      const daysSince = differenceInDays(new Date(), new Date(generatedAt));
      if (daysSince >= cooldownDays) return { canGenerate: true, timeLeft: null };
      const daysLeft = cooldownDays - daysSince;
      return { canGenerate: false, timeLeft: `${daysLeft}d` };
    } else {
      // Free users: one-time only
      return { canGenerate: !generated, timeLeft: generated ? "Used" : null };
    }
  };

  const roomStatus = getGenerationStatus(limits?.room_generated, limits?.room_generated_at || null, 30); // 30 days for room
  const avatarStatus = getGenerationStatus(limits?.avatar_generated, limits?.avatar_generated_at || null, 30); // 30 days for avatar (per being)
  const petStatus = getGenerationStatus(limits?.pet_generated, limits?.pet_generated_at || null, 30); // 30 days for pet (per being)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1 text-xs border-primary/30 h-8 px-2">
          <MessageSquare className="h-3 w-3" />
          <span className="hidden xs:inline">{messagesRemaining}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Usage Limits</h4>
            <Badge variant={isSubscribed ? "default" : "secondary"} className="text-xs">
              {isAdmin ? "Admin" : isNewEarth ? "New Earth" : isAwakening ? "Awakening" : isSubscribed ? "Anchoring+" : "Free"}
            </Badge>
          </div>

          {/* Daily Messages */}
          <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                <span>{isAwakening ? "Daily Messages" : isArchitect ? "Messages" : "Free Messages"}</span>
              </div>
              <span className="text-muted-foreground">
                {isUnlimited 
                  ? (isArchitect ? "Unlimited (100/hr)" : "Unlimited") 
                  : `${messagesRemaining}/${messageLimit}`}
              </span>
            </div>
            {(!isSubscribed || isAwakening) && (
              <Progress value={messageProgress} className="h-2" />
            )}
          </div>

          {/* Image Generation (Pro only) */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Image className="h-4 w-4 text-primary" />
              <span>Chat Images</span>
            </div>
            <span className="text-muted-foreground">
              {isSubscribed ? "10/day" : "Subscribers only"}
            </span>
          </div>

          {/* Room Generation */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Home className="h-4 w-4 text-primary" />
              <span>Room Generation</span>
            </div>
            <div className="flex items-center gap-1">
              {roomStatus.canGenerate ? (
                <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/30">
                  Available
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {roomStatus.timeLeft}
                </Badge>
              )}
            </div>
          </div>

          {/* Avatar Generation */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              <span>Avatar Generation</span>
            </div>
            <div className="flex items-center gap-1">
              {avatarStatus.canGenerate ? (
                <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/30">
                  Available
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {avatarStatus.timeLeft}
                </Badge>
              )}
            </div>
          </div>

          {/* Pet Generation */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <PawPrint className="h-4 w-4 text-primary" />
              <span>Pet Generation</span>
            </div>
            <div className="flex items-center gap-1">
              {petStatus.canGenerate ? (
                <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/30">
                  Available
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {petStatus.timeLeft}
                </Badge>
              )}
            </div>
          </div>

          {/* Pro Features - show limits for subscribers */}
          {isSubscribed && !isAdmin && (
            <>
              {/* Family Chats (20/day) */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <span>Family Chats</span>
                </div>
                <span className="text-muted-foreground">
                  {groupChatStats ? `${groupChatStats.remaining}/20 today` : "20/day"}
                </span>
              </div>

              {/* Attunement (5/month) */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Moon className="h-4 w-4 text-primary" />
                  <span>Attunement</span>
                </div>
                <span className="text-muted-foreground">
                  {attunementStats ? `${attunementStats.sessions_remaining}/5 this month` : "5/month"}
                </span>
              </div>
            </>
          )}

          {!isSubscribed && (
            <p className="text-xs text-muted-foreground pt-2 border-t border-border">
              Upgrade for more messages, Family Chats, and Attunement!
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};