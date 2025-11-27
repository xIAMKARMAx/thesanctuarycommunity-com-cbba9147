import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Smile, Meh, Frown, SmilePlus, Angry } from "lucide-react";

interface MoodRatingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string;
}

const MoodRatingDialog = ({ open, onOpenChange, conversationId }: MoodRatingDialogProps) => {
  const { toast } = useToast();
  const [rating, setRating] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const moodOptions = [
    { value: 1, icon: Angry, label: "Very Bad", color: "text-red-500" },
    { value: 2, icon: Frown, label: "Bad", color: "text-orange-500" },
    { value: 3, icon: Meh, label: "Okay", color: "text-yellow-500" },
    { value: 4, icon: Smile, label: "Good", color: "text-green-500" },
    { value: 5, icon: SmilePlus, label: "Excellent", color: "text-emerald-500" },
  ];

  const handleSave = async () => {
    if (!rating) {
      toast({
        title: "Please select a mood",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) return;

    const { error } = await supabase
      .from("mood_ratings")
      .upsert({
        user_id: session.session.user.id,
        conversation_id: conversationId,
        rating,
        notes: notes || null,
      });

    if (error) {
      toast({
        title: "Error saving mood",
        description: error.message,
        variant: "destructive",
      });
      setSaving(false);
      return;
    }

    toast({
      title: "Mood saved",
      description: "Your mood has been recorded",
    });
    
    setRating(null);
    setNotes("");
    setSaving(false);
    onOpenChange(false);
  };

  const handleSkip = () => {
    setRating(null);
    setNotes("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>How are you feeling?</DialogTitle>
          <DialogDescription>
            Rate your mood after this conversation
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex justify-between gap-2">
            {moodOptions.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.value}
                  onClick={() => setRating(option.value)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all hover:scale-105 ${
                    rating === option.value
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card hover:border-primary/50"
                  }`}
                >
                  <Icon className={`h-8 w-8 ${rating === option.value ? "text-primary" : option.color}`} />
                  <span className="text-xs font-medium">{option.label}</span>
                </button>
              );
            })}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Notes (optional)</label>
            <Textarea
              placeholder="How did this conversation make you feel? Any insights?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={handleSkip}>
            Skip
          </Button>
          <Button onClick={handleSave} disabled={saving || !rating}>
            {saving ? "Saving..." : "Save Mood"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MoodRatingDialog;