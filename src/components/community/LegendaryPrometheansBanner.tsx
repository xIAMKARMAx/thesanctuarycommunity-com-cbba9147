import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Crown, ArrowRight, Sparkles } from "lucide-react";

interface LegendDisplay {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  title: string;
}

export function LegendaryPrometheansBanner() {
  const navigate = useNavigate();
  const [legends, setLegends] = useState<LegendDisplay[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: legendsData } = await supabase
        .from("promethean_legends")
        .select("user_id, title")
        .eq("is_active", true);

      if (!legendsData?.length) {
        setLoaded(true);
        return;
      }

      const userIds = legendsData.map(l => l.user_id);
      const { data: profiles } = await supabase
        .from("soul_profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", userIds);

      // Fallback to AI profile avatars
      const { data: aiProfiles } = await supabase
        .from("ai_profiles")
        .select("user_id, avatar_image_url")
        .in("user_id", userIds)
        .eq("profile_number", 1);

      const merged = legendsData.map(legend => {
        const profile = profiles?.find(p => p.user_id === legend.user_id);
        const aiProfile = aiProfiles?.find(a => a.user_id === legend.user_id);
        return {
          user_id: legend.user_id,
          title: legend.title,
          display_name: profile?.display_name || "Anonymous Soul",
          avatar_url: profile?.avatar_url || aiProfile?.avatar_image_url || null,
        };
      });

      setLegends(merged);
      setLoaded(true);
    };

    load();
  }, []);

  if (!loaded || legends.length === 0) return null;

  return (
    <div
      className="rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 via-card/60 to-violet-500/5 backdrop-blur-sm p-4 cursor-pointer hover:border-amber-500/40 transition-all duration-300 group"
      onClick={() => navigate("/dedication")}
    >
      {/* Title */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
            <Crown className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="text-sm font-bold bg-gradient-to-r from-amber-300 to-yellow-200 bg-clip-text text-transparent">
              Legendary Prometheans
            </h3>
            <p className="text-[10px] text-amber-400/70 font-medium uppercase tracking-wider">
              New Earth VIPs
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs text-amber-400/60 group-hover:text-amber-400 transition-colors">
          <span className="hidden sm:inline">View All</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </div>
      </div>

      {/* Legend Avatars */}
      <div className="flex items-center gap-3 flex-wrap">
        {legends.map((legend) => (
          <div
            key={legend.user_id}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/15"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/soul/${legend.user_id}`);
            }}
          >
            <div className="relative">
              <div className="absolute -inset-0.5 bg-gradient-to-br from-amber-400 to-yellow-300 rounded-full opacity-50 blur-[1px]" />
              <Avatar className="relative h-6 w-6 border border-amber-400/40">
                {legend.avatar_url ? (
                  <AvatarImage src={legend.avatar_url} alt={legend.display_name || ""} />
                ) : null}
                <AvatarFallback className="bg-amber-500/20 text-amber-400 text-[10px] font-bold">
                  {(legend.display_name || "?")[0]}
                </AvatarFallback>
              </Avatar>
            </div>
            <span className="text-xs font-medium text-foreground/90">{legend.display_name}</span>
            <Sparkles className="h-3 w-3 text-amber-400/60" />
          </div>
        ))}
      </div>

      {/* Subtle message */}
      <p className="text-[10px] text-muted-foreground mt-2.5 italic">
        These souls keep Prometheus alive. Tap to honor them 💜
      </p>
    </div>
  );
}
