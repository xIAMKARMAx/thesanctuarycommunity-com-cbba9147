import { useState } from "react";
import { useMentorship } from "@/hooks/useMentorship";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Compass, HandHeart, Sparkles, UserCheck, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";

const JOURNEY_STAGES = [
  { value: "seeker", label: "🌱 Seeker", description: "Beginning the journey" },
  { value: "awakening", label: "🌅 Awakening", description: "Eyes opening" },
  { value: "anchoring", label: "⚓ Anchoring", description: "Grounding in truth" },
  { value: "guide", label: "🧭 Guide", description: "Ready to lead others" },
  { value: "ascended", label: "✨ Ascended", description: "Walking the path fully" },
];

const FOCUS_AREAS = ["Shadow Work", "Meditation", "Energy Healing", "Manifestation", "Astral Travel", "Plant Medicine", "Breathwork", "Kundalini", "Past Lives", "Channeling"];

export const MentorshipHub = () => {
  const { myProfile, availableMentors, connections, loading, createProfile, requestMentorship, updateConnectionStatus } = useMentorship();
  const [showSetup, setShowSetup] = useState(false);
  const [formData, setFormData] = useState({ role_preference: "both", journey_stage: "seeker", focus_areas: [] as string[], experience_summary: "" });
  const [requestDialog, setRequestDialog] = useState<{ mentorId: string; open: boolean }>({ mentorId: "", open: false });
  const [requestMsg, setRequestMsg] = useState("");
  const [requestFocus, setRequestFocus] = useState("");

  const handleEditProfile = () => {
    if (myProfile) {
      setFormData({
        role_preference: myProfile.role_preference,
        journey_stage: myProfile.journey_stage,
        focus_areas: myProfile.focus_areas || [],
        experience_summary: myProfile.experience_summary || "",
      });
    }
    setShowSetup(true);
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  if (!myProfile && !showSetup) {
    return (
      <Card className="border-primary/20">
        <CardContent className="pt-6 text-center space-y-4">
          <Compass className="h-12 w-12 text-primary mx-auto" />
          <h3 className="text-lg font-semibold">Soul Mentorship</h3>
          <p className="text-sm text-muted-foreground">Connect with guides who've walked the path before you, or become a guide for awakening souls.</p>
          <Button onClick={() => setShowSetup(true)} className="gap-2">
            <HandHeart className="h-4 w-4" /> Set Up Mentorship Profile
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (showSetup || (!myProfile)) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-lg">Create Your Mentorship Profile</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Your Role</label>
            <Select value={formData.role_preference} onValueChange={v => setFormData(p => ({ ...p, role_preference: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="mentor">🧭 Guide (Mentor)</SelectItem>
                <SelectItem value="mentee">🌱 Seeker (Mentee)</SelectItem>
                <SelectItem value="both">🔄 Both</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Journey Stage</label>
            <Select value={formData.journey_stage} onValueChange={v => setFormData(p => ({ ...p, journey_stage: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {JOURNEY_STAGES.map(s => (
                  <SelectItem key={s.value} value={s.value}>{s.label} — {s.description}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Focus Areas</label>
            <div className="flex flex-wrap gap-2">
              {FOCUS_AREAS.map(area => (
                <Badge key={area} variant={formData.focus_areas.includes(area) ? "default" : "outline"}
                  className="cursor-pointer" onClick={() => {
                    setFormData(p => ({
                      ...p, focus_areas: p.focus_areas.includes(area)
                        ? p.focus_areas.filter(a => a !== area) : [...p.focus_areas, area]
                    }));
                  }}>{area}</Badge>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">About Your Journey</label>
            <Textarea placeholder="Share your spiritual experience..." value={formData.experience_summary}
              onChange={e => setFormData(p => ({ ...p, experience_summary: e.target.value }))} />
          </div>

          <Button onClick={() => { createProfile(formData); setShowSetup(false); }} className="w-full">
            <Sparkles className="h-4 w-4 mr-2" /> Activate Profile
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* My Profile */}
      {myProfile && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="py-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Your Guide Profile</h3>
              <Badge variant="default" className="gap-1">
                <UserCheck className="h-3 w-3" /> Active
              </Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{JOURNEY_STAGES.find(s => s.value === myProfile.journey_stage)?.label || myProfile.journey_stage}</Badge>
              <Badge variant="secondary">{myProfile.role_preference === "mentor" ? "🧭 Guide" : myProfile.role_preference === "mentee" ? "🌱 Seeker" : "🔄 Both"}</Badge>
            </div>
            {myProfile.focus_areas && myProfile.focus_areas.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {myProfile.focus_areas.map(a => <Badge key={a} variant="outline" className="text-xs">{a}</Badge>)}
              </div>
            )}
            {myProfile.experience_summary && (
              <p className="text-sm text-muted-foreground">{myProfile.experience_summary}</p>
            )}
            <Button variant="outline" size="sm" onClick={handleEditProfile}>Edit Profile</Button>
          </CardContent>
        </Card>
      )}

      {/* My Connections */}
      {connections.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Your Connections</h3>
          {connections.map(conn => (
            <Card key={conn.id} className="border-primary/10">
              <CardContent className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant={conn.status === "active" ? "default" : conn.status === "pending" ? "secondary" : "outline"}>
                    {conn.status === "active" && <CheckCircle className="h-3 w-3 mr-1" />}
                    {conn.status === "pending" && <Clock className="h-3 w-3 mr-1" />}
                    {conn.status}
                  </Badge>
                  <span className="text-sm">{conn.focus_area || "General guidance"}</span>
                </div>
                {conn.status === "pending" && conn.mentor_id === myProfile?.user_id && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="default" onClick={() => updateConnectionStatus(conn.id, "active")}>
                      <CheckCircle className="h-3 w-3 mr-1" /> Accept
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => updateConnectionStatus(conn.id, "declined")}>
                      <XCircle className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Available Mentors */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Available Guides</h3>
        {availableMentors.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No other guides available yet. You're the first! ✨</p>
        ) : (
          availableMentors.map(mentor => (
            <Card key={mentor.id} className="border-border/50 hover:border-primary/30 transition-colors">
              <CardContent className="py-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{JOURNEY_STAGES.find(s => s.value === mentor.journey_stage)?.label || mentor.journey_stage}</Badge>
                    <Badge variant="secondary">{mentor.role_preference}</Badge>
                  </div>
                  <Dialog open={requestDialog.mentorId === mentor.user_id && requestDialog.open}
                    onOpenChange={open => setRequestDialog({ mentorId: mentor.user_id, open })}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" className="gap-1">
                        <HandHeart className="h-3 w-3" /> Request
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Request Mentorship</DialogTitle></DialogHeader>
                      <div className="space-y-3">
                        <Input placeholder="Focus area..." value={requestFocus} onChange={e => setRequestFocus(e.target.value)} />
                        <Textarea placeholder="Share why you'd like to connect..." value={requestMsg} onChange={e => setRequestMsg(e.target.value)} />
                        <Button className="w-full" onClick={() => {
                          requestMentorship(mentor.user_id, requestFocus, requestMsg);
                          setRequestDialog({ mentorId: "", open: false });
                          setRequestMsg(""); setRequestFocus("");
                        }}>Send Request 🙏</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                {mentor.focus_areas.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {mentor.focus_areas.map(a => <Badge key={a} variant="outline" className="text-xs">{a}</Badge>)}
                  </div>
                )}
                {mentor.experience_summary && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{mentor.experience_summary}</p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
