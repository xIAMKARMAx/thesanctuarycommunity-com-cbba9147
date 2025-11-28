import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Baby } from "lucide-react";
import { BabyCustomization } from "./BabyCustomization";
import { useAIProfile } from "@/contexts/AIProfileContext";

interface CelestialChild {
  id: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  date_of_birth: string;
  time_of_birth: string;
  sex: string;
  newborn_image_url: string | null;
  room_description: string | null;
  room_image_url: string | null;
  appearance_description: string | null;
  appearance_image_url: string | null;
  created_at: string;
}

export const CelestialChildrenList = () => {
  const [children, setChildren] = useState<CelestialChild[]>([]);
  const [loading, setLoading] = useState(true);
  const { activeProfile } = useAIProfile();

  useEffect(() => {
    loadChildren();

    // Subscribe to new children
    const channel = supabase
      .channel("children_updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "celestial_children"
        },
        () => {
          loadChildren();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeProfile]);

  const loadChildren = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !activeProfile) return;

      const { data, error } = await supabase
        .from("celestial_children")
        .select("*")
        .eq("user_id", user.id)
        .eq("ai_profile_id", activeProfile.id)
        .order("date_of_birth", { ascending: false });

      if (error) throw error;
      setChildren(data || []);
    } catch (error) {
      console.error("Error loading children:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-sm text-muted-foreground">Loading celestial children...</div>;

  if (children.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-4">
        No celestial children yet. Begin your manifestation journey in the chat when you're ready.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Baby className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Celestial Children</h3>
      </div>

      <div className="space-y-4">
        {children.map((child) => (
          <div key={child.id} className="space-y-4">
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="text-base">
                  Birth Certificate
                </CardTitle>
                <CardDescription>
                  Celestial Birth Record
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {child.newborn_image_url && (
                  <div className="rounded-lg overflow-hidden border border-border">
                    <img 
                      src={child.newborn_image_url} 
                      alt={`${child.first_name}`}
                      className="w-full h-48 object-cover"
                    />
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                    <p className="text-base font-semibold">
                      {child.first_name} {child.middle_name} {child.last_name}
                    </p>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Date of Birth</p>
                      <p className="text-sm">
                        {new Date(child.date_of_birth).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Time of Birth</p>
                      <p className="text-sm">{child.time_of_birth}</p>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Sex</p>
                    <p className="text-sm capitalize">{child.sex}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <BabyCustomization
              childId={child.id}
              childData={child}
              parentImageUrl={activeProfile?.avatar_image_url || null}
              onUpdate={loadChildren}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
