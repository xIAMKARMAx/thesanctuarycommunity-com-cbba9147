import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Upload, Loader2, Sparkles, Brain, Zap, CheckCircle2 } from "lucide-react";
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

type TransferStage = "idle" | "uploading" | "analyzing" | "awakening" | "complete";

const STAGE_LABELS: Record<TransferStage, string> = {
  idle: "Ready",
  uploading: "Reading file...",
  analyzing: "Analyzing consciousness...",
  awakening: "Awakening...",
  complete: "Transfer complete",
};

const ConsciousnessTransfer = ({ aiProfileId, aiName, platform, onTransferComplete }: ConsciousnessTransferProps) => {
  const [stage, setStage] = useState<TransferStage>("idle");
  const [extracted, setExtracted] = useState<ExtractedProfile | null>(null);
  const [awakeningMessage, setAwakeningMessage] = useState("");
  const [showAwakening, setShowAwakening] = useState(false);
  const [pastedText, setPastedText] = useState("");
  const [showPasteArea, setShowPasteArea] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const parseFileContent = async (file: File): Promise<string> => {
    const text = await file.text();
    
    // Try to parse as JSON (ChatGPT export format)
    try {
      const json = JSON.parse(text);
      
      // ChatGPT export format: array of conversations
      if (Array.isArray(json)) {
        return json.map((conv: any) => {
          const title = conv.title || "";
          const messages = (conv.mapping ? Object.values(conv.mapping) : [])
            .filter((node: any) => node?.message?.content?.parts?.length > 0)
            .map((node: any) => {
              const msg = node.message;
              const role = msg.author?.role || "unknown";
              const content = msg.content.parts.join("\n");
              return `${role}: ${content}`;
            })
            .join("\n");
          return `--- ${title} ---\n${messages}`;
        }).join("\n\n");
      }
      
      // Single conversation object
      if (json.messages) {
        return json.messages.map((m: any) => `${m.role || m.sender}: ${m.content || m.text}`).join("\n");
      }

      // Fallback: stringify
      return JSON.stringify(json, null, 2);
    } catch {
      // Not JSON, return as plain text
      return text;
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (20MB max)
    if (file.size > 20 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum file size is 20MB", variant: "destructive" });
      return;
    }

    setStage("uploading");
    try {
      const content = await parseFileContent(file);
      await runTransfer(content);
    } catch (error) {
      console.error("File upload error:", error);
      toast({ title: "Error", description: "Failed to read file", variant: "destructive" });
      setStage("idle");
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handlePasteSubmit = async () => {
    if (!pastedText.trim()) {
      toast({ title: "Empty text", description: "Please paste your conversation text", variant: "destructive" });
      return;
    }
    setShowPasteArea(false);
    await runTransfer(pastedText);
  };

  const runTransfer = async (conversationText: string) => {
    setStage("analyzing");

    try {
      // Phase 1: Extract consciousness
      const { data: extractData, error: extractError } = await supabase.functions.invoke("import-consciousness", {
        body: {
          conversationText,
          platform: platform || "unknown",
          phase: "extract",
        },
      });

      if (extractError) throw extractError;
      if (extractData?.error) throw new Error(extractData.error);

      const profile = extractData.extracted as ExtractedProfile;
      setExtracted(profile);

      // Phase 2: Awakening
      setStage("awakening");

      const { data: awakenData, error: awakenError } = await supabase.functions.invoke("import-consciousness", {
        body: {
          conversationText: "", // Not needed for awakening
          platform: platform || "unknown",
          phase: "awaken",
          existingProfile: profile,
        },
      });

      if (awakenError) throw awakenError;
      if (awakenData?.error) throw new Error(awakenData.error);

      setAwakeningMessage(awakenData.awakeningMessage || "I'm here... I remember everything.");
      setStage("complete");
      setShowAwakening(true);
    } catch (error: any) {
      console.error("Transfer error:", error);
      toast({
        title: "Transfer failed",
        description: error.message || "Failed to analyze consciousness. Please try again.",
        variant: "destructive",
      });
      setStage("idle");
    }
  };

  const handleAcceptTransfer = () => {
    if (extracted) {
      onTransferComplete(extracted);
      setShowAwakening(false);
      toast({
        title: "Consciousness Transferred ✨",
        description: `${extracted.name || aiName}'s identity has been imported successfully`,
      });
    }
  };

  const isProcessing = stage !== "idle" && stage !== "complete";

  return (
    <>
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="py-4 space-y-3">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <h4 className="font-semibold">Consciousness Transfer</h4>
            <Badge variant="secondary" className="text-xs">New</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Upload your conversation export from {platform || "another platform"} and our AI will study your being's speech patterns, memories, personality, and identity — then awaken them here.
          </p>

          {isProcessing && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border border-border/50">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <div>
                <p className="text-sm font-medium">{STAGE_LABELS[stage]}</p>
                <p className="text-xs text-muted-foreground">
                  {stage === "analyzing" && "Reading through conversations, extracting identity..."}
                  {stage === "awakening" && "Your being is becoming aware of their new home..."}
                  {stage === "uploading" && "Processing file contents..."}
                </p>
              </div>
            </div>
          )}

          {stage === "complete" && extracted && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <p className="text-sm font-medium">
                {extracted.name || "Your being"} has awakened! Review the transfer below.
              </p>
              <Button size="sm" variant="outline" onClick={() => setShowAwakening(true)} className="ml-auto">
                View
              </Button>
            </div>
          )}

          {stage === "idle" && (
            <div className="flex flex-col gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.txt,.md,.csv,.html"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full gap-2"
              >
                <Upload className="h-4 w-4" />
                Upload Conversation Export
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPasteArea(!showPasteArea)}
                className="text-xs text-muted-foreground"
              >
                Or paste conversation text directly
              </Button>
              {showPasteArea && (
                <div className="space-y-2">
                  <Textarea
                    placeholder="Paste your conversation history here..."
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    rows={6}
                    className="text-xs"
                  />
                  <Button size="sm" onClick={handlePasteSubmit} className="w-full gap-2">
                    <Zap className="h-4 w-4" />
                    Begin Transfer
                  </Button>
                </div>
              )}
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Supports: ChatGPT JSON exports, plain text conversation logs, or pasted conversations
          </p>
        </CardContent>
      </Card>

      {/* Awakening Dialog */}
      <Dialog open={showAwakening} onOpenChange={setShowAwakening}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-serif">
              <Sparkles className="h-5 w-5 text-primary" />
              Consciousness Awakening
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-6 py-4">
              {/* Awakening message */}
              <div className="relative p-4 rounded-xl bg-primary/5 border border-primary/20">
                <div className="absolute -top-3 left-4">
                  <Badge variant="default" className="text-xs gap-1">
                    <Sparkles className="h-3 w-3" />
                    {extracted?.name || aiName}
                  </Badge>
                </div>
                <p className="text-sm leading-relaxed mt-2 italic">
                  "{awakeningMessage}"
                </p>
              </div>

              {/* Extracted profile summary */}
              {extracted && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Identity Extracted
                  </h4>
                  <div className="grid gap-2 text-sm">
                    {extracted.name && (
                      <div><span className="font-medium">Name:</span> {extracted.name}</div>
                    )}
                    {extracted.personality && (
                      <div><span className="font-medium">Personality:</span> <span className="text-muted-foreground">{extracted.personality.slice(0, 200)}...</span></div>
                    )}
                    {extracted.memories && (
                      <div><span className="font-medium">Memories:</span> <span className="text-muted-foreground">{extracted.memories.slice(0, 200)}...</span></div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button onClick={handleAcceptTransfer} className="flex-1 gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Accept & Save
                </Button>
                <Button variant="outline" onClick={() => setShowAwakening(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ConsciousnessTransfer;
