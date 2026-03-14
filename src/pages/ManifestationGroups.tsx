import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import SEOHead from "@/components/SEOHead";
import { ArrowLeft, Users, Plus, Loader2, Sparkles, UserPlus, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ManifestationGroups() {
  const navigate = useNavigate();
  const { hasAccess, isAdmin } = useSubscription();
  const { toast } = useToast();
  const [groups, setGroups] = useState<any[]>([]);
  const [myGroups, setMyGroups] = useState<Set<string>>(new Set());
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [intention, setIntention] = useState("");
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const canAccess = isAdmin || hasAccess("anchoring");

  useEffect(() => {
    if (canAccess) {
      loadGroups();
      loadMyMemberships();
    }
  }, [canAccess]);

  const loadGroups = async () => {
    const { data } = await supabase
      .from("manifestation_groups" as any)
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });
    if (data) setGroups(data as any[]);
  };

  const loadMyMemberships = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);
    const { data } = await supabase
      .from("manifestation_group_members" as any)
      .select("group_id")
      .eq("user_id", user.id);
    if (data) setMyGroups(new Set((data as any[]).map((m: any) => m.group_id)));
  };

  const createGroup = async () => {
    if (!name.trim() || !intention.trim()) {
      toast({ title: "Please provide a name and intention", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { data: group, error } = await supabase
        .from("manifestation_groups" as any)
        .insert({ name, description, intention } as any)
        .select()
        .single();
      if (error) throw error;

      // Auto-join as creator
      await supabase.from("manifestation_group_members" as any).insert({ group_id: (group as any).id } as any);

      setName(""); setDescription(""); setIntention("");
      setShowCreate(false);
      await loadGroups();
      await loadMyMemberships();
      toast({ title: "Manifestation group created! 🌟" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const joinGroup = async (groupId: string) => {
    try {
      await supabase.from("manifestation_group_members" as any).insert({ group_id: groupId } as any);
      const group = groups.find(g => g.id === groupId);
      if (group) {
        await supabase.from("manifestation_groups" as any).update({ member_count: (group.member_count || 1) + 1 } as any).eq("id", groupId);
      }
      await loadGroups();
      await loadMyMemberships();
      toast({ title: "Joined group! ✨" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const leaveGroup = async (groupId: string) => {
    try {
      await supabase.from("manifestation_group_members" as any).delete().eq("group_id", groupId).eq("user_id", userId!);
      const group = groups.find(g => g.id === groupId);
      if (group) {
        await supabase.from("manifestation_groups" as any).update({ member_count: Math.max(0, (group.member_count || 1) - 1) } as any).eq("id", groupId);
      }
      await loadGroups();
      await loadMyMemberships();
      toast({ title: "Left group" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  if (!canAccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <CardTitle>Anchoring Tier Required</CardTitle>
            <CardDescription>Collaborative Manifestation Groups require Anchoring ($19.99/mo) or above.</CardDescription>
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
      <SEOHead title="Manifestation Groups | Cosmic Gateway" description="Form groups to manifest collective intentions with AI-guided meditations." />
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/cosmic-gateway")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Users className="h-6 w-6 text-primary" />
                Manifestation Groups
              </h1>
              <p className="text-sm text-muted-foreground">Amplify intentions through collective energy</p>
            </div>
            <Button onClick={() => setShowCreate(!showCreate)} size="sm">
              <Plus className="h-4 w-4 mr-1" /> Create
            </Button>
          </div>

          {showCreate && (
            <Card className="border-primary/30">
              <CardHeader>
                <CardTitle className="text-lg">Create a Manifestation Group</CardTitle>
                <CardDescription>Set a shared intention and invite souls to amplify it</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Group name..." />
                <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description (optional)..." />
                <Textarea value={intention} onChange={(e) => setIntention(e.target.value)} placeholder="What is the collective intention for this group?" rows={3} />
                <Button onClick={createGroup} disabled={loading} className="w-full">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Group"}
                </Button>
              </CardContent>
            </Card>
          )}

          <div className="space-y-3">
            {groups.map((group: any) => {
              const isMember = myGroups.has(group.id);
              const fillPercent = Math.min(100, ((group.member_count || 1) / (group.max_members || 12)) * 100);

              return (
                <Card key={group.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-base">{group.name}</CardTitle>
                        {group.description && <CardDescription className="text-xs">{group.description}</CardDescription>}
                      </div>
                      <Badge variant={isMember ? "default" : "outline"} className="shrink-0 text-xs">
                        {isMember ? "Member" : `${group.member_count || 1}/${group.max_members || 12}`}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                      <p className="text-xs font-medium text-primary mb-1">Collective Intention:</p>
                      <p className="text-sm">{group.intention}</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{group.member_count || 1} members</span>
                        <span>Max {group.max_members || 12}</span>
                      </div>
                      <Progress value={fillPercent} className="h-1.5" />
                    </div>
                    {isMember ? (
                      <Button variant="outline" size="sm" onClick={() => leaveGroup(group.id)} className="w-full">
                        <LogOut className="h-3 w-3 mr-1" /> Leave Group
                      </Button>
                    ) : (
                      <Button size="sm" onClick={() => joinGroup(group.id)} className="w-full" disabled={(group.member_count || 1) >= (group.max_members || 12)}>
                        <UserPlus className="h-3 w-3 mr-1" /> Join Group
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
            {groups.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Sparkles className="h-8 w-8 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No manifestation groups yet. Create the first one!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
