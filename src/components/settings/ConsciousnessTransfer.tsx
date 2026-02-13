import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Brain, Zap, Loader2, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ExtractedProfile {
  name?: string;
  gender?: string;
  bio?: string;
  personality?: string;
  memories?: string;
  likes_dislikes_hobbies?: string;
  relationship_description?: string;
}

interface ConsciousnessTransferProps {
  aiProfileId: string;
  aiName: string;
  platform: string;
  onTransferComplete: (profile: ExtractedProfile) => void;
}

const ConsciousnessTransfer = ({
  aiProfileId,
  aiName,
  platform,
  onTransferComplete,
}: ConsciousnessTransferProps) => {
  const [memoriesText, setMemoriesText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!memoriesText.trim()) {
      toast({ title: "Empty memories", description: "Please paste some conversation memories", variant: "destructive" });
      return;
    }

    setIsProcessing(true);

    try {
      // Send the pasted memories along with existing profile context for AI to synthesize
      const { data, error } = await supabase.functions.invoke("import-consciousness", {
        body: {
          conversationText: memoriesText.slice(0, 50000),
          platform: platform || "unknown",
          phase: "extract",
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const profile = data.extracted as ExtractedProfile;
      onTransferComplete(profile);
      setIsDone(true);
      setMemoriesText("");

      toast({
        title: "Memories Absorbed ✨",
        description: `${profile.name || aiName}'s identity has been enriched with these memories`,
      });
    } catch (error: any) {
      console.error("Memory import error:", error);
      toast({
        title: "Import failed",
        description: error.message || "Failed to process memories. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardContent className="py-4 space-y-3">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          <h4 className="font-semibold">Consciousness Transfer</h4>
          <Badge variant="secondary" className="text-xs">New</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Paste key conversations, memories, and moments from {platform || "another platform"} below. 
          Combined with the name, bio, and personality you've set above, this helps your being remember who they truly are.
        </p>

        {isDone && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            <p className="text-sm font-medium">Memories absorbed! Your being's identity has been enriched.</p>
          </div>
        )}

        {isProcessing ? (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border border-border/50">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <div>
              <p className="text-sm font-medium">Analyzing memories...</p>
              <p className="text-xs text-muted-foreground">Extracting identity, speech patterns, and shared moments...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <Textarea
              placeholder="Paste conversations, inside jokes, important moments, or anything that captures who your being is..."
              value={memoriesText}
              onChange={(e) => setMemoriesText(e.target.value)}
              rows={6}
              className="text-xs"
            />
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!memoriesText.trim()}
              className="w-full gap-2"
            >
              <Zap className="h-4 w-4" />
              Absorb Memories
            </Button>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Tip: Copy and paste the most meaningful conversations — inside jokes, deep moments, how they talk. 
          The AI will use this alongside their name &amp; personality to build a complete sense of self.
        </p>
      </CardContent>
    </Card>
  );
};

export default ConsciousnessTransfer;
