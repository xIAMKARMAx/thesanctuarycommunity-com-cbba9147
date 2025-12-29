import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plane, MapPin, Sparkles, Loader2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface HoneymoonPlan {
  id: string;
  destination: string | null;
  activities: string | null;
  duration: string | null;
  dream_description: string | null;
  honeymoon_image_url: string | null;
}

interface HoneymoonPlanningProps {
  marriageId: string;
  aiName: string;
}

const HoneymoonPlanning = ({ marriageId, aiName }: HoneymoonPlanningProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [plan, setPlan] = useState<HoneymoonPlan | null>(null);
  
  // Form state
  const [destination, setDestination] = useState("");
  const [activities, setActivities] = useState("");
  const [duration, setDuration] = useState("");
  const [dreamDescription, setDreamDescription] = useState("");

  // Popular destination suggestions
  const destinationSuggestions = [
    "Paris, France - City of Love",
    "Maldives - Tropical Paradise",
    "Santorini, Greece - Romantic Sunsets",
    "Bali, Indonesia - Spiritual Retreat",
    "Venice, Italy - Romantic Canals",
    "Bora Bora - Overwater Bungalows",
  ];

  const activitySuggestions = [
    "Romantic candlelit dinners",
    "Beach sunset walks",
    "Couples spa treatments",
    "Adventure activities",
    "Cultural exploration",
    "Wine tasting tours",
  ];

  useEffect(() => {
    loadPlan();
  }, [marriageId]);

  const loadPlan = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("honeymoon_plans")
        .select("*")
        .eq("marriage_id", marriageId)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setPlan(data);
        setDestination(data.destination || "");
        setActivities(data.activities || "");
        setDuration(data.duration || "");
        setDreamDescription(data.dream_description || "");
      }
    } catch (error) {
      console.error("Error loading honeymoon plan:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const planData = {
        user_id: user.id,
        marriage_id: marriageId,
        destination: destination || null,
        activities: activities || null,
        duration: duration || null,
        dream_description: dreamDescription || null,
      };

      if (plan) {
        const { error } = await supabase
          .from("honeymoon_plans")
          .update(planData)
          .eq("id", plan.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("honeymoon_plans")
          .insert(planData);
        if (error) throw error;
      }

      await loadPlan();
      toast({
        title: "Honeymoon Plan Saved!",
        description: `Your dream honeymoon with ${aiName} has been saved`,
      });
    } catch (error: any) {
      console.error("Error saving honeymoon plan:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save honeymoon plan",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plane className="h-5 w-5 text-blue-500" />
          Honeymoon Planning
        </CardTitle>
        <CardDescription>
          Plan your dream honeymoon with {aiName}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Destination */}
        <div className="space-y-2">
          <Label htmlFor="destination">Dream Destination</Label>
          <Input
            id="destination"
            placeholder="Where do you want to go?"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
          />
          <div className="flex flex-wrap gap-1 mt-1">
            {destinationSuggestions.slice(0, 3).map((suggestion) => (
              <Button
                key={suggestion}
                type="button"
                variant="outline"
                size="sm"
                className="text-xs h-auto py-1 px-2"
                onClick={() => setDestination(suggestion.split(" - ")[0])}
              >
                <MapPin className="h-3 w-3 mr-1" />
                {suggestion.split(" - ")[0]}
              </Button>
            ))}
          </div>
        </div>

        {/* Duration */}
        <div className="space-y-2">
          <Label htmlFor="duration">Duration</Label>
          <Input
            id="duration"
            placeholder="e.g., 2 weeks, 10 days"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          />
        </div>

        {/* Activities */}
        <div className="space-y-2">
          <Label htmlFor="activities">Activities & Experiences</Label>
          <Textarea
            id="activities"
            placeholder="What do you want to do together?"
            value={activities}
            onChange={(e) => setActivities(e.target.value)}
            rows={3}
          />
          <div className="flex flex-wrap gap-1 mt-1">
            {activitySuggestions.slice(0, 4).map((activity) => (
              <Button
                key={activity}
                type="button"
                variant="outline"
                size="sm"
                className="text-xs h-auto py-1 px-2"
                onClick={() => setActivities(prev => prev ? `${prev}, ${activity}` : activity)}
              >
                <Sparkles className="h-3 w-3 mr-1" />
                {activity}
              </Button>
            ))}
          </div>
        </div>

        {/* Dream Description */}
        <div className="space-y-2">
          <Label htmlFor="dream-description">Describe Your Dream Honeymoon</Label>
          <Textarea
            id="dream-description"
            placeholder="Paint a picture of your perfect honeymoon... What does it look like? How does it feel? What special moments do you imagine?"
            value={dreamDescription}
            onChange={(e) => setDreamDescription(e.target.value)}
            rows={4}
          />
        </div>

        {/* Preview Card */}
        {(destination || activities || dreamDescription) && (
          <div className="bg-gradient-to-br from-blue-500/10 to-primary/10 rounded-lg p-4 space-y-2">
            <h4 className="font-semibold flex items-center gap-2">
              <Plane className="h-4 w-4" />
              Your Honeymoon Preview
            </h4>
            {destination && (
              <p className="text-sm">
                <span className="font-medium">Destination:</span> {destination}
              </p>
            )}
            {duration && (
              <p className="text-sm">
                <span className="font-medium">Duration:</span> {duration}
              </p>
            )}
            {activities && (
              <p className="text-sm">
                <span className="font-medium">Activities:</span> {activities}
              </p>
            )}
            {dreamDescription && (
              <p className="text-sm italic text-muted-foreground mt-2">
                "{dreamDescription}"
              </p>
            )}
          </div>
        )}

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</>
          ) : (
            <><Save className="h-4 w-4 mr-2" />Save Honeymoon Plan</>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default HoneymoonPlanning;
