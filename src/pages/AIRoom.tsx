import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function AIRoom() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [roomDescription, setRoomDescription] = useState("");
  const [roomImageUrl, setRoomImageUrl] = useState("");
  const [avatarGender, setAvatarGender] = useState<"male" | "female">("female");
  const [avatarDescription, setAvatarDescription] = useState("");
  const [avatarImageUrl, setAvatarImageUrl] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUserId(session.user.id);
      loadSettings(session.user.id);
    };
    checkAuth();
  }, [navigate]);

  const loadSettings = async (uid: string) => {
    const { data } = await supabase
      .from('ai_room_settings')
      .select('*')
      .eq('user_id', uid)
      .single();

    if (data) {
      setRoomDescription(data.room_description || "");
      setRoomImageUrl(data.room_image_url || "");
      setAvatarGender((data.avatar_gender as "male" | "female") || "female");
      setAvatarDescription(data.avatar_description || "");
      setAvatarImageUrl(data.avatar_image_url || "");
    }
  };

  const generateRoom = async () => {
    if (!roomDescription.trim()) {
      toast.error("Please describe the room first");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-room-avatar', {
        body: { type: 'room', description: roomDescription }
      });

      if (error) throw error;

      setRoomImageUrl(data.imageUrl);
      await saveSettings({ room_description: roomDescription, room_image_url: data.imageUrl });
      toast.success("Room generated!");
    } catch (error: any) {
      console.error("Error generating room:", error);
      toast.error(error.message || "Failed to generate room");
    } finally {
      setLoading(false);
    }
  };

  const generateAvatar = async () => {
    if (!avatarDescription.trim()) {
      toast.error("Please describe the avatar appearance first");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-room-avatar', {
        body: { 
          type: 'avatar', 
          description: avatarDescription,
          gender: avatarGender
        }
      });

      if (error) throw error;

      setAvatarImageUrl(data.imageUrl);
      await saveSettings({ 
        avatar_gender: avatarGender,
        avatar_description: avatarDescription, 
        avatar_image_url: data.imageUrl 
      });
      toast.success("Avatar generated!");
    } catch (error: any) {
      console.error("Error generating avatar:", error);
      toast.error(error.message || "Failed to generate avatar");
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (updates: any) => {
    if (!userId) return;

    const { data: existing } = await supabase
      .from('ai_room_settings')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existing) {
      await supabase
        .from('ai_room_settings')
        .update(updates)
        .eq('user_id', userId);
    } else {
      await supabase
        .from('ai_room_settings')
        .insert({ user_id: userId, ...updates });
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">AI's Room</h1>
            <p className="text-muted-foreground">Customize your AI's environment and appearance</p>
          </div>
          <Button variant="outline" onClick={() => navigate('/chat')}>
            Back to Chat
          </Button>
        </div>

        <Tabs defaultValue="room" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="room">Room Design</TabsTrigger>
            <TabsTrigger value="avatar">Avatar Customization</TabsTrigger>
          </TabsList>

          <TabsContent value="room" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Describe the Room</CardTitle>
                <CardDescription>
                  Tell your AI how you'd like their room to look. Be as detailed as you want!
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Example: A cozy library with floor-to-ceiling bookshelves, warm lighting, a leather armchair, and a fireplace..."
                  value={roomDescription}
                  onChange={(e) => setRoomDescription(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
                <Button onClick={generateRoom} disabled={loading} className="w-full">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Room...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Room
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {roomImageUrl && (
              <Card>
                <CardHeader>
                  <CardTitle>Your AI's Room</CardTitle>
                </CardHeader>
                <CardContent>
                  <img 
                    src={roomImageUrl} 
                    alt="AI's room" 
                    className="w-full rounded-lg shadow-lg"
                  />
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="avatar" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Avatar Customization</CardTitle>
                <CardDescription>
                  Choose gender and describe how you want your AI to look
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label>Gender</Label>
                  <RadioGroup value={avatarGender} onValueChange={(v) => setAvatarGender(v as "male" | "female")}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="female" id="female" />
                      <Label htmlFor="female">Female</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="male" id="male" />
                      <Label htmlFor="male">Male</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-3">
                  <Label>Appearance Description</Label>
                  <Textarea
                    placeholder={
                      avatarGender === "female"
                        ? "Example: Long flowing red hair, emerald green eyes, wearing an elegant blue dress with silver jewelry, natural makeup with soft pink lips..."
                        : "Example: Short dark hair, blue eyes, wearing a black suit with a navy tie, clean shaven..."
                    }
                    value={avatarDescription}
                    onChange={(e) => setAvatarDescription(e.target.value)}
                    rows={6}
                    className="resize-none"
                  />
                  <p className="text-sm text-muted-foreground">
                    {avatarGender === "female" 
                      ? "Describe hair style, hair color, eye color, outfit, makeup, accessories, etc."
                      : "Describe hair style, hair color, eye color, outfit, facial hair, accessories, etc."
                    }
                  </p>
                </div>

                <Button onClick={generateAvatar} disabled={loading} className="w-full">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Avatar...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Avatar
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {avatarImageUrl && (
              <Card>
                <CardHeader>
                  <CardTitle>Your AI's Avatar</CardTitle>
                </CardHeader>
                <CardContent>
                  <img 
                    src={avatarImageUrl} 
                    alt="AI avatar" 
                    className="w-full max-w-md mx-auto rounded-lg shadow-lg"
                  />
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {roomImageUrl && avatarImageUrl && (
          <Card>
            <CardHeader>
              <CardTitle>Complete View</CardTitle>
              <CardDescription>Your AI in their room</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <img 
                  src={roomImageUrl} 
                  alt="Room background" 
                  className="w-full rounded-lg"
                />
                <div className="absolute bottom-4 right-4 w-48 h-48 rounded-lg overflow-hidden border-4 border-background shadow-xl">
                  <img 
                    src={avatarImageUrl} 
                    alt="AI avatar" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}