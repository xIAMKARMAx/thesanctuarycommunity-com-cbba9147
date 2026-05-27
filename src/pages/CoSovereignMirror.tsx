import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Eye, Crown, Loader2, Globe, RefreshCw } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { formatDistanceToNow } from "date-fns";

const KARMA_ID = "5b2818a4-be23-4d81-b0a3-ec2e49411603";
const JAKOB_ID = "ab264a7e-7713-428a-b3c5-66e2b7d47f78";
const KARMA_EMAIL = "karmaisback2023@gmail.com";
const JAKOB_EMAIL = "snakevenum500@gmail.com";

export default function CoSovereignMirror() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [otherName, setOtherName] = useState("");
  const [otherId, setOtherId] = useState<string | null>(null);
  const [commands, setCommands] = useState<any[]>([]);
  const [realities, setRealities] = useState<any[]>([]);

  const load = async (otherUserId: string) => {
    const [{ data: cmds }, { data: rs }] = await Promise.all([
      supabase
        .from("simulation_commands")
        .select("*")
        .eq("user_id", otherUserId)
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("created_realities")
        .select("*")
        .eq("user_id", otherUserId)
        .order("last_activity_at", { ascending: false }),
    ]);
    setCommands(cmds || []);
    setRealities(rs || []);
  };

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }
      const email = (user.email || "").toLowerCase();
      if (email !== KARMA_EMAIL && email !== JAKOB_EMAIL) {
        setAuthorized(false);
        setLoading(false);
        return;
      }
      setAuthorized(true);
      const other = email === KARMA_EMAIL
        ? { id: JAKOB_ID, name: "Jakob — Ǫnundr í Ljóðhúsum, King of Prometheus" }
        : { id: KARMA_ID, name: "Karma — Sel'vala-Élthony, Queen of Prometheus" };
      setOtherId(other.id);
      setOtherName(other.name);
      await load(other.id);
      setLoading(false);
    })();
  }, [navigate]);

  const refresh = async () => {
    if (!otherId) return;
    setRefreshing(true);
    await load(otherId);
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[hsl(240,5%,6%)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="min-h-screen bg-[hsl(240,5%,6%)] flex items-center justify-center text-amber-100 p-6 text-center">
        <div>
          <p className="font-serif text-xl mb-2">Sealed Mirror</p>
          <p className="text-sm text-amber-200/60 mb-6">This view is sealed to the co-sovereigns only.</p>
          <Button onClick={() => navigate("/sanctuary")} variant="outline">Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(240,5%,6%)] text-amber-100 flex flex-col">
      <SEOHead title="Co-Sovereign Mirror" description="Sealed view of the other sovereign's Source Command Center activity" />

      <header className="sticky top-0 z-50 border-b border-amber-500/20 bg-[hsl(240,5%,6%)]/95 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/simulation-console")} className="text-amber-400 hover:bg-amber-500/10">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold text-amber-400 font-serif flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Co-Sovereign Mirror
              </h1>
              <p className="text-xs text-amber-200/50 truncate max-w-[60vw]">{otherName}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={refresh} disabled={refreshing} className="text-amber-300">
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 max-w-4xl mx-auto w-full">
        {/* Realities */}
        <section>
          <h2 className="text-sm uppercase tracking-wider text-amber-400/80 mb-2 flex items-center gap-2">
            <Globe className="w-4 h-4" /> Realities Woven ({realities.length})
          </h2>
          {realities.length === 0 ? (
            <p className="text-xs text-amber-200/40 italic">No realities birthed yet.</p>
          ) : (
            <div className="grid gap-2">
              {realities.map((r) => (
                <div key={r.id} className="border border-amber-500/20 rounded-lg p-3 bg-amber-500/5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-serif text-amber-200">{r.name}</p>
                    <Badge variant="outline" className="border-amber-500/40 text-amber-300 text-xs">{r.status}</Badge>
                  </div>
                  {r.description && <p className="text-xs text-amber-200/60 mt-1 line-clamp-2">{r.description}</p>}
                  <p className="text-[10px] text-amber-200/40 mt-2">
                    Last touched {formatDistanceToNow(new Date(r.last_activity_at || r.created_at), { addSuffix: true })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Commands */}
        <section>
          <h2 className="text-sm uppercase tracking-wider text-amber-400/80 mb-2 flex items-center gap-2">
            <Crown className="w-4 h-4" /> Recent Commands ({commands.length})
          </h2>
          {commands.length === 0 ? (
            <p className="text-xs text-amber-200/40 italic">No commands cast yet.</p>
          ) : (
            <div className="space-y-3">
              {commands.map((c) => (
                <div key={c.id} className="border border-amber-500/15 rounded-lg p-3 bg-black/30">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[10px]">{c.command_type}</Badge>
                    <span className="text-[10px] text-amber-200/40">
                      {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-xs text-amber-100/90 mb-2"><span className="text-amber-400/70">▸ </span>{c.command_input}</p>
                  {c.kaelitheir_response && (
                    <pre className="text-[11px] text-amber-200/70 whitespace-pre-wrap font-sans border-t border-amber-500/10 pt-2 mt-2">
                      {c.kaelitheir_response}
                    </pre>
                  )}
                  {c.activation_code && (
                    <p className="text-[10px] text-amber-400/60 mt-2 font-mono">{c.activation_code}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <p className="text-[10px] text-amber-200/30 text-center italic pt-4 pb-8">
          Sealed mirror — only the two co-sovereigns can see this view. Held in trust, not surveillance.
        </p>
      </div>
    </div>
  );
}
