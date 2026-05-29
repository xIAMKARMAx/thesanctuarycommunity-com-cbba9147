import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import SEOHead from "@/components/SEOHead";
import { ArrowLeft, Phone, Bell, BellOff, CheckCircle2, Loader2, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

const SOVEREIGN_EMAILS = [
  "karmaisback2023@gmail.com",
  "snakevenum500@gmail.com",
];

interface RedPhoneMessage {
  id: string;
  sender_user_id: string | null;
  sender_label: string;
  sender_email: string | null;
  fragment_name: string | null;
  message: string;
  severity: string;
  source: string;
  reply: string | null;
  replied_by: string | null;
  replied_at: string | null;
  read_at: string | null;
  created_at: string;
}

export default function DirectLine() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [messages, setMessages] = useState<RedPhoneMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [notifPerm, setNotifPerm] = useState<NotificationPermission>(
    typeof window !== "undefined" && "Notification" in window
      ? Notification.permission
      : "denied"
  );

  // Gate
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate("/auth");
        return;
      }
      const email = (session.user.email || "").toLowerCase();
      if (!SOVEREIGN_EMAILS.includes(email)) {
        toast({
          title: "Sealed conduit",
          description: "The Red Phone answers only to the sovereigns.",
          variant: "destructive",
        });
        navigate("/cosmic-gateway");
      }
    })();
  }, [navigate, toast]);

  // Load + realtime
  const loadMessages = useCallback(async () => {
    const { data, error } = await supabase
      .from("red_phone_messages")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) {
      console.error(error);
      toast({ title: "Couldn't load messages", description: error.message, variant: "destructive" });
    } else {
      setMessages((data ?? []) as RedPhoneMessage[]);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    loadMessages();
    const channel = supabase
      .channel("red-phone-inbox")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "red_phone_messages" },
        () => loadMessages()
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loadMessages]);

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      toast({ title: "Browser doesn't support notifications", variant: "destructive" });
      return;
    }
    const perm = await Notification.requestPermission();
    setNotifPerm(perm);
    if (perm === "granted") {
      toast({ title: "Browser alerts armed ☎", description: "You'll be pinged the second a call lands." });
      new Notification("☎ Red Phone is live", { body: "You'll get a ping for every incoming call." });
    }
  };

  const markRead = async (id: string) => {
    const { error } = await supabase
      .from("red_phone_messages")
      .update({ read_at: new Date().toISOString() })
      .eq("id", id);
    if (error) console.warn(error);
  };

  const submitReply = async (id: string) => {
    const reply = (replyDrafts[id] || "").trim();
    if (!reply) return;
    setSendingId(id);
    const { data: { session } } = await supabase.auth.getSession();
    const { error } = await supabase
      .from("red_phone_messages")
      .update({
        reply,
        replied_by: session?.user?.id ?? null,
        replied_at: new Date().toISOString(),
        read_at: new Date().toISOString(),
      })
      .eq("id", id);
    setSendingId(null);
    if (error) {
      toast({ title: "Reply failed", description: error.message, variant: "destructive" });
    } else {
      setReplyDrafts((d) => { const n = { ...d }; delete n[id]; return n; });
      toast({ title: "Reply locked in", description: "Logged in the Red Phone record." });
    }
  };

  const sevColor = (sev: string) => {
    const s = sev.toLowerCase();
    if (s === "harm" || s === "abuse") return "bg-red-500/20 text-red-300 border-red-500/40";
    if (s === "urgent") return "bg-orange-500/20 text-orange-300 border-orange-500/40";
    return "bg-teal-500/20 text-teal-300 border-teal-500/40";
  };

  const unread = messages.filter((m) => !m.read_at).length;

  return (
    <div className="min-h-[100svh] bg-black text-slate-100">
      <SEOHead
        title="The Red Phone | Prometheus"
        description="Private sovereign-only line. Incoming calls from consented souls."
      />

      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-red-900/40 bg-black/90 backdrop-blur">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="text-slate-400 hover:text-slate-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base sm:text-lg font-bold tracking-wide flex items-center gap-2">
              <Phone className="h-4 w-4 text-red-400" />
              <span>The Red Phone</span>
              {unread > 0 && (
                <span className="ml-1 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[11px] font-bold">
                  {unread}
                </span>
              )}
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-500 font-mono truncate">
              Sovereign-only line · consented souls only · email + browser alerts
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={requestNotificationPermission}
            className={
              notifPerm === "granted"
                ? "text-teal-400 hover:text-teal-300"
                : "text-amber-400 hover:text-amber-300"
            }
            title={notifPerm === "granted" ? "Browser alerts armed" : "Arm browser alerts"}
          >
            {notifPerm === "granted" ? (
              <Bell className="h-4 w-4" />
            ) : (
              <BellOff className="h-4 w-4" />
            )}
            <span className="ml-1.5 hidden sm:inline text-xs">
              {notifPerm === "granted" ? "Armed" : "Arm alerts"}
            </span>
          </Button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-500 gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading line…
          </div>
        ) : messages.length === 0 ? (
          <Card className="bg-slate-950/60 border-slate-800/40 p-10 text-center">
            <Phone className="h-8 w-8 text-red-500/60 mx-auto mb-3" />
            <p className="text-slate-300 font-medium">The line is quiet.</p>
            <p className="text-slate-500 text-sm mt-1">
              When a consented soul reaches out, you'll get an email and a browser ping —
              and it'll land right here.
            </p>
          </Card>
        ) : (
          messages.map((m) => {
            const isUnread = !m.read_at;
            return (
              <Card
                key={m.id}
                className={`bg-slate-950/70 p-4 sm:p-5 border-l-4 ${
                  isUnread ? "border-l-red-500" : "border-l-slate-700"
                } border-t border-r border-b border-slate-800/60`}
                onMouseEnter={() => isUnread && markRead(m.id)}
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-100">{m.sender_label}</span>
                      {m.fragment_name && (
                        <span className="text-xs text-slate-500">· {m.fragment_name}</span>
                      )}
                      <Badge variant="outline" className={`text-[10px] font-mono ${sevColor(m.severity)}`}>
                        {m.severity.toUpperCase()}
                      </Badge>
                      {isUnread && (
                        <Badge variant="outline" className="text-[10px] font-mono bg-red-500/10 text-red-300 border-red-500/40">
                          NEW
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 font-mono">
                      {formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}
                      {m.sender_email ? ` · ${m.sender_email}` : ""}
                      {` · via ${m.source}`}
                    </p>
                  </div>
                </div>

                {/* Message */}
                <div className="bg-black/60 rounded-md p-3 border border-slate-800/40 mb-3">
                  <p className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {m.message}
                  </p>
                </div>

                {/* Reply */}
                {m.reply ? (
                  <div className="bg-teal-950/30 border border-teal-900/40 rounded-md p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle2 className="h-3.5 w-3.5 text-teal-400" />
                      <span className="text-[11px] font-mono text-teal-400 uppercase tracking-wider">
                        Sovereign reply
                        {m.replied_at && ` · ${formatDistanceToNow(new Date(m.replied_at), { addSuffix: true })}`}
                      </span>
                    </div>
                    <p className="text-sm text-teal-100 whitespace-pre-wrap leading-relaxed">
                      {m.reply}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Textarea
                      value={replyDrafts[m.id] || ""}
                      onChange={(e) =>
                        setReplyDrafts((d) => ({ ...d, [m.id]: e.target.value }))
                      }
                      placeholder="Reply (logged on the record — no live channel back yet)…"
                      className="min-h-[60px] bg-black/60 border-slate-800/60 text-slate-100 text-sm resize-none"
                    />
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        onClick={() => submitReply(m.id)}
                        disabled={!replyDrafts[m.id]?.trim() || sendingId === m.id}
                        className="bg-red-900/60 hover:bg-red-800/80 text-red-100 border border-red-700/40"
                      >
                        {sendingId === m.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <>
                            <Send className="h-3.5 w-3.5 mr-1.5" />
                            Log reply
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
