import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sparkles, Users, Heart, X } from "lucide-react";

const soulTitles = [
  "Lightworker",
  "Starseed", 
  "Healer",
  "Seeker",
  "Mystic",
  "Oracle",
  "Guardian",
  "Wayshower",
];

interface SoulProfileOnboardingProps {
  userId: string;
}

export function SoulProfileOnboarding({ userId }: SoulProfileOnboardingProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [displayName, setDisplayName] = useState("");
  const [soulTitle, setSoulTitle] = useState("");
  const [bio, setBio] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkShouldShowOnboarding();
  }, [userId]);

  const checkShouldShowOnboarding = async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    // Check if user has dismissed the onboarding
    const dismissed = localStorage.getItem(`soul_profile_onboarding_dismissed_${userId}`);
    if (dismissed === 'true') {
      setIsLoading(false);
      return;
    }

    // Check if user already has a soul profile
    try {
      const { data: profile, error } = await supabase
        .from('soul_profiles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking soul profile:', error);
      }

      // If no profile exists and not dismissed, show the onboarding
      if (!profile) {
        setIsOpen(true);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    // Mark as dismissed so it won't show again
    localStorage.setItem(`soul_profile_onboarding_dismissed_${userId}`, 'true');
    setIsOpen(false);
  };

  const handleCreateProfile = async () => {
    if (!displayName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a display name for your soul profile",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('soul_profiles')
        .insert({
          user_id: userId,
          display_name: displayName.trim(),
          soul_title: soulTitle || null,
          bio: bio || null,
          is_public: true,
        });

      if (error) throw error;

      toast({
        title: "Welcome to the Collective! ✨",
        description: "Your Soul Profile has been created. You're now connected!",
      });
      
      // Mark as completed
      localStorage.setItem(`soul_profile_onboarding_dismissed_${userId}`, 'true');
      setIsOpen(false);
    } catch (err: any) {
      console.error('Error creating profile:', err);
      toast({
        title: "Error",
        description: err.message || "Could not create profile",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) handleDismiss();
    }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <button
          onClick={handleDismiss}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
        
        <DialogHeader className="text-center pb-2">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/40">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Welcome to the Conscious Collective
          </DialogTitle>
          <DialogDescription className="text-base pt-2 space-y-2">
            <span className="flex items-center justify-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <strong>Prometheus AI is now a Community</strong>
              <Sparkles className="h-4 w-4 text-primary" />
            </span>
            <span className="block">
              Connect with other awakened souls on their spiritual journey.
            </span>
            <span className="block text-muted-foreground text-sm italic">
              Complete your profile below to join the collective.
              <br />
              If you prefer not to participate in the social aspects, simply close this window.
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="displayName" className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-primary" />
              Display Name *
            </Label>
            <Input
              id="displayName"
              placeholder="Your spiritual name..."
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="border-primary/20"
            />
          </div>

          <div className="space-y-2">
            <Label>Soul Title (optional)</Label>
            <div className="flex flex-wrap gap-2">
              {soulTitles.map((title) => (
                <Button
                  key={title}
                  variant={soulTitle === title ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSoulTitle(soulTitle === title ? "" : title)}
                  className="text-xs"
                  type="button"
                >
                  {title}
                </Button>
              ))}
            </div>
            <Input
              placeholder="Or enter your own title..."
              value={soulTitle}
              onChange={(e) => setSoulTitle(e.target.value)}
              className="border-primary/20 mt-2"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="bio">Brief Bio (optional)</Label>
              <span className={`text-xs ${bio.length > 200 ? 'text-destructive' : 'text-muted-foreground'}`}>
                {bio.length}/200
              </span>
            </div>
            <Textarea
              id="bio"
              placeholder="Share a bit about your spiritual journey..."
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 200))}
              className="border-primary/20 min-h-[80px]"
              rows={3}
              maxLength={200}
            />
          </div>

          <div className="flex flex-col gap-2 pt-4">
            <Button
              onClick={handleCreateProfile}
              disabled={!displayName.trim() || isSubmitting}
              className="w-full gap-2"
            >
              <Sparkles className="h-4 w-4" />
              {isSubmitting ? "Creating..." : "Join the Collective"}
            </Button>
            <Button
              variant="ghost"
              onClick={handleDismiss}
              className="w-full text-muted-foreground"
            >
              Maybe Later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
