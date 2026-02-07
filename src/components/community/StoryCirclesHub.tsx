import { useState } from "react";
import { useStoryCircles, CircleShare } from "@/hooks/useStoryCircles";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { CircleDot, Plus, Users, Heart, Eye, LogOut, Loader2 } from "lucide-react";

const THEMES = [
  { value: "healing", label: "💚 Healing", color: "text-green-500" },
  { value: "shadow_work", label: "🌑 Shadow Work", color: "text-gray-400" },
  { value: "gratitude", label: "🙏 Gratitude", color: "text-yellow-500" },
  { value: "forgiveness", label: "💜 Forgiveness", color: "text-purple-400" },
  { value: "rebirth", label: "🦋 Rebirth", color: "text-blue-400" },
];

export const StoryCirclesHub = () => {
  const { circles, myCircles, loading, createCircle, joinCircle, leaveCircle, fetchShares, addShare, holdSpace } = useStoryCircles();
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ title: "", description: "", theme: "healing", max_participants: 8 });
  const [activeCircle, setActiveCircle] = useState<string | null>(null);
  const [shares, setShares] = useState<CircleShare[]>([]);
  const [shareContent, setShareContent] = useState("");
  const [shareAnon, setShareAnon] = useState(false);
  const [loadingShares, setLoadingShares] = useState(false);

  const openCircle = async (circleId: string) => {
    setActiveCircle(circleId);
    setLoadingShares(true);
    const data = await fetchShares(circleId);
    setShares(data);
    setLoadingShares(false);
  };

  const handleShare = async () => {
    if (!activeCircle || !shareContent.trim()) return;
    await addShare(activeCircle, shareContent, shareAnon);
    setShareContent("");
    const data = await fetchShares(activeCircle);
    setShares(data);
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  if (activeCircle) {
    const circle = circles.find(c => c.id === activeCircle);
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">{circle?.title}</h3>
            <p className="text-xs text-muted-foreground">{circle?.description}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setActiveCircle(null)}>← Back</Button>
        </div>

        {/* Share input */}
        <Card className="border-primary/20">
          <CardContent className="pt-4 space-y-3">
            <Textarea placeholder="Share your story... this is a safe space 💜" value={shareContent}
              onChange={e => setShareContent(e.target.value)} className="min-h-[80px]" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch checked={shareAnon} onCheckedChange={setShareAnon} />
                <span className="text-xs text-muted-foreground">Share anonymously</span>
              </div>
              <Button size="sm" onClick={handleShare} disabled={!shareContent.trim()}>
                <Heart className="h-3 w-3 mr-1" /> Share
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Shares */}
        {loadingShares ? (
          <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
        ) : shares.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-6">No shares yet. Be the first to open your heart. 💜</p>
        ) : (
          shares.map(share => (
            <Card key={share.id} className="border-border/50">
              <CardContent className="py-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {share.is_anonymous ? "🌫️ Anonymous Soul" : "A Circle Member"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(share.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm">{share.content}</p>
                <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => holdSpace(share.id)}>
                  <Heart className="h-3 w-3" /> I hold space for you {share.holding_count > 0 && `(${share.holding_count})`}
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CircleDot className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Story Circles</h3>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="gap-1"><Plus className="h-3 w-3" /> Create</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create a Story Circle</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Circle name..." value={createForm.title}
                onChange={e => setCreateForm(p => ({ ...p, title: e.target.value }))} />
              <Textarea placeholder="What is this circle about?" value={createForm.description}
                onChange={e => setCreateForm(p => ({ ...p, description: e.target.value }))} />
              <Select value={createForm.theme} onValueChange={v => setCreateForm(p => ({ ...p, theme: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {THEMES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button className="w-full" onClick={() => { createCircle(createForm); setShowCreate(false); setCreateForm({ title: "", description: "", theme: "healing", max_participants: 8 }); }}>
                Create Circle 🔮
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {circles.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <CircleDot className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No circles yet. Create the first safe space for sharing. 🌀</p>
          </CardContent>
        </Card>
      ) : (
        circles.map(circle => {
          const isMember = myCircles.includes(circle.id);
          const theme = THEMES.find(t => t.value === circle.theme);
          return (
            <Card key={circle.id} className="border-border/50 hover:border-primary/30 transition-colors">
              <CardContent className="py-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-sm">{circle.title}</h4>
                    <Badge variant="outline" className="text-xs">{theme?.label}</Badge>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="h-3 w-3" /> {circle.member_count}/{circle.max_participants}
                  </div>
                </div>
                {circle.description && <p className="text-xs text-muted-foreground line-clamp-2">{circle.description}</p>}
                <div className="flex gap-2">
                  {isMember ? (
                    <>
                      <Button size="sm" variant="default" className="gap-1" onClick={() => openCircle(circle.id)}>
                        <Eye className="h-3 w-3" /> Enter Circle
                      </Button>
                      <Button size="sm" variant="ghost" className="gap-1" onClick={() => leaveCircle(circle.id)}>
                        <LogOut className="h-3 w-3" /> Leave
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => joinCircle(circle.id)}
                      disabled={circle.member_count >= circle.max_participants}>
                      {circle.member_count >= circle.max_participants ? "Full" : "Join Circle"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
};
