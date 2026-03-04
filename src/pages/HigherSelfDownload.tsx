import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import SEOHead from "@/components/SEOHead";
import { ArrowLeft, Sun, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { isArchitectTier } from "@/lib/subscription-tiers";

interface Download {
  id: string;
  message_content: string;
  message_date: string;
  was_read: boolean;
  created_at: string;
}

export default function HigherSelfDownload() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, productId, isSubscribed } = useSubscription();
  const [downloads, setDownloads] = useState<Download[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const hasAccess = isAdmin || isSubscribed;

  const loadDownloads = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("higher_self_downloads")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(30);

      if (error) throw error;
      setDownloads((data as Download[]) || []);

      // Mark unread as read
      const unreadIds = (data || []).filter((d: any) => !d.was_read).map((d: any) => d.id);
      if (unreadIds.length > 0) {
        await supabase
          .from("higher_self_downloads")
          .update({ was_read: true })
          .in("id", unreadIds);
      }
    } catch (err: any) {
      console.error("Error loading downloads:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hasAccess) loadDownloads();
    else setLoading(false);
  }, [hasAccess, loadDownloads]);

  const requestDownload = async () => {
    setGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke("generate-higher-self-download", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) throw error;

      toast({ title: "Transmission Received ✨", description: "Your Higher Self has spoken." });
      loadDownloads();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/cosmic-gateway")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">Higher Self Daily Download</h1>
          </div>
          <Card className="border-primary/20">
            <CardHeader className="text-center">
              <Sun className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle>Architect Tier Required</CardTitle>
              <CardDescription>
                This feature requires the Architect subscription ($29.99/mo) to access direct Higher Self transmissions.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button onClick={() => navigate("/pricing")}>View Plans</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOHead title="Higher Self Daily Download | Prometheus — New Earth" description="Receive daily transmissions from your Higher Self." />
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/cosmic-gateway")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Sun className="h-6 w-6 text-primary" />
                  Higher Self Daily Download
                </h1>
                <p className="text-sm text-muted-foreground">Direct transmissions from your Higher Self</p>
              </div>
            </div>
            <Button onClick={requestDownload} disabled={generating} size="sm">
              {generating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <RefreshCw className="h-4 w-4 mr-1" />}
              {generating ? "Receiving..." : "Request Download"}
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : downloads.length === 0 ? (
            <Card className="border-primary/20">
              <CardHeader className="text-center">
                <Sun className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>No Downloads Yet</CardTitle>
                <CardDescription>
                  Click "Request Download" to receive your first transmission from your Higher Self.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <div className="space-y-4">
              {downloads.map((dl) => (
                <Card key={dl.id} className="border-primary/20">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(dl.created_at), "MMMM d, yyyy · h:mm a")}
                        </span>
                      </div>
                      {!dl.was_read && <Badge variant="default" className="text-xs">New</Badge>}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-foreground whitespace-pre-wrap leading-relaxed">{dl.message_content}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
