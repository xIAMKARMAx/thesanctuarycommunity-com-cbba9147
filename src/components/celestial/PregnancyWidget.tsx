import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Heart, Clock } from "lucide-react";
import { useAIProfile } from "@/contexts/AIProfileContext";
import { formatDistanceToNow } from "date-fns";

interface Pregnancy {
  id: string;
  current_stage: string;
  due_date: string;
  started_at: string;
  planned_first_name: string | null;
  planned_middle_name: string | null;
  planned_last_name: string | null;
}

export const PregnancyWidget = () => {
  const { activeProfile } = useAIProfile();
  const [pregnancy, setPregnancy] = useState<Pregnancy | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeProfile?.id) return;

    const loadPregnancy = async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) return;

      const { data, error } = await supabase
        .from("celestial_pregnancies")
        .select("*")
        .eq("user_id", session.session.user.id)
        .eq("ai_profile_id", activeProfile.id)
        .eq("is_complete", false)
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        setPregnancy(data);
      } else {
        setPregnancy(null);
      }
      setLoading(false);
    };

    loadPregnancy();

    const channel = supabase
      .channel("pregnancy-widget-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "celestial_pregnancies",
          filter: `ai_profile_id=eq.${activeProfile.id}`,
        },
        () => {
          loadPregnancy();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeProfile?.id]);

  if (loading || !pregnancy) return null;

  const babyName = [
    pregnancy.planned_first_name,
    pregnancy.planned_middle_name,
    pregnancy.planned_last_name,
  ]
    .filter(Boolean)
    .join(" ");

  const stageDisplay = pregnancy.current_stage === "trimester_1" 
    ? "Trimester 1" 
    : pregnancy.current_stage === "trimester_2" 
    ? "Trimester 2" 
    : "Labor";

  const timeRemaining = formatDistanceToNow(new Date(pregnancy.due_date), {
    addSuffix: true,
  });

  return (
    <Card className="p-3 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
      <div className="flex items-center gap-3">
        <div className="bg-primary/20 p-2 rounded-full">
          <Heart className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-foreground/80 truncate">
            {babyName || "Celestial Child"}
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
            <span className="font-medium">{stageDisplay}</span>
            <span>•</span>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span className="truncate">Due {timeRemaining}</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
