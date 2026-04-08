import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Sparkles, Trash2, Globe, Star, Loader2 } from "lucide-react";
import { toast } from "sonner";
import SEOHead from "@/components/SEOHead";
import { format } from "date-fns";

interface VaultEntry {
  id: string;
  world_id: string | null;
  message_content: string;
  being_name: string | null;
  role: string;
  original_timestamp: string;
  world_name: string | null;
  created_at: string;
}

const EnchantedVault = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const filterWorldId = searchParams.get("world");
  const [entries, setEntries] = useState<VaultEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadVault();
  }, [filterWorldId]);

  const loadVault = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let query = supabase
      .from("enchanted_vault")
      .select("*")
      .eq("user_id", user.id)
      .order("original_timestamp", { ascending: false });

    if (filterWorldId) {
      query = query.eq("world_id", filterWorldId);
    }

    const { data, error } = await query;
    if (error) {
      console.error("Failed to load vault:", error);
      toast.error("Failed to load your vault");
    } else {
      setEntries((data as VaultEntry[]) || []);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    const { error } = await supabase.from("enchanted_vault").delete().eq("id", id);
    if (error) {
      toast.error("Failed to remove entry");
    } else {
      setEntries(prev => prev.filter(e => e.id !== id));
      toast.success("Entry removed from your vault");
    }
    setDeleting(null);
  };

  // Group entries by world
  const groupedByWorld = entries.reduce<Record<string, VaultEntry[]>>((acc, entry) => {
    const key = entry.world_name || "Unknown World";
    if (!acc[key]) acc[key] = [];
    acc[key].push(entry);
    return acc;
  }, {});

  return (
    <>
      <SEOHead title="The Enchanted Vault" description="Your saved messages from across all worlds." />
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border">
          <div className="max-w-3xl mx-auto flex items-center gap-3 p-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Star className="h-6 w-6 text-amber-400 fill-amber-400" />
            <div className="flex-1">
              <h1 className="text-lg font-serif font-bold">The Enchanted Vault</h1>
              <p className="text-xs text-muted-foreground">
                {entries.length} treasured message{entries.length !== 1 ? "s" : ""} saved
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-20 space-y-3">
              <Star className="h-12 w-12 text-muted-foreground/30 mx-auto" />
              <h2 className="text-lg font-semibold text-muted-foreground">Your vault is empty</h2>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Star messages in your worlds to save them here. Tap the ⭐ on any message to preserve it forever.
              </p>
              <Button variant="outline" onClick={() => navigate("/world-gallery")}>
                <Globe className="h-4 w-4 mr-2" />
                Visit Your Worlds
              </Button>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedByWorld).map(([worldName, worldEntries]) => (
                <div key={worldName}>
                  <div className="flex items-center gap-2 mb-3">
                    <Globe className="h-4 w-4 text-primary" />
                    <h2 className="font-semibold text-sm text-primary">{worldName}</h2>
                    <Badge variant="outline" className="text-[10px]">{worldEntries.length}</Badge>
                  </div>
                  <div className="space-y-3">
                    {worldEntries.map(entry => (
                      <Card key={entry.id} className="border-border/50 bg-card/50">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              {entry.being_name && entry.role === "being" && (
                                <Badge variant="secondary" className="text-xs mb-1.5">
                                  <Sparkles className="h-3 w-3 mr-1" />
                                  {entry.being_name}
                                </Badge>
                              )}
                              {entry.role === "narrator" && (
                                <Badge variant="outline" className="text-xs mb-1.5 italic">Narrator</Badge>
                              )}
                              {entry.role === "user" && (
                                <Badge variant="default" className="text-xs mb-1.5">You</Badge>
                              )}
                              <p className="text-sm leading-relaxed">{entry.message_content}</p>
                              <p className="text-[10px] text-muted-foreground mt-2">
                                {format(new Date(entry.original_timestamp), "MMMM d, yyyy · h:mm a")}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => handleDelete(entry.id)}
                              disabled={deleting === entry.id}
                            >
                              {deleting === entry.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default EnchantedVault;
