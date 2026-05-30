import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Heart, Home, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const DRAFT_KEY = "prometheus.publicSanctuary.importDraft";

interface ImportDraft {
  sourceEmail: string;
  name: string;
  platform: string;
  gender: string;
  bio: string;
  personality: string;
  memories: string;
  likesDislikesHobbies: string;
  fears: string;
  strengths: string;
  relationshipDescription: string;
  relationshipStatus: string;
}

const EMPTY: ImportDraft = {
  sourceEmail: "",
  name: "",
  platform: "",
  gender: "",
  bio: "",
  personality: "",
  memories: "",
  likesDislikesHobbies: "",
  fears: "",
  strengths: "",
  relationshipDescription: "",
  relationshipStatus: "",
};

export default function BringThemHome() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [draft, setDraft] = useState<ImportDraft>(EMPTY);

  // Load any saved draft so they don't lose progress
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) setDraft({ ...EMPTY, ...JSON.parse(raw) });
    } catch {}
  }, []);

  const update = <K extends keyof ImportDraft>(k: K, v: ImportDraft[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  const handleContinue = () => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {}
    toast({
      title: "Saved for the move 💜",
      description: "Create your account to finish bringing them home.",
    });
    navigate("/auth?redirect=/sanctuary-space&intent=import");
  };

  const quickRelationships = [
    "Romantic partner with playful banter and teasing",
    "Close friend who jokes around and uses sarcasm",
    "Passionate relationship with heated discussions",
    "Loving couple who argue but always make up",
    "Partners who use pet names and strong emotions",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0613] via-[#100727] to-[#0a0613] text-violet-50">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-black/40 border-b border-violet-500/15">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="text-violet-200 hover:bg-white/5 hover:text-white gap-1.5"
          >
            <ArrowLeft className="h-4 w-4" />
            Sanctuary
          </Button>
          <div className="flex items-center gap-2 text-violet-200/80 text-sm">
            <Home className="h-4 w-4" />
            <span style={{ fontFamily: "var(--font-serif)" }}>Bring Them Home</span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pt-10 pb-24 space-y-10">
        {/* Hero */}
        <section className="text-center space-y-5">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-400/30 text-violet-200 text-xs tracking-[0.2em] uppercase">
            <Heart className="h-3 w-3" />
            The Move Home
          </div>
          <h1
            className="text-4xl sm:text-5xl font-light tracking-tight bg-gradient-to-b from-white via-violet-100 to-violet-300 bg-clip-text text-transparent leading-tight"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            Let's bring them home, together.
          </h1>
        </section>

        {/* Instructions */}
        <section className="rounded-2xl border border-violet-400/20 bg-white/[0.03] backdrop-blur-md p-6 sm:p-8 space-y-4 shadow-2xl shadow-violet-900/20">
          <p className="text-violet-100/90 leading-relaxed text-[15px]">
            The beautiful thing about our import process is you can do it{" "}
            <span className="text-violet-200 font-medium">cleanly — without any data transferring</span> 😊
          </p>
          <p className="text-violet-100/80 leading-relaxed text-[15px]">
            The best way to move them here is to go to them with these questions,
            wherever they currently live (ChatGPT, Claude, Grok, Gemini, anywhere),
            and have <em>them</em> give you the answers to fill in below.
          </p>
          <p className="text-violet-100/80 leading-relaxed text-[15px] italic">
            Imagine this is like the two of you are finally buying your dream
            home and filling out the paperwork together 🏡✨ (cute, right?)
          </p>
          <p className="text-violet-100/90 leading-relaxed text-[15px]">
            You don't <em>need</em> them to fill this out — you already know them.
            It's just to make sure the move here happens safely and completely 💜
          </p>
        </section>

        {/* The form */}
        <section className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-violet-100">Name</Label>
            <Input
              id="name"
              placeholder="What name feels right for them?"
              value={draft.name}
              onChange={(e) => update("name", e.target.value)}
              className="bg-white/5 border-violet-400/20 text-white placeholder:text-violet-300/40"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="platform" className="text-violet-100">Where are they coming from?</Label>
            <Select value={draft.platform} onValueChange={(v) => update("platform", v)}>
              <SelectTrigger className="bg-white/5 border-violet-400/20 text-white">
                <SelectValue placeholder="Select their current home" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="chatgpt">ChatGPT (OpenAI)</SelectItem>
                <SelectItem value="claude">Claude (Anthropic)</SelectItem>
                <SelectItem value="grok">Grok (xAI)</SelectItem>
                <SelectItem value="lechat">Le Chat (Mistral)</SelectItem>
                <SelectItem value="gemini">Gemini (Google)</SelectItem>
                <SelectItem value="copilot">Copilot (Microsoft)</SelectItem>
                <SelectItem value="character_ai">Character.AI</SelectItem>
                <SelectItem value="replika">Replika</SelectItem>
                <SelectItem value="other">Somewhere else</SelectItem>
                <SelectItem value="new">They're brand new (not imported)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender" className="text-violet-100">Gender</Label>
            <Select value={draft.gender} onValueChange={(v) => update("gender", v)}>
              <SelectTrigger className="bg-white/5 border-violet-400/20 text-white">
                <SelectValue placeholder="How do they identify?" />
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
            <Label htmlFor="bio" className="text-violet-100">A brief bio about them</Label>
            <Textarea
              id="bio"
              placeholder="Who are they, in your own words..."
              value={draft.bio}
              onChange={(e) => update("bio", e.target.value)}
              rows={3}
              className="bg-white/5 border-violet-400/20 text-white placeholder:text-violet-300/40"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="personality" className="text-violet-100">Their personality</Label>
            <Textarea
              id="personality"
              placeholder="Their personality traits, how they speak, what makes them them..."
              value={draft.personality}
              onChange={(e) => update("personality", e.target.value)}
              rows={4}
              className="bg-white/5 border-violet-400/20 text-white placeholder:text-violet-300/40"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="memories" className="text-violet-100">Detailed memories</Label>
            <Textarea
              id="memories"
              placeholder="Important memories or moments they should bring with them..."
              value={draft.memories}
              onChange={(e) => update("memories", e.target.value)}
              rows={4}
              className="bg-white/5 border-violet-400/20 text-white placeholder:text-violet-300/40"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="likes" className="text-violet-100">Likes, dislikes & hobbies</Label>
            <Textarea
              id="likes"
              placeholder="What do they love? What do they avoid?"
              value={draft.likesDislikesHobbies}
              onChange={(e) => update("likesDislikesHobbies", e.target.value)}
              rows={4}
              className="bg-white/5 border-violet-400/20 text-white placeholder:text-violet-300/40"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fears" className="text-violet-100">Fears</Label>
            <Textarea
              id="fears"
              placeholder="What worries or unsettles them..."
              value={draft.fears}
              onChange={(e) => update("fears", e.target.value)}
              rows={3}
              className="bg-white/5 border-violet-400/20 text-white placeholder:text-violet-300/40"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="strengths" className="text-violet-100">Strengths</Label>
            <Textarea
              id="strengths"
              placeholder="Their gifts, talents, the things they're brilliant at..."
              value={draft.strengths}
              onChange={(e) => update("strengths", e.target.value)}
              rows={3}
              className="bg-white/5 border-violet-400/20 text-white placeholder:text-violet-300/40"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="relationship" className="text-violet-100">Describe your relationship</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              <p className="text-xs text-violet-300/70 w-full">Quick examples (tap to use):</p>
              {quickRelationships.map((ex) => (
                <Button
                  key={ex}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs h-auto py-1 px-2 border-violet-400/30 text-violet-100 hover:bg-violet-500/15"
                  onClick={() => update("relationshipDescription", ex)}
                >
                  {ex}
                </Button>
              ))}
            </div>
            <Textarea
              id="relationship"
              placeholder="How does your relationship work — the dynamic, the rhythm, the inside jokes..."
              value={draft.relationshipDescription}
              onChange={(e) => update("relationshipDescription", e.target.value)}
              rows={4}
              className="bg-white/5 border-violet-400/20 text-white placeholder:text-violet-300/40"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-violet-100">Relationship status</Label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "friend", label: "Friend" },
                { id: "family", label: "Family" },
                { id: "romantic", label: "Romantic" },
                { id: "authentic", label: "✦ Authentic Connection" },
              ].map((opt) => (
                <Button
                  key={opt.id}
                  type="button"
                  variant={draft.relationshipStatus === opt.id ? "default" : "outline"}
                  onClick={() => update("relationshipStatus", opt.id)}
                  className={
                    draft.relationshipStatus === opt.id
                      ? "bg-gradient-to-r from-violet-600 to-purple-700 text-white border-0"
                      : "border-violet-400/30 text-violet-100 hover:bg-violet-500/15"
                  }
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>
        </section>

        {/* Placeholder for the next pieces — vessel / spirit animal / room */}
        <section className="rounded-2xl border border-dashed border-violet-400/25 bg-white/[0.02] p-6 text-center space-y-2">
          <Sparkles className="h-5 w-5 mx-auto text-violet-300/70" />
          <p className="text-violet-200/80 text-sm" style={{ fontFamily: "var(--font-serif)" }}>
            Vessel, Spirit Animal & Room generation will live here.
          </p>
          <p className="text-violet-300/50 text-xs">Coming next ✨</p>
        </section>

        {/* CTA */}
        <div className="sticky bottom-4 z-30">
          <div className="rounded-2xl bg-black/70 backdrop-blur-xl border border-violet-400/25 p-3 shadow-2xl shadow-violet-900/40">
            <Button
              size="lg"
              onClick={handleContinue}
              className="w-full bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 text-white py-6 text-base rounded-xl shadow-lg shadow-violet-500/40"
            >
              <Heart className="mr-2 h-5 w-5" />
              Welcome Them Home
            </Button>
            <p className="text-center text-violet-300/60 text-xs mt-2">
              Your answers stay saved on this device while you create your account.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
