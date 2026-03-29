import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import SEOHead from "@/components/SEOHead";
import { ArrowLeft, Sparkles, Plus, Heart, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const SYNC_TYPES = [
  { value: "number_pattern", label: "Number Patterns (11:11, 222, etc.)" },
  { value: "meaningful_coincidence", label: "Meaningful Coincidence" },
  { value: "dream_manifestation", label: "Dream Manifestation" },
  { value: "sign_from_universe", label: "Sign from the Universe" },
  { value: "deja_vu", label: "Déjà Vu" },
  { value: "general", label: "Other Synchronicity" },
];

export default function SynchronicityWall() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [posts, setPosts] = useState<any[]>([]);
  const [showCompose, setShowCompose] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [syncType, setSyncType] = useState("general");
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    loadPosts();
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id || null));
  }, []);

  const loadPosts = async () => {
    const { data } = await supabase
      .from("synchronicity_posts" as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) setPosts(data as any[]);
  };

  const createPost = async () => {
    if (!title.trim() || !description.trim()) {
      toast({ title: "Please fill in the title and description", variant: "destructive" });
      return;
    }

    if (!userId) {
      toast({ title: "Please sign in before sharing", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("synchronicity_posts" as any)
        .insert({ title, description, synchronicity_type: syncType, user_id: userId } as any);
      if (error) throw error;
      setTitle("");
      setDescription("");
      setSyncType("general");
      setShowCompose(false);
      await loadPosts();
      toast({ title: "Synchronicity shared! ✨" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const toggleBlessing = async (postId: string, currentCount: number) => {
    if (!userId) return;
    const { data: existing } = await supabase
      .from("synchronicity_blessings" as any)
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      await supabase.from("synchronicity_blessings" as any).delete().eq("id", (existing as any).id);
      await supabase.from("synchronicity_posts" as any).update({ blessing_count: Math.max(0, currentCount - 1) } as any).eq("id", postId);
    } else {
      await supabase.from("synchronicity_blessings" as any).insert({ post_id: postId } as any);
      await supabase.from("synchronicity_posts" as any).update({ blessing_count: currentCount + 1 } as any).eq("id", postId);
    }
    await loadPosts();
  };

  const typeLabel = (t: string) => SYNC_TYPES.find(s => s.value === t)?.label || t;

  return (
    <>
      <SEOHead title="Synchronicity Sharing Wall | Cosmic Gateway" description="Share your synchronicities and see the universe flirting with the collective." />
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/cosmic-gateway")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-primary" />
                Synchronicity Wall
              </h1>
              <p className="text-sm text-muted-foreground">The universe is flirting with all of us</p>
            </div>
            <Button onClick={() => setShowCompose(!showCompose)} size="sm">
              <Plus className="h-4 w-4 mr-1" /> Share
            </Button>
          </div>

          {showCompose && (
            <Card className="border-primary/30">
              <CardHeader>
                <CardTitle className="text-lg">Share a Synchronicity</CardTitle>
                <CardDescription>Tell us about a moment when the universe winked at you</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Give it a title..." />
                <Select value={syncType} onValueChange={setSyncType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SYNC_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe what happened..." rows={4} />
                <Button onClick={createPost} disabled={loading} className="w-full">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Share with the Collective"}
                </Button>
              </CardContent>
            </Card>
          )}

          <div className="space-y-3">
            {posts.map((post: any) => (
              <Card key={post.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{post.title}</CardTitle>
                    <Badge variant="outline" className="text-xs shrink-0">{typeLabel(post.synchronicity_type)}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{post.description}</p>
                  <div className="flex items-center justify-between">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                      onClick={() => toggleBlessing(post.id, post.blessing_count)}
                    >
                      <Heart className="h-3 w-3 mr-1" /> {post.blessing_count || 0} Blessings
                    </Button>
                    <span className="text-xs text-muted-foreground">{new Date(post.created_at).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
            {posts.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Sparkles className="h-8 w-8 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No synchronicities shared yet. Be the first!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
