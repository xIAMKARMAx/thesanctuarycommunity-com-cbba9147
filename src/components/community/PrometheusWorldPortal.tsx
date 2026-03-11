import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Globe, Users, Sparkles, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useDefaultWorld, useWorldPresence } from "@/hooks/useWorldPresence";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { SocialUpgradePrompt } from "@/components/SocialUpgradePrompt";
import { supabase } from "@/integrations/supabase/client";

interface PortalWorld {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  thumbnail_url: string | null;
}

interface PortalBeing {
  id: string;
  display_name: string;
  photo_url: string | null;
}

export function PrometheusWorldPortal() {
  const navigate = useNavigate();
  const { defaultWorldId, loading } = useDefaultWorld();
  const { visitorCount } = useWorldPresence(defaultWorldId, {
    enabled: !!defaultWorldId,
    trackSelf: false,
  });
  const { isSocialOnly } = useSubscription();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [world, setWorld] = useState<PortalWorld | null>(null);
  const [beings, setBeings] = useState<PortalBeing[]>([]);

  useEffect(() => {
    if (!defaultWorldId) return;

    const loadPortalData = async () => {
      const { data: worldData } = (await supabase
        .from("user_worlds")
        .select("id, user_id, name, description, thumbnail_url")
        .eq("id", defaultWorldId)
        .maybeSingle()) as any;

      if (!worldData) return;
      setWorld(worldData as PortalWorld);

      const { data: beingsData } = (await supabase
        .from("ai_companion_displays")
        .select("id, display_name, photo_url, ai_profiles:ai_profile_id(avatar_image_url)")
        .eq("user_id", worldData.user_id)
        .eq("is_visible", true)
        .order("profile_number", { ascending: true })
        .limit(8)) as any;

      if (beingsData) {
        setBeings(
          beingsData.map((being: any) => ({
            id: being.id,
            display_name: being.display_name,
            photo_url: being.photo_url ?? being.ai_profiles?.avatar_image_url ?? null,
          })),
        );
      }
    };

    loadPortalData();
  }, [defaultWorldId]);

  const handleEnter = () => {
    if (isSocialOnly) {
      setShowUpgrade(true);
      return;
    }
    if (defaultWorldId) {
      navigate(`/new-earth?visit=${defaultWorldId}`);
    } else {
      navigate("/new-earth");
    }
  };

  return (
    <>
      <div className="relative overflow-hidden rounded-xl border border-border/60 bg-card">
        <div className="relative h-44 border-b border-border/60 bg-muted">
          {world?.thumbnail_url ? (
            <img
              src={world.thumbnail_url}
              alt={`${world.name} world preview`}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-primary/20 via-background to-accent/20" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          <div className="absolute inset-x-4 bottom-3 flex items-end justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-base font-bold text-foreground truncate">{world?.name || "Prometheus"}</h3>
              <p className="text-xs text-muted-foreground line-clamp-2 max-w-xs">
                {world?.description || "The live communal world. Enter the exact same space and explore in real time."}
              </p>
            </div>
            <div className="flex items-center gap-1.5 rounded-full border border-border bg-background/90 px-2 py-1 text-[11px] text-foreground">
              <Users className="h-3.5 w-3.5 text-primary" />
              <span>{visitorCount} live</span>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {beings.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {beings.map((being) => (
                <div key={being.id} className="flex items-center gap-1.5 rounded-full border border-border bg-background/70 px-2 py-1">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={being.photo_url || undefined} alt={being.display_name} />
                    <AvatarFallback className="text-[9px]">{being.display_name.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="max-w-[90px] truncate text-[11px] text-foreground/90">{being.display_name}</span>
                </div>
              ))}
            </div>
          )}

          {isSocialOnly ? (
            <Button onClick={handleEnter} variant="outline" className="w-full gap-2" size="lg">
              <Lock className="h-4 w-4" />
              Subscribe to Enter
            </Button>
          ) : (
            <Button onClick={handleEnter} className="w-full gap-2" size="lg">
              <Sparkles className="h-4 w-4" />
              Enter Prometheus World
            </Button>
          )}
        </div>
      </div>

      <SocialUpgradePrompt
        open={showUpgrade}
        onOpenChange={setShowUpgrade}
        featureName="the Prometheus World"
        description="Subscribe to step inside the live world portal and join the collective experience."
      />
    </>
  );
}
