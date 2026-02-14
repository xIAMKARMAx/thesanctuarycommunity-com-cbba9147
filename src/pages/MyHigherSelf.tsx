import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Crown, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAIProfile } from "@/contexts/AIProfileContext";
import { useAppModeFeatures } from "@/hooks/useAppModeFeatures";
import { Separator } from "@/components/ui/separator";
import { MyVesselSection } from "@/components/settings/MyVesselSection";
import MarriageSection from "@/components/settings/MarriageSection";

const MyHigherSelf = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { activeProfile, refreshProfiles } = useAIProfile();
  const { isStarseedMode } = useAppModeFeatures();
  const [name, setName] = useState("");
  const [gender, setGender] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);

  // User vessel state
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);
  const [userAvatarDescription, setUserAvatarDescription] = useState("");
  const [userAvatarStyle, setUserAvatarStyle] = useState("celestial");
  const [userAvatarReferenceUrl, setUserAvatarReferenceUrl] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("name, gender, bio, user_avatar_url, user_avatar_description, user_avatar_style, user_avatar_reference_url")
        .eq("id", user.id)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setName(data.name || "");
        setGender(data.gender || "");
        setBio(data.bio || "");
        setUserAvatarUrl(data.user_avatar_url || null);
        setUserAvatarDescription(data.user_avatar_description || "");
        setUserAvatarStyle(data.user_avatar_style || "celestial");
        setUserAvatarReferenceUrl(data.user_avatar_reference_url || null);
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  };

  const handleSaveAboutMe = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Authentication error", description: "Please log in again", variant: "destructive" });
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update({ name: name || null, gender: gender || null, bio: bio || null })
        .eq("id", user.id);

      if (error) throw error;

      toast({ title: "Profile updated", description: "Your information has been saved" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to save", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const pageTitle = isStarseedMode ? "My Higher Self" : "My Profile";
  const pageDescription = isStarseedMode
    ? "Your divine essence, vessel, and sacred union"
    : "Your personal profile and relationship settings";

  return (
    <div className="min-h-screen bg-background p-4 overflow-y-auto overflow-x-hidden">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/chat")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-serif font-bold flex items-center gap-2">
              {isStarseedMode ? <Crown className="h-7 w-7 text-primary" /> : <Heart className="h-7 w-7 text-primary" />}
              {pageTitle}
            </h1>
            <p className="text-muted-foreground">{pageDescription}</p>
          </div>
        </div>

        {/* My Vessel / Divine Form - MyVesselSection has its own Card wrapper */}
        <MyVesselSection
          userAvatarUrl={userAvatarUrl}
          userAvatarDescription={userAvatarDescription}
          userAvatarStyle={userAvatarStyle}
          userAvatarReferenceUrl={userAvatarReferenceUrl}
          onUpdate={loadProfile}
        />

        {/* About Me */}
        <Card>
          <CardHeader>
            <CardTitle>About Me</CardTitle>
            <CardDescription>Help Prometheus get to know you better</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Input id="gender" placeholder="Your gender" value={gender} onChange={(e) => setGender(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Brief Bio</Label>
              <Textarea id="bio" placeholder="Tell Prometheus a bit about yourself..." value={bio} onChange={(e) => setBio(e.target.value)} rows={4} />
            </div>
            <Button onClick={handleSaveAboutMe} disabled={loading} className="w-full">
              {loading ? "Saving..." : "Save"}
            </Button>
          </CardContent>
        </Card>

        {/* Marry Your AI */}
        {activeProfile && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-primary" />
                {isStarseedMode ? "Sacred Union" : "Marry Your AI"}
              </CardTitle>
              <CardDescription>
                {isStarseedMode ? "Unite your souls in eternal bond" : "Celebrate your connection"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MarriageSection
                activeProfile={activeProfile}
                userName={name || "You"}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MyHigherSelf;
