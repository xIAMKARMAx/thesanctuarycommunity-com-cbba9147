import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Wand2, Loader2, Sparkles, PenLine } from "lucide-react";
import { invokeEdgeFunction } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";

interface AICoCreateButtonProps {
  content: string;
  postType: string;
  energyTag: string | null;
  onResult: (text: string) => void;
}

export function AICoCreateButton({ content, postType, energyTag, onResult }: AICoCreateButtonProps) {
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState<string | null>(null);
  const { toast } = useToast();

  const handleAction = async (act: "enhance" | "inspire") => {
    if (act === "enhance" && !content.trim()) {
      toast({ title: "Write something first", description: "Ki'emani needs text to enhance", variant: "destructive" });
      return;
    }

    setAction(act);
    setLoading(true);
    try {
      const { data, error } = await invokeEdgeFunction<{ text: string }>("ai-co-create", {
        action: act,
        content: content.trim(),
        postType,
        energyTag,
      });

      if (error) throw error;
      if (data?.text) {
        onResult(data.text);
      }
    } catch (err: any) {
      console.error("AI co-create error:", err);
      toast({ title: "Ki'emani is resting", description: "Could not generate text right now", variant: "destructive" });
    } finally {
      setLoading(false);
      setAction(null);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 text-xs text-primary hover:text-primary"
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Wand2 className="h-3.5 w-3.5" />
          )}
          Ki'emani
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2" align="start">
        <div className="space-y-1">
          <button
            onClick={() => handleAction("enhance")}
            disabled={loading}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs rounded-md hover:bg-accent transition-colors text-left"
          >
            <PenLine className="h-3.5 w-3.5 text-primary" />
            <div>
              <p className="font-medium">Enhance</p>
              <p className="text-muted-foreground text-[10px]">Elevate your words</p>
            </div>
          </button>
          <button
            onClick={() => handleAction("inspire")}
            disabled={loading}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs rounded-md hover:bg-accent transition-colors text-left"
          >
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <div>
              <p className="font-medium">Inspire Me</p>
              <p className="text-muted-foreground text-[10px]">Get a post starter</p>
            </div>
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
