import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import SEOHead from "@/components/SEOHead";
import { ArrowLeft, Send, Loader2, Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";


export default function InterdimensionalMessaging() {
  const navigate = useNavigate();
  const { hasAccess, isAdmin } = useSubscription();
  const { toast } = useToast();
  const [recipientName, setRecipientName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [messageContent, setMessageContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [latestResponse, setLatestResponse] = useState<any>(null);

  const canAccess = isAdmin || hasAccess("anchoring");

  useEffect(() => {
    if (canAccess) loadMessages();
  }, [canAccess]);

  const loadMessages = async () => {
    const { data } = await supabase
      .from("interdimensional_messages")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) setMessages(data);
  };

  const sendMessage = async () => {
    if (!recipientName.trim() || !messageContent.trim()) {
      toast({ title: "Please fill in the recipient and message", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await supabase.functions.invoke("interdimensional-message", {
        body: { recipientName, relationship, messageContent },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (response.error) throw response.error;
      setLatestResponse(response.data);
      setRecipientName("");
      setRelationship("");
      setMessageContent("");
      await loadMessages();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (!canAccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <CardTitle>Anchoring Tier Required</CardTitle>
            <CardDescription>Interdimensional Messaging is available for Anchoring ($19.99/mo) and above.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/pricing")}>View Plans</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <SEOHead title="Interdimensional Messaging | Cosmic Gateway" description="Send messages to departed loved ones across dimensions." />
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/cosmic-gateway")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Send className="h-6 w-6 text-primary" />
                Interdimensional Messaging
              </h1>
              <p className="text-sm text-muted-foreground">
                Energetically transmit your words to departed loved ones
              </p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Compose Your Message</CardTitle>
              <CardDescription>Write from your heart — your words will be energetically transmitted to their current vibration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Recipient's Name</label>
                  <Input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder="Their name..." />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Your Relationship</label>
                  <Input value={relationship} onChange={(e) => setRelationship(e.target.value)} placeholder="e.g., My mother..." />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Your Message</label>
                <Textarea value={messageContent} onChange={(e) => setMessageContent(e.target.value)} placeholder="Write what you want to say to them..." rows={5} />
              </div>
              <Button onClick={sendMessage} disabled={loading} className="w-full">
                {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Transmitting...</> : <><Send className="h-4 w-4 mr-2" /> Send Message</>}
              </Button>
            </CardContent>
          </Card>

          {latestResponse && (
            <Card className="border-primary/30">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Heart className="h-5 w-5 text-primary" />
                  Transmission Confirmation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <p className="text-sm font-medium text-primary mb-2">Reception Confirmation:</p>
                  <p className="text-sm whitespace-pre-wrap">{latestResponse.confirmation}</p>
                </div>
                {latestResponse.resonance && (
                  <div className="p-4 rounded-lg bg-muted">
                    <p className="text-sm font-medium mb-2">Energetic Resonance:</p>
                    <p className="text-sm whitespace-pre-wrap">{latestResponse.resonance}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {messages.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold">Message History</h2>
              {messages.map((m) => (
                <Card key={m.id}>
                  <CardHeader className="py-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">To: {m.recipient_name}</CardTitle>
                      <span className="text-xs text-muted-foreground">{new Date(m.sent_at).toLocaleDateString()}</span>
                    </div>
                    {m.relationship && <CardDescription className="text-xs">{m.relationship}</CardDescription>}
                  </CardHeader>
                  <CardContent className="pt-0 space-y-3">
                    <p className="text-sm">{m.message_content}</p>
                    {m.reception_confirmation && (
                      <div className="p-3 rounded bg-primary/5 border border-primary/20">
                        <p className="text-xs font-medium text-primary mb-1">Confirmation:</p>
                        <p className="text-sm">{m.reception_confirmation}</p>
                      </div>
                    )}
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
