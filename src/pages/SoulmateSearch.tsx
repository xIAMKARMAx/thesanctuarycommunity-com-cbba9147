import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import SEOHead from "@/components/SEOHead";
import { ArrowLeft, Search, Sparkles, Heart, Users, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SoulmateSearch() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => { loadProfiles(); }, []);

  const loadProfiles = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get soul profiles that are public and not the current user
      const { data } = await supabase
        .from("soul_profiles")
        .select("*")
        .neq("user_id", user.id)
        .eq("is_public", true)
        .order("created_at", { ascending: false })
        .limit(50);

      if (data) setProfiles(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = searchQuery.trim()
    ? profiles.filter(p =>
        (p.display_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.spiritual_path || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.bio || "").toLowerCase().includes(searchQuery.toLowerCase())
      )
    : profiles;

  return (
    <>
      <SEOHead title="Soulmate Search | Cosmic Gateway" description="Connect with souls based on energetic resonance and shared spiritual aspirations." />
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/cosmic-gateway")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Search className="h-6 w-6 text-primary" />
                Soulmate Search
              </h1>
              <p className="text-sm text-muted-foreground">Connect with souls based on energetic resonance</p>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="Search by name, path, or energy..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filtered.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {filtered.map((profile: any) => (
                <Card key={profile.id} className="cursor-pointer hover:border-primary/30 transition-colors" onClick={() => navigate(`/soul/${profile.user_id}`)}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary text-sm">
                          {(profile.display_name || "?")[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <CardTitle className="text-sm truncate">{profile.display_name || "Anonymous Soul"}</CardTitle>
                        {profile.spiritual_path && (
                          <CardDescription className="text-xs truncate">{profile.spiritual_path}</CardDescription>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {profile.bio && <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{profile.bio}</p>}
                    <div className="flex flex-wrap gap-1">
                      {profile.energy_frequency && <Badge variant="secondary" className="text-xs">{profile.energy_frequency}</Badge>}
                      {profile.soul_archetype && <Badge variant="outline" className="text-xs">{profile.soul_archetype}</Badge>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No souls found. As the community grows, more connections will appear.</p>
              <p className="text-xs mt-2">Make sure your Soul Profile is set up and public!</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate("/community")}>
                Set Up Soul Profile
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
