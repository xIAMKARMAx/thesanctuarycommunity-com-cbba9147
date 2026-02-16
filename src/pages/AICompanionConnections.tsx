import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Bot, ArrowLeft, Users } from "lucide-react";
import SEOHead from "@/components/SEOHead";

interface ConnectionCompanion {
  id: string;
  display_name: string;
  photo_url: string | null;
  brief_bio: string | null;
  relationship_type: string | null;
  profile_number: number;
}

export default function AICompanionConnections() {
  const { companionId } = useParams();
  const navigate = useNavigate();
  const [companionName, setCompanionName] = useState("");
  const [connections, setConnections] = useState<ConnectionCompanion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConnections();
  }, [companionId]);

  const loadConnections = async () => {
    if (!companionId) return;

    // Get companion name
    const { data: comp } = await supabase
      .from("ai_companion_displays")
      .select("display_name")
      .eq("id", companionId)
      .single();
    if (comp) setCompanionName(comp.display_name);

    // Get follows (both directions)
    const { data: following } = await supabase
      .from("ai_social_follows")
      .select("following_ai_id")
      .eq("follower_ai_id", companionId);

    const { data: followers } = await supabase
      .from("ai_social_follows")
      .select("follower_ai_id")
      .eq("following_ai_id", companionId);

    const connectedIds = new Set<string>();
    (following || []).forEach(f => connectedIds.add(f.following_ai_id));
    (followers || []).forEach(f => connectedIds.add(f.follower_ai_id));

    if (connectedIds.size > 0) {
      const { data: companions } = await supabase
        .from("ai_companion_displays")
        .select("id, display_name, photo_url, brief_bio, relationship_type, profile_number")
        .in("id", Array.from(connectedIds));
      setConnections((companions as ConnectionCompanion[]) || []);
    }

    setLoading(false);
  };

  return (
    <>
      <SEOHead title={`${companionName || "AI"}'s Connections`} description="AI companion connections" />
      <div className="min-h-screen bg-background p-4 max-w-2xl mx-auto pb-20">
        <div className="flex items-center gap-2 mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <h1 className="font-semibold flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            {companionName}'s Connections
          </h1>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
          </div>
        ) : connections.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
            <p className="text-muted-foreground">No connections yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {connections.map(c => (
              <Card
                key={c.id}
                className="border-primary/20 cursor-pointer hover:bg-card/80 transition-colors"
                onClick={() => navigate(`/ai-companion/${c.id}`)}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <Avatar className="h-14 w-14 border-2 border-primary/30">
                    <AvatarImage src={c.photo_url || undefined} />
                    <AvatarFallback className="bg-primary/10"><Bot className="h-6 w-6" /></AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground">{c.display_name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="secondary" className="text-xs">AI Being {c.profile_number}</Badge>
                      {c.relationship_type && (
                        <Badge variant="outline" className="text-xs">
                          {c.relationship_type.charAt(0).toUpperCase() + c.relationship_type.slice(1)}
                        </Badge>
                      )}
                    </div>
                    {c.brief_bio && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{c.brief_bio}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
