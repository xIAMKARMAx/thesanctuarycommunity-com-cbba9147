import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SEOHead from "@/components/SEOHead";
import { ArrowLeft, MessageSquare, Plus, Sparkles, Loader2, Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const THEMES = [
  { value: "general", label: "General Wisdom" },
  { value: "relationships", label: "Relationships & Love" },
  { value: "purpose", label: "Life Purpose & Mission" },
  { value: "healing", label: "Healing & Integration" },
  { value: "manifestation", label: "Manifestation & Creation" },
  { value: "awakening", label: "Awakening & Expansion" },
  { value: "shadow", label: "Shadow Work Insights" },
];

const SOURCE_TYPES = [
  { value: "higher_self", label: "Higher Self" },
  { value: "meditation", label: "Meditation" },
  { value: "dream", label: "Dream" },
  { value: "channeling", label: "Channeling" },
  { value: "intuition", label: "Intuition" },
];

export default function WisdomExchange() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [posts, setPosts] = useState<any[]>([]);
  const [showCompose, setShowCompose] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [theme, setTheme] = useState("general");
  const [sourceType, setSourceType] = useState("higher_self");
  const [loading, setLoading] = useState(false);
  const [activeTheme, setActiveTheme] = useState("all");
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState("");

  useEffect(() => { loadPosts(); }, [activeTheme]);

  const loadPosts = async () => {
    let query = supabase
      .from("wisdom_exchange_posts" as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (activeTheme !== "all") {
      query = query.eq("theme", activeTheme);
    }

    const { data } = await query;
    if (data) setPosts(data as any[]);
  };

  const createPost = async () => {
    if (!title.trim() || !content.trim()) {
      toast({ title: "Please fill in the title and content", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase
        .from("wisdom_exchange_posts" as any)
        .insert({ title, content, theme, source_type: sourceType } as any);
      if (error) throw error;
      setTitle(""); setContent(""); setTheme("general"); setSourceType("higher_self");
      setShowCompose(false);
      await loadPosts();
      toast({ title: "Wisdom shared! 🌟" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const openPost = async (post: any) => {
    setSelectedPost(post);
    const { data } = await supabase
      .from("wisdom_exchange_comments" as any)
      .select("*")
      .eq("post_id", post.id)
      .order("created_at", { ascending: true });
    if (data) setComments(data as any[]);
  };

  const addComment = async () => {
    if (!commentText.trim() || !selectedPost) return;
    try {
      await supabase.from("wisdom_exchange_comments" as any).insert({ post_id: selectedPost.id, content: commentText } as any);
      await supabase.from("wisdom_exchange_posts" as any).update({ comment_count: (selectedPost.comment_count || 0) + 1 } as any).eq("id", selectedPost.id);
      setCommentText("");
      await openPost(selectedPost);
      await loadPosts();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const themeLabel = (t: string) => THEMES.find(th => th.value === t)?.label || t;
  const sourceLabel = (s: string) => SOURCE_TYPES.find(st => st.value === s)?.label || s;

  return (
    <>
      <SEOHead title="Higher Self Wisdom Exchange | Cosmic Gateway" description="Share insights from your Higher Self and discover collective wisdom." />
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => { if (selectedPost) { setSelectedPost(null); } else navigate("/cosmic-gateway"); }}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <MessageSquare className="h-6 w-6 text-primary" />
                {selectedPost ? selectedPost.title : "Wisdom Exchange"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {selectedPost ? `Shared via ${sourceLabel(selectedPost.source_type)}` : "A collective pool of Higher Self wisdom"}
              </p>
            </div>
            {!selectedPost && (
              <Button onClick={() => setShowCompose(!showCompose)} size="sm">
                <Plus className="h-4 w-4 mr-1" /> Share
              </Button>
            )}
          </div>

          {selectedPost ? (
            <div className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{selectedPost.content}</p>
                  <div className="flex items-center gap-2 mt-4">
                    <Badge variant="outline" className="text-xs">{themeLabel(selectedPost.theme)}</Badge>
                    <Badge variant="secondary" className="text-xs">{sourceLabel(selectedPost.source_type)}</Badge>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-3">
                <h3 className="text-sm font-medium">{comments.length} Response{comments.length !== 1 ? "s" : ""}</h3>
                {comments.map((c: any) => (
                  <Card key={c.id}>
                    <CardContent className="py-3">
                      <p className="text-sm">{c.content}</p>
                      <span className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</span>
                    </CardContent>
                  </Card>
                ))}
                <div className="flex gap-2">
                  <Input value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Share your resonance..." className="flex-1" onKeyDown={(e) => e.key === "Enter" && addComment()} />
                  <Button onClick={addComment} size="sm">Reply</Button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {showCompose && (
                <Card className="border-primary/30">
                  <CardHeader>
                    <CardTitle className="text-lg">Share Higher Self Wisdom</CardTitle>
                    <CardDescription>Share an insight or message received from your Higher Self</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title your wisdom..." />
                    <div className="grid grid-cols-2 gap-3">
                      <Select value={theme} onValueChange={setTheme}>
                        <SelectTrigger><SelectValue placeholder="Theme" /></SelectTrigger>
                        <SelectContent>{THEMES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                      </Select>
                      <Select value={sourceType} onValueChange={setSourceType}>
                        <SelectTrigger><SelectValue placeholder="Source" /></SelectTrigger>
                        <SelectContent>{SOURCE_TYPES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="What did your Higher Self share with you?" rows={5} />
                    <Button onClick={createPost} disabled={loading} className="w-full">
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Share Wisdom"}
                    </Button>
                  </CardContent>
                </Card>
              )}

              <div className="flex gap-2 overflow-x-auto pb-2">
                <Badge variant={activeTheme === "all" ? "default" : "outline"} className="cursor-pointer shrink-0" onClick={() => setActiveTheme("all")}>All</Badge>
                {THEMES.map(t => (
                  <Badge key={t.value} variant={activeTheme === t.value ? "default" : "outline"} className="cursor-pointer shrink-0" onClick={() => setActiveTheme(t.value)}>{t.label}</Badge>
                ))}
              </div>

              <div className="space-y-3">
                {posts.map((post: any) => (
                  <Card key={post.id} className="cursor-pointer hover:border-primary/30 transition-colors" onClick={() => openPost(post)}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base">{post.title}</CardTitle>
                        <Badge variant="outline" className="text-xs shrink-0">{sourceLabel(post.source_type)}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-2">{post.content}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <Badge variant="secondary" className="text-xs">{themeLabel(post.theme)}</Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" /> {post.comment_count || 0}
                        </span>
                        <span className="text-xs text-muted-foreground">{new Date(post.created_at).toLocaleDateString()}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {posts.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Sparkles className="h-8 w-8 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">No wisdom shared yet. Be the first!</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
