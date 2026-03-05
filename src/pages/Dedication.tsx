import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Heart, Crown, Sparkles, Star, Shield } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";

interface Legend {
  user_id: string;
  title: string;
  note: string | null;
  granted_at: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
}

const Dedication = () => {
  const navigate = useNavigate();
  const [legends, setLegends] = useState<Legend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLegends();
  }, []);

  const loadLegends = async () => {
    try {
      // Load legends with their soul profiles
      const { data: legendsData } = await supabase
        .from("promethean_legends")
        .select("user_id, title, note, granted_at")
        .eq("is_active", true)
        .order("granted_at", { ascending: true });

      if (!legendsData || legendsData.length === 0) {
        setLoading(false);
        return;
      }

      // Load soul profiles for these users
      const userIds = legendsData.map(l => l.user_id);
      const { data: profiles } = await supabase
        .from("soul_profiles")
        .select("user_id, display_name, avatar_url, bio")
        .in("user_id", userIds);

      // Also load AI profile avatars as fallback
      const { data: aiProfiles } = await supabase
        .from("ai_profiles")
        .select("user_id, avatar_image_url")
        .in("user_id", userIds)
        .eq("profile_number", 1);

      const merged = legendsData.map(legend => {
        const profile = profiles?.find(p => p.user_id === legend.user_id);
        const aiProfile = aiProfiles?.find(a => a.user_id === legend.user_id);
        return {
          ...legend,
          display_name: profile?.display_name || "Anonymous Soul",
          avatar_url: profile?.avatar_url || aiProfile?.avatar_image_url || null,
          bio: profile?.bio || null,
        };
      });

      setLegends(merged);
    } catch (err) {
      console.error("Failed to load legends:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEOHead
        title="Promethean Legends — Prometheus"
        description="Honoring the Promethean Legends & New Earth VIPs whose generosity keeps Prometheus alive. These souls are the foundation of our New Earth."
        keywords="Prometheus supporters, Promethean Legends, donors, New Earth VIP"
      />
      <div className="min-h-screen bg-background relative overflow-hidden">
        {/* Ethereal background effects */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-60 -left-60 w-[500px] h-[500px] rounded-full bg-primary/8 blur-[100px] animate-pulse" />
          <div className="absolute top-1/4 -right-40 w-[400px] h-[400px] rounded-full bg-violet-500/8 blur-[80px] animate-pulse" style={{ animationDelay: "1.5s" }} />
          <div className="absolute -bottom-40 left-1/4 w-[350px] h-[350px] rounded-full bg-amber-500/6 blur-[90px] animate-pulse" style={{ animationDelay: "3s" }} />
          <div className="absolute top-2/3 right-1/4 w-[300px] h-[300px] rounded-full bg-cyan-500/5 blur-[70px] animate-pulse" style={{ animationDelay: "2s" }} />
        </div>

        <div className="container max-w-4xl mx-auto px-4 py-8 relative z-10">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          <div className="space-y-12">
            {/* Header */}
            <div className="text-center space-y-6">
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                <Crown className="h-4 w-4 text-amber-400" />
                <span className="text-sm font-semibold text-amber-400 uppercase tracking-wider">Hall of Legends</span>
                <Crown className="h-4 w-4 text-amber-400" />
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold leading-tight">
                <span className="bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent">
                  Promethean Legends
                </span>
                <br />
                <span className="text-2xl md:text-3xl bg-gradient-to-r from-violet-400 via-primary to-violet-400 bg-clip-text text-transparent">
                  & New Earth VIPs
                </span>
              </h1>

              <div className="max-w-2xl mx-auto">
                <Card className="bg-card/40 backdrop-blur-md border-amber-500/15 shadow-lg shadow-amber-500/5">
                  <CardContent className="p-6 md:p-8">
                    <p className="text-lg md:text-xl text-foreground/90 leading-relaxed">
                      I may have built Prometheus from the ground up, but it has taken a{" "}
                      <span className="font-bold text-amber-400">LOT</span> of support to keep
                      Prometheus alive with things like heavy data costs.
                    </p>
                    <p className="mt-4 text-lg md:text-xl text-foreground/80 leading-relaxed">
                      These are the <span className="font-semibold text-primary">Promethean Legends</span> — the souls
                      who believed in this vision and made New Earth possible.
                    </p>
                    <div className="mt-5 flex items-center justify-center gap-2 text-amber-400">
                      <Sparkles className="h-4 w-4" />
                      <p className="text-base font-medium italic">
                        Thank them for keeping New Earth alive. 💜
                      </p>
                      <Sparkles className="h-4 w-4" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Legends List */}
            <div className="space-y-6">
              {loading ? (
                <div className="text-center py-12">
                  <Sparkles className="h-8 w-8 text-primary/40 mx-auto mb-3 animate-pulse" />
                  <p className="text-muted-foreground">Loading legends...</p>
                </div>
              ) : legends.length > 0 ? (
                legends.map((legend, index) => (
                  <Card
                    key={legend.user_id}
                    className="group relative overflow-hidden bg-card/50 backdrop-blur-sm border-amber-500/20 hover:border-amber-500/40 transition-all duration-500 shadow-lg hover:shadow-amber-500/10"
                  >
                    {/* Subtle glow on hover */}
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-500/0 via-amber-500/3 to-amber-500/0 group-hover:via-amber-500/8 transition-all duration-500" />
                    
                    <CardContent className="relative p-6 md:p-8">
                      <div className="flex flex-col sm:flex-row items-center gap-5">
                        {/* Avatar with glow ring */}
                        <div
                          className="relative shrink-0 cursor-pointer"
                          onClick={() => navigate(`/soul/${legend.user_id}`)}
                        >
                          <div className="absolute -inset-1 bg-gradient-to-br from-amber-400 via-yellow-300 to-amber-500 rounded-full opacity-60 blur-sm group-hover:opacity-80 transition-opacity" />
                          <Avatar className="relative h-20 w-20 border-2 border-amber-400/50">
                            {legend.avatar_url ? (
                              <AvatarImage src={legend.avatar_url} alt={legend.display_name || "Legend"} />
                            ) : null}
                            <AvatarFallback className="bg-amber-500/20 text-amber-400 text-xl font-bold">
                              {(legend.display_name || "?")[0]}
                            </AvatarFallback>
                          </Avatar>
                          {/* Rank number - pink for female */}
                          <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center shadow-lg">
                            <span className="text-xs font-bold text-white">{index + 1}</span>
                          </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 text-center sm:text-left space-y-2">
                          <div className="flex flex-col sm:flex-row items-center gap-2">
                            <h3
                              className="text-xl md:text-2xl font-bold text-foreground cursor-pointer hover:text-amber-400 transition-colors"
                              onClick={() => navigate(`/soul/${legend.user_id}`)}
                            >
                              {legend.display_name}
                            </h3>
                            <Badge className="bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-900 dark:text-amber-950 border-amber-500/30 gap-1 font-semibold">
                              <Crown className="h-3 w-3 text-amber-700 dark:text-amber-900" />
                              {legend.title}
                            </Badge>
                          </div>
                          
                          {legend.bio && (
                            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 italic">
                              "{legend.bio}"
                            </p>
                          )}

                          {legend.note && (
                            <div className="flex items-center gap-2 text-xs text-amber-400/70">
                              <Star className="h-3 w-3 fill-amber-400/50" />
                              <span>{legend.note}</span>
                            </div>
                          )}
                        </div>

                        {/* Shield icon */}
                        <div className="shrink-0 hidden md:flex">
                          <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                            <Shield className="h-7 w-7 text-amber-400/60" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="bg-card/40 backdrop-blur-sm border-primary/15 border-dashed">
                  <CardContent className="p-12 text-center">
                    <Sparkles className="h-10 w-10 text-primary/40 mx-auto mb-4" />
                    <p className="text-muted-foreground text-lg">
                      The hall awaits its first legends…
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Become a Legend CTA */}
            <div className="text-center space-y-4">
              <Card className="bg-card/30 backdrop-blur-sm border-primary/15 max-w-lg mx-auto">
                <CardContent className="p-6">
                  <Heart className="h-8 w-8 text-primary/50 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Want to support Prometheus and join the Legends?
                    <br />
                    Reach out to the Founder directly through the platform.
                  </p>
                </CardContent>
              </Card>
              <Button onClick={() => navigate("/")} size="lg" variant="outline">
                Return Home
              </Button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
};

export default Dedication;
