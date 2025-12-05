import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { api } from "@/lib/api-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Heart, Baby, FastForward } from "lucide-react";
import { toast } from "sonner";

interface Pregnancy {
  id: string;
  started_at: string;
  current_stage: string;
  trimester_1_image_url: string | null;
  trimester_2_image_url: string | null;
  labor_image_urls: string[] | null;
  due_date: string;
  is_complete: boolean;
  planned_first_name: string | null;
  planned_middle_name: string | null;
  planned_last_name: string | null;
  planned_sex: string | null;
}

export const PregnancyTracker = () => {
  const [pregnancy, setPregnancy] = useState<Pregnancy | null>(null);
  const [loading, setLoading] = useState(true);
  const [advancing, setAdvancing] = useState(false);

  useEffect(() => {
    loadPregnancy();

    // Subscribe to pregnancy updates
    const channel = supabase
      .channel("pregnancy_updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "celestial_pregnancies"
        },
        () => {
          loadPregnancy();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadPregnancy = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("celestial_pregnancies")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_complete", false)
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setPregnancy(data);
    } catch (error) {
      console.error("Error loading pregnancy:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTestAdvance = async () => {
    if (!pregnancy) return;
    
    setAdvancing(true);
    try {
      const { data, error } = await api.testAdvancePregnancy({ pregnancyId: pregnancy.id });

      if (error) throw error;

      toast.success((data as any)?.message || "Pregnancy advanced!");
      loadPregnancy();
    } catch (error) {
      console.error("Error advancing pregnancy:", error);
      toast.error(error instanceof Error ? error.message : "Failed to advance pregnancy");
    } finally {
      setAdvancing(false);
    }
  };

  if (loading) return null;
  if (!pregnancy) return null;

  const now = new Date();
  const startDate = new Date(pregnancy.started_at);
  const dueDate = new Date(pregnancy.due_date);
  const totalDuration = dueDate.getTime() - startDate.getTime();
  const elapsed = now.getTime() - startDate.getTime();
  const progress = Math.min((elapsed / totalDuration) * 100, 100);

  const daysRemaining = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  const getStageDisplay = () => {
    switch (pregnancy.current_stage) {
      case "trimester_1":
        return "First Trimester (Week 1) - Baby bump growing to 5 months";
      case "trimester_2":
        return "Second Trimester (Week 2) - Baby bump growing to 8 months";
      case "labor":
        return "In Labor - Celestial birth is happening!";
      default:
        return "Pregnancy Journey";
    }
  };

  const currentImage = pregnancy.current_stage === "trimester_2" 
    ? pregnancy.trimester_2_image_url 
    : pregnancy.current_stage === "labor"
    ? pregnancy.labor_image_urls?.[0]
    : pregnancy.trimester_1_image_url;

  const babyName = [
    pregnancy.planned_first_name,
    pregnancy.planned_middle_name,
    pregnancy.planned_last_name,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" />
              Celestial Pregnancy Journey{babyName ? ` with ${babyName}` : ""}
            </CardTitle>
            <CardDescription>{getStageDisplay()}</CardDescription>
          </div>
          <Button
            onClick={handleTestAdvance}
            disabled={advancing}
            size="sm"
            variant="outline"
            className="gap-2"
          >
            <FastForward className="h-4 w-4" />
            {advancing ? "Advancing..." : "Test Advance"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <Baby className="h-4 w-4 text-primary" />
              <span>Progress</span>
            </span>
            <span className="font-medium">
              {daysRemaining > 0 ? `${daysRemaining} days remaining` : "Birth imminent!"}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {currentImage && (
          <div className="rounded-lg overflow-hidden border border-border">
            <img 
              src={currentImage} 
              alt={`${pregnancy.current_stage} stage`}
              className="w-full h-auto object-cover"
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm font-medium">Started</p>
            <p className="text-sm text-muted-foreground">
              {new Date(pregnancy.started_at).toLocaleDateString()}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">Due Date</p>
            <p className="text-sm text-muted-foreground">
              {new Date(pregnancy.due_date).toLocaleDateString()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
