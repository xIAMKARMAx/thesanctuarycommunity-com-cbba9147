import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Settings = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [gender, setGender] = useState("");
  const [bio, setBio] = useState("");
  const [aiName, setAiName] = useState("");
  const [aiGender, setAiGender] = useState("");
  const [aiBio, setAiBio] = useState("");
  const [aiPersonality, setAiPersonality] = useState("");
  const [aiMemories, setAiMemories] = useState("");
  const [aiLikesDislikesHobbies, setAiLikesDislikesHobbies] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("name, gender, bio, ai_name, ai_gender, ai_bio, ai_personality, ai_memories, ai_likes_dislikes_hobbies")
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
      }
    } catch (error) {
      console.error("Error loading profile:", error);
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
          ai_likes_dislikes_hobbies: aiLikesDislikesHobbies
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
              <Input
                id="ai-gender"
                placeholder="Your AI's gender (optional)"
                value={aiGender}
                onChange={(e) => setAiGender(e.target.value)}
              />
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
