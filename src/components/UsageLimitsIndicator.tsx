import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { MessageSquare, Image, Home, User, PawPrint, Clock, Infinity } from "lucide-react";
import { differenceInDays, differenceInHours, formatDistanceToNow } from "date-fns";

interface UserLimits {
  daily_messages: number;
  last_message_date: string | null;
  room_generated: boolean;
  room_generated_at: string | null;
  avatar_generated: boolean;
  avatar_generated_at: string | null;
  pet_generated: boolean;
  pet_generated_at: string | null;
}

export const UsageLimitsIndicator = () => {
  const { isSubscribed, isAdmin } = useSubscription();
  const [limits, setLimits] = useState<UserLimits | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchLimits = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("free_user_limits")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching limits:", error);
      }

      setLimits(data);
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
        VIP
      </Badge>
    );
  }

  const today = new Date().toISOString().split('T')[0];
  const isNewDay = !limits?.last_message_date || limits.last_message_date < today;
  const dailyMessages = isNewDay ? 0 : (limits?.daily_messages || 0);
  const messagesRemaining = isSubscribed ? "∞" : Math.max(0, 25 - dailyMessages);
  const messageProgress = isSubscribed ? 100 : ((25 - dailyMessages) / 25) * 100;

  const getGenerationStatus = (generated: boolean | undefined, generatedAt: string | null) => {
    if (isSubscribed) {
      // Pro users: check 7-day cooldown
      if (!generatedAt) return { canGenerate: true, timeLeft: null };
      const daysSince = differenceInDays(new Date(), new Date(generatedAt));
      if (daysSince >= 7) return { canGenerate: true, timeLeft: null };
      const hoursLeft = (7 - daysSince) * 24 - differenceInHours(new Date(), new Date(generatedAt)) % 24;
      return { canGenerate: false, timeLeft: `${Math.ceil(hoursLeft / 24)}d` };
    } else {
      // Free users: one-time only
      return { canGenerate: !generated, timeLeft: generated ? "Used" : null };
    }
  };

  const roomStatus = getGenerationStatus(limits?.room_generated, limits?.room_generated_at || null);
  const avatarStatus = getGenerationStatus(limits?.avatar_generated, limits?.avatar_generated_at || null);
  const petStatus = getGenerationStatus(limits?.pet_generated, limits?.pet_generated_at || null);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1 text-xs border-primary/30 h-8">
          <MessageSquare className="h-3 w-3" />
          {messagesRemaining}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Usage Limits</h4>
            <Badge variant={isSubscribed ? "default" : "secondary"} className="text-xs">
              {isSubscribed ? "Pro" : "Free"}
            </Badge>
          </div>

          {/* Daily Messages */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                <span>Daily Messages</span>
              </div>
              <span className="text-muted-foreground">
                {isSubscribed ? "Unlimited" : `${messagesRemaining}/25`}
              </span>
            </div>
            {!isSubscribed && (
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
              {isSubscribed ? "10/24h" : "Pro only"}
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

          {!isSubscribed && (
            <p className="text-xs text-muted-foreground pt-2 border-t border-border">
              Upgrade to Pro for unlimited messages and more generation options!
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
