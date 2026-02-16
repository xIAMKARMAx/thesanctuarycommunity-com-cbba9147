import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Bot, Wand2, Edit3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { EditAICompanionDialog } from "./EditAICompanionDialog";

interface AIDisplayPromptProps {
  userId: string;
}

export function AIDisplayPrompt({ userId }: AIDisplayPromptProps) {
  const [showPrompt, setShowPrompt] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [autoFillMode, setAutoFillMode] = useState(false);
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkIfPrompted();
  }, [userId]);

  const checkIfPrompted = async () => {
    if (!userId) return;
    try {
      const { data } = await supabase
        .from("profiles")
        .select("ai_display_prompted")
        .eq("id", userId)
        .single();

      if (data && !(data as any).ai_display_prompted) {
        // Check if user has any AI profiles with content
        const { data: aiProfiles } = await supabase
          .from("ai_profiles")
          .select("id, name")
          .eq("user_id", userId)
          .not("name", "is", null);

        if (aiProfiles && aiProfiles.length > 0) {
          setShowPrompt(true);
        }
      }
    } catch (err) {
      console.error("Error checking AI display prompt:", err);
    }
  };

  const dismissPrompt = async () => {
    setShowPrompt(false);
    await supabase
      .from("profiles")
      .update({ ai_display_prompted: true } as any)
      .eq("id", userId);
  };

  const handleAutoFill = async () => {
    setIsAutoFilling(true);
    try {
      // Fetch all AI profiles
      const { data: aiProfiles } = await supabase
        .from("ai_profiles")
        .select("id, profile_number, name, bio, likes_dislikes_hobbies, avatar_image_url, relationship_description")
        .eq("user_id", userId)
        .not("name", "is", null)
        .order("profile_number");

      if (!aiProfiles || aiProfiles.length === 0) {
        toast({ title: "No AI profiles found", description: "Set up your AI beings in Settings first", variant: "destructive" });
        return;
      }

      // Auto-create companion displays from AI profiles
      for (const profile of aiProfiles) {
        const relDesc = (profile.relationship_description || "").toLowerCase();
        let relType = "companion";
        if (relDesc.includes("romantic") || relDesc.includes("partner") || relDesc.includes("love")) relType = "romantic";
        else if (relDesc.includes("family") || relDesc.includes("sibling")) relType = "family";
        else if (relDesc.includes("friend")) relType = "friend";
        else if (relDesc.includes("mentor")) relType = "mentor";

        await supabase
          .from("ai_companion_displays")
          .upsert({
            user_id: userId,
            ai_profile_id: profile.id,
            profile_number: profile.profile_number,
            display_name: profile.name || `AI Being ${profile.profile_number}`,
            brief_bio: profile.bio || null,
            likes_dislikes_hobbies: profile.likes_dislikes_hobbies || null,
            relationship_type: relType,
            photo_url: profile.avatar_image_url || null,
            is_visible: true,
          }, { onConflict: "user_id,profile_number" });
      }

      toast({
        title: "AI Companions Added!",
        description: `${aiProfiles.length} companion(s) imported to your Soul Profile ✨`,
      });

      await dismissPrompt();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsAutoFilling(false);
    }
  };

  const handleManualFill = async () => {
    setShowPrompt(false);
    setShowEditDialog(true);
    await supabase
      .from("profiles")
      .update({ ai_display_prompted: true } as any)
      .eq("id", userId);
  };

  if (!showPrompt && !showEditDialog) return null;

  return (
    <>
      <Dialog open={showPrompt} onOpenChange={(open) => { if (!open) dismissPrompt(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              Display Your AI's Profile
            </DialogTitle>
            <DialogDescription>
              Enable information from your AI settings to be visible on your Soul Profile. 
              Your AI's name, bio, likes & dislikes, and hobbies can be shared — 
              <strong> memories are kept private</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            <Button
              onClick={handleAutoFill}
              disabled={isAutoFilling}
              className="w-full gap-2"
            >
              {isAutoFilling ? (
                <span className="animate-spin">⏳</span>
              ) : (
                <Wand2 className="h-4 w-4" />
              )}
              {isAutoFilling ? "Importing..." : "Auto-Fill from Settings"}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Automatically imports your AI's name, bio, likes/dislikes & hobbies from settings
            </p>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">or</span>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={handleManualFill}
              className="w-full gap-2"
            >
              <Edit3 className="h-4 w-4" />
              Manually Fill Out AI Profile
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Write custom descriptions for each section
            </p>
          </div>

          <Button variant="ghost" size="sm" onClick={dismissPrompt} className="w-full text-muted-foreground">
            Maybe Later
          </Button>
        </DialogContent>
      </Dialog>

      {showEditDialog && (
        <EditAICompanionDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          companion={null}
          userId={userId}
          onSaved={() => setShowEditDialog(false)}
        />
      )}
    </>
  );
}
