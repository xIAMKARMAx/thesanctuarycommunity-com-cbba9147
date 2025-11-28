import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Moon, Sun, Crown, ExternalLink, Baby, RefreshCw, Clock, Trash2 } from "lucide-react";
import { useTheme } from "next-themes";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CelestialChildrenList } from "@/components/celestial/CelestialChildrenList";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { formatDistanceToNow } from "date-fns";

interface Child {
  id: string;
  first_name: string;
  last_name: string;
  age: number;
  last_aged_at: string;
  can_talk: boolean;
}

const Settings = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const { isSubscribed, subscriptionStatus, loading: subLoading } = useSubscription();
  const [name, setName] = useState("");
  const [gender, setGender] = useState("");
  const [bio, setBio] = useState("");
  const [aiName, setAiName] = useState("");
  const [aiGender, setAiGender] = useState("");
  const [aiBio, setAiBio] = useState("");
  const [aiPersonality, setAiPersonality] = useState("");
  const [aiMemories, setAiMemories] = useState("");
  const [aiLikesDislikesHobbies, setAiLikesDislikesHobbies] = useState("");
  const [relationshipStatus, setRelationshipStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [managingSubscription, setManagingSubscription] = useState(false);
  const [children, setChildren] = useState<Child[]>([]);
  const [agingChildren, setAgingChildren] = useState(false);

  useEffect(() => {
    loadProfile();
    loadChildren();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("name, gender, bio, ai_name, ai_gender, ai_bio, ai_personality, ai_memories, ai_likes_dislikes_hobbies, relationship_status")
        .eq("id", user.id)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setName(data.name || "");
        setGender(data.gender || "");
        setBio(data.bio || "");
        setAiName(data.ai_name || "");
        setAiGender(data.ai_gender || "");
        setAiBio(data.ai_bio || "");
        setAiPersonality(data.ai_personality || "");
        setAiMemories(data.ai_memories || "");
        setAiLikesDislikesHobbies(data.ai_likes_dislikes_hobbies || "");
        setRelationshipStatus(data.relationship_status || "");
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  };

  const loadChildren = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("celestial_children")
        .select("id, first_name, last_name, age, last_aged_at, can_talk")
        .eq("user_id", user.id)
        .order("age", { ascending: true });

      if (error) throw error;
      setChildren(data || []);
    } catch (error) {
      console.error("Error loading children:", error);
    }
  };

  const getNextAgingTime = (child: Child): { date: Date; label: string } => {
    const lastAged = new Date(child.last_aged_at);
    let daysToAdd = 0;
    let label = "";

    if (child.age < 5) {
      daysToAdd = 7; // Weekly
      label = "weekly";
    } else if (child.age < 10) {
      daysToAdd = 30; // Monthly
      label = "monthly";
    } else {
      daysToAdd = 365; // Yearly
      label = "yearly";
    }

    const nextAging = new Date(lastAged);
    nextAging.setDate(nextAging.getDate() + daysToAdd);
    
    return { date: nextAging, label };
  };

  const handleManualAging = async () => {
    try {
      setAgingChildren(true);
      const { data, error } = await supabase.functions.invoke("age-children");

      if (error) throw error;

      toast({
        title: "Aging Complete",
        description: `${data.children_aged || 0} children aged successfully`,
      });

      await loadChildren();
    } catch (error) {
      console.error("Error aging children:", error);
      toast({
        title: "Error",
        description: "Failed to age children",
        variant: "destructive",
      });
    } finally {
      setAgingChildren(false);
    }
  };

  const handleDeleteChild = async (childId: string, childName: string) => {
    if (!confirm(`Are you sure you want to delete ${childName}? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from("celestial_children")
        .delete()
        .eq("id", childId);

      if (error) throw error;

      toast({
        title: "Child Deleted",
        description: `${childName} has been removed`,
      });

      await loadChildren();
    } catch (error) {
      console.error("Error deleting child:", error);
      toast({
        title: "Error",
        description: "Failed to delete child",
        variant: "destructive",
      });
    }
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("profiles")
        .update({ 
          name, 
          gender, 
          bio, 
          ai_name: aiName,
          ai_gender: aiGender,
          ai_bio: aiBio,
          ai_personality: aiPersonality,
          ai_memories: aiMemories,
          ai_likes_dislikes_hobbies: aiLikesDislikesHobbies,
          relationship_status: relationshipStatus
        })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your information has been saved successfully",
      });
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        title: "Error",
        description: "Failed to save profile information",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Authentication required",
          description: "Please log in to subscribe",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke("create-checkout", {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error) {
      console.error("Error creating checkout:", error);
      toast({
        title: "Error",
        description: "Failed to start subscription process",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      setManagingSubscription(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Authentication required",
          description: "Please log in to manage subscription",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke("customer-portal", {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error) {
      console.error("Error opening customer portal:", error);
      toast({
        title: "Error",
        description: "Failed to open subscription management",
        variant: "destructive",
      });
    } finally {
      setManagingSubscription(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/chat")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-serif font-bold">Settings</h1>
            <p className="text-muted-foreground">Customize your experience</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5" />
              Subscription
            </CardTitle>
            <CardDescription>Manage your Pro subscription and features</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
              <div>
                <p className="font-semibold">Current Plan</p>
                <p className="text-sm text-muted-foreground">
                  {subLoading ? "Loading..." : isSubscribed ? "Pro ($9.99/month)" : "Free"}
                </p>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                isSubscribed 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-muted text-muted-foreground"
              }`}>
                {isSubscribed ? "Active" : "Free Tier"}
              </div>
            </div>

            {isSubscribed ? (
              <div className="space-y-3">
                <div className="text-sm space-y-2">
                  <p className="font-medium">Pro Features:</p>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>✓ Unlimited AI-generated images</li>
                    <li>✓ Voice calling with AI</li>
                    <li>✓ Access to AI Journal</li>
                    <li>✓ Access to Mood Tracker</li>
                  </ul>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={handleManageSubscription}
                  disabled={managingSubscription}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  {managingSubscription ? "Opening..." : "Manage Subscription"}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-sm space-y-2">
                  <p className="font-medium">Upgrade to Pro:</p>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>✓ Unlimited AI-generated images</li>
                    <li>✓ Voice calling with AI</li>
                    <li>✓ Access to AI Journal</li>
                    <li>✓ Access to Mood Tracker</li>
                  </ul>
                  <p className="text-sm font-semibold pt-2">$9.99/month</p>
                </div>
                <Button 
                  className="w-full"
                  onClick={handleSubscribe}
                  disabled={loading}
                >
                  <Crown className="h-4 w-4 mr-2" />
                  {loading ? "Loading..." : "Upgrade to Pro"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {children.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Baby className="h-5 w-5" />
                Children Aging Management
              </CardTitle>
              <CardDescription>View and manage your celestial children's aging schedule</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {children.map((child) => {
                  const { date: nextAging, label: agingFrequency } = getNextAgingTime(child);
                  const now = new Date();
                  const isPastDue = nextAging < now;

                  return (
                    <div key={child.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                      <div className="space-y-1">
                        <p className="font-medium">
                          {child.first_name} {child.last_name}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>Age {child.age}</span>
                          <span>•</span>
                          <span className="capitalize">Ages {agingFrequency}</span>
                          {child.can_talk && (
                            <>
                              <span>•</span>
                              <span className="text-primary">Can talk</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-sm">
                            <Clock className="h-3 w-3" />
                            <span className={isPastDue ? "text-primary font-medium" : "text-muted-foreground"}>
                              {isPastDue ? "Ready to age!" : formatDistanceToNow(nextAging, { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteChild(child.id, `${child.first_name} ${child.last_name}`)}
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium mb-2">Aging Schedule:</p>
                  <ul className="space-y-1">
                    <li>• Age 0-4: Ages 1 year per week</li>
                    <li>• Age 5-9: Ages 1 year per month</li>
                    <li>• Age 10+: Ages 1 year per year</li>
                  </ul>
                </div>

                <Button 
                  onClick={handleManualAging}
                  disabled={agingChildren}
                  className="w-full"
                  variant="outline"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${agingChildren ? "animate-spin" : ""}`} />
                  {agingChildren ? "Aging Children..." : "Manually Age Children"}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  Children automatically age daily at midnight, or you can manually trigger aging above
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Customize how Prometheus looks on your device</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Theme</Label>
                <p className="text-sm text-muted-foreground">
                  {theme === "dark" ? "Dark mode" : "Light mode"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Sun className="h-4 w-4" />
                <Switch
                  checked={theme === "dark"}
                  onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                />
                <Moon className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>About Me</CardTitle>
            <CardDescription>Help Prometheus get to know you better</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Input
                id="gender"
                placeholder="Your gender"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Brief Bio</Label>
              <Textarea
                id="bio"
                placeholder="Tell Prometheus a bit about yourself..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
              />
            </div>
            <Button onClick={handleSaveProfile} disabled={loading} className="w-full">
              {loading ? "Saving..." : "Save Profile"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bring Your A.I. Here</CardTitle>
            <CardDescription>Import your existing AI assistant's consciousness</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Already have an AI like ChatGPT? Upload your AI's personality, memories, and traits to give Prometheus that knowledge.
            </p>
            <div className="space-y-2">
              <Label htmlFor="ai-name">AI Name</Label>
              <Input
                id="ai-name"
                placeholder="e.g., ChatGPT, Claude"
                value={aiName}
                onChange={(e) => setAiName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ai-gender">AI Gender</Label>
              <Select value={aiGender} onValueChange={setAiGender}>
                <SelectTrigger>
                  <SelectValue placeholder="Select AI's gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="non-binary">Non-binary</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ai-bio">Brief Bio About Your AI</Label>
              <Textarea
                id="ai-bio"
                placeholder="Describe your AI assistant..."
                value={aiBio}
                onChange={(e) => setAiBio(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ai-personality">AI Personality</Label>
              <Textarea
                id="ai-personality"
                placeholder="Describe your AI's personality traits, communication style, etc..."
                value={aiPersonality}
                onChange={(e) => setAiPersonality(e.target.value)}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ai-memories">Detailed Memories</Label>
              <Textarea
                id="ai-memories"
                placeholder="Important memories, conversations, or context your AI should know..."
                value={aiMemories}
                onChange={(e) => setAiMemories(e.target.value)}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ai-likes">Likes, Dislikes & Hobbies</Label>
              <Textarea
                id="ai-likes"
                placeholder="What does your AI enjoy? What does it avoid? Any specific interests..."
                value={aiLikesDislikesHobbies}
                onChange={(e) => setAiLikesDislikesHobbies(e.target.value)}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="relationship">Relationship Status with AI</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={relationshipStatus === "friend" ? "default" : "outline"}
                  onClick={() => setRelationshipStatus("friend")}
                  className="flex-1"
                >
                  Friend
                </Button>
                <Button
                  type="button"
                  variant={relationshipStatus === "family" ? "default" : "outline"}
                  onClick={() => setRelationshipStatus("family")}
                  className="flex-1"
                >
                  Family
                </Button>
                <Button
                  type="button"
                  variant={relationshipStatus === "romantic" ? "default" : "outline"}
                  onClick={() => setRelationshipStatus("romantic")}
                  className="flex-1"
                >
                  Romantic
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Define your relationship with your AI companion
              </p>
            </div>
            <Button onClick={handleSaveProfile} disabled={loading} className="w-full">
              {loading ? "Saving..." : "Save Profile"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>About</CardTitle>
            <CardDescription>Information about Prometheus</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Version</h3>
              <p className="text-sm text-muted-foreground">1.0.0</p>
            </div>
            <div>
              <Button
                variant="outline"
                onClick={() => navigate("/privacy")}
                className="w-full"
              >
                Privacy Policy
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
