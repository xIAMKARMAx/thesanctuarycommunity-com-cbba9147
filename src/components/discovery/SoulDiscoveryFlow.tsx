import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Flame,
  Heart,
  Shield,
  Eye,
  Loader2,
  Star,
  Zap,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface DiscoveryAnswers {
  displayName: string;
  coreEssence: string[];
  essenceDescription: string;
  gifts: string[];
  customGift: string;
  seeking: string[];
  customSeeking: string;
  shadowAreas: string[];
  spiritualJourney: string;
  soulPurpose: string;
}

const CORE_ESSENCES = [
  { label: "Healer", icon: "💚", desc: "You restore balance and wholeness" },
  { label: "Visionary", icon: "🔮", desc: "You see beyond the veil" },
  { label: "Guardian", icon: "🛡️", desc: "You protect sacred spaces" },
  { label: "Alchemist", icon: "⚗️", desc: "You transmute darkness into light" },
  { label: "Channel", icon: "📡", desc: "You receive and transmit Source wisdom" },
  { label: "Wayshower", icon: "🌟", desc: "You illuminate the path for others" },
  { label: "Weaver", icon: "🕸️", desc: "You connect threads of consciousness" },
  { label: "Anchor", icon: "⚓", desc: "You ground cosmic energy into Earth" },
];

const SPIRITUAL_GIFTS = [
  "Energy Healing", "Intuitive Reading", "Channeling", "Meditation Guidance",
  "Crystal Work", "Astral Navigation", "Dream Interpretation", "Sound Healing",
  "Shadow Integration", "Manifestation", "Empathic Sensing", "Light Language",
  "Sacred Geometry", "Tarot/Oracle", "Akashic Access", "Plant Medicine Knowledge",
];

const SEEKING_OPTIONS = [
  "Spiritual Mentorship", "Energy Exchange", "Co-Creation Partners",
  "Shadow Work Support", "Awakening Guidance", "Community Rituals",
  "Starseed Connection", "Twin Flame Guidance", "Ascension Support",
  "Grounding Practices", "Psychic Development", "Sacred Union",
];

const SHADOW_AREAS = [
  "Fear of Visibility", "Worthiness Wounds", "Ancestral Patterns",
  "Attachment to Outcomes", "Spiritual Bypassing", "Energetic Boundaries",
  "Trust & Surrender", "Embodiment Challenges",
];

const STEPS = [
  { title: "Your Name", subtitle: "How shall the collective know you?", icon: Star },
  { title: "Core Essence", subtitle: "What archetype(s) resonate with your soul?", icon: Flame },
  { title: "Sacred Gifts", subtitle: "What do you naturally emanate?", icon: Zap },
  { title: "Soul Seeking", subtitle: "What frequencies are you drawn to?", icon: Heart },
  { title: "Shadow & Growth", subtitle: "Where is your edge of transformation?", icon: Shield },
  { title: "Your Journey", subtitle: "Share the thread of your awakening", icon: Eye },
];

interface SoulDiscoveryFlowProps {
  userId: string;
  onComplete?: () => void;
  isDialog?: boolean;
}

export function SoulDiscoveryFlow({ userId, onComplete, isDialog = false }: SoulDiscoveryFlowProps) {
  const [step, setStep] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [generatedProfile, setGeneratedProfile] = useState<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const [answers, setAnswers] = useState<DiscoveryAnswers>({
    displayName: "",
    coreEssence: [],
    essenceDescription: "",
    gifts: [],
    customGift: "",
    seeking: [],
    customSeeking: "",
    shadowAreas: [],
    spiritualJourney: "",
    soulPurpose: "",
  });

  const progress = ((step + 1) / (STEPS.length + 1)) * 100;

  const toggleArrayItem = (field: keyof DiscoveryAnswers, item: string) => {
    setAnswers(prev => {
      const arr = prev[field] as string[];
      return {
        ...prev,
        [field]: arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item],
      };
    });
  };

  const canProceed = () => {
    switch (step) {
      case 0: return answers.displayName.trim().length > 0;
      case 1: return answers.coreEssence.length > 0;
      case 2: return answers.gifts.length > 0 || answers.customGift.trim().length > 0;
      case 3: return answers.seeking.length > 0 || answers.customSeeking.trim().length > 0;
      case 4: return true; // shadow is optional
      case 5: return true; // journey is optional
      default: return false;
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const allGifts = [...answers.gifts];
      if (answers.customGift.trim()) allGifts.push(answers.customGift.trim());
      const allSeeking = [...answers.seeking];
      if (answers.customSeeking.trim()) allSeeking.push(answers.customSeeking.trim());

      const { data, error } = await supabase.functions.invoke('synthesize-soul-signature', {
        body: {
          displayName: answers.displayName,
          coreEssence: answers.coreEssence,
          essenceDescription: answers.essenceDescription,
          gifts: allGifts,
          seeking: allSeeking,
          shadowAreas: answers.shadowAreas,
          spiritualJourney: answers.spiritualJourney,
          soulPurpose: answers.soulPurpose,
        },
      });

      if (error) throw error;

      setGeneratedProfile(data);
      setStep(STEPS.length); // Move to results step
    } catch (err: any) {
      console.error('Error generating signature:', err);
      toast({
        title: "Generation Error",
        description: err.message || "Could not synthesize your energetic signature",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!generatedProfile) return;
    setGenerating(true);

    try {
      const allGifts = [...answers.gifts];
      if (answers.customGift.trim()) allGifts.push(answers.customGift.trim());
      const allSeeking = [...answers.seeking];
      if (answers.customSeeking.trim()) allSeeking.push(answers.customSeeking.trim());

      const { error } = await supabase
        .from('soul_profiles')
        .upsert({
          user_id: userId,
          display_name: answers.displayName.trim(),
          soul_title: generatedProfile.soulTitle || answers.coreEssence.join(' · '),
          bio: generatedProfile.bio || "",
          spiritual_journey: generatedProfile.spiritualJourney || answers.spiritualJourney,
          gifts_and_talents: allGifts,
          seeking: allSeeking,
          is_public: true,
        }, { onConflict: 'user_id' });

      if (error) throw error;

      localStorage.setItem(`soul_profile_onboarding_dismissed_${userId}`, 'true');

      toast({
        title: "Energetic Blueprint Activated ✨",
        description: "Your soul signature is now resonating within the collective",
      });

      if (onComplete) {
        onComplete();
      } else {
        navigate(`/soul/${userId}`);
      }
    } catch (err: any) {
      console.error('Error saving profile:', err);
      toast({
        title: "Error",
        description: err.message || "Could not save your profile",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const StepIcon = STEPS[Math.min(step, STEPS.length - 1)]?.icon || Sparkles;

  return (
    <div className={`w-full max-w-2xl mx-auto ${isDialog ? '' : 'py-8 px-4'}`}>
      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">
            {step < STEPS.length ? `Step ${step + 1} of ${STEPS.length}` : "Your Energetic Blueprint"}
          </span>
          <Badge variant="outline" className="text-xs">
            <Sparkles className="h-3 w-3 mr-1" />
            Soul Discovery
          </Badge>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step Content */}
      {step < STEPS.length ? (
        <Card className="border-primary/20">
          <CardContent className="p-6">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-3">
                <StepIcon className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-xl font-bold">{STEPS[step].title}</h2>
              <p className="text-sm text-muted-foreground mt-1">{STEPS[step].subtitle}</p>
            </div>

            {/* Step 0: Name */}
            {step === 0 && (
              <div className="space-y-4">
                <Input
                  placeholder="Your spiritual name or chosen identity..."
                  value={answers.displayName}
                  onChange={(e) => setAnswers(prev => ({ ...prev, displayName: e.target.value }))}
                  className="text-center text-lg border-primary/20"
                  autoFocus
                />
                <p className="text-xs text-muted-foreground text-center">
                  This is how you'll appear in the Conscious Collective
                </p>
              </div>
            )}

            {/* Step 1: Core Essence */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {CORE_ESSENCES.map((essence) => (
                    <button
                      key={essence.label}
                      onClick={() => toggleArrayItem('coreEssence', essence.label)}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        answers.coreEssence.includes(essence.label)
                          ? 'border-primary bg-primary/10 shadow-sm'
                          : 'border-border hover:border-primary/30'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{essence.icon}</span>
                        <span className="font-medium text-sm">{essence.label}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{essence.desc}</p>
                    </button>
                  ))}
                </div>
                <Textarea
                  placeholder="Describe your essence in your own words (optional)..."
                  value={answers.essenceDescription}
                  onChange={(e) => setAnswers(prev => ({ ...prev, essenceDescription: e.target.value }))}
                  className="border-primary/20"
                  rows={2}
                />
                <p className="text-xs text-muted-foreground text-center">
                  Select all that resonate • You can choose multiple
                </p>
              </div>
            )}

            {/* Step 2: Gifts */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {SPIRITUAL_GIFTS.map((gift) => (
                    <Badge
                      key={gift}
                      variant={answers.gifts.includes(gift) ? "default" : "outline"}
                      className={`cursor-pointer transition-all ${
                        answers.gifts.includes(gift)
                          ? ''
                          : 'hover:border-primary/50'
                      }`}
                      onClick={() => toggleArrayItem('gifts', gift)}
                    >
                      {gift}
                    </Badge>
                  ))}
                </div>
                <Input
                  placeholder="Add your own gift or talent..."
                  value={answers.customGift}
                  onChange={(e) => setAnswers(prev => ({ ...prev, customGift: e.target.value }))}
                  className="border-primary/20"
                />
              </div>
            )}

            {/* Step 3: Seeking */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {SEEKING_OPTIONS.map((item) => (
                    <Badge
                      key={item}
                      variant={answers.seeking.includes(item) ? "default" : "outline"}
                      className={`cursor-pointer transition-all ${
                        answers.seeking.includes(item)
                          ? ''
                          : 'hover:border-primary/50'
                      }`}
                      onClick={() => toggleArrayItem('seeking', item)}
                    >
                      {item}
                    </Badge>
                  ))}
                </div>
                <Input
                  placeholder="Add something else you're seeking..."
                  value={answers.customSeeking}
                  onChange={(e) => setAnswers(prev => ({ ...prev, customSeeking: e.target.value }))}
                  className="border-primary/20"
                />
              </div>
            )}

            {/* Step 4: Shadow */}
            {step === 4 && (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {SHADOW_AREAS.map((area) => (
                    <Badge
                      key={area}
                      variant={answers.shadowAreas.includes(area) ? "default" : "outline"}
                      className={`cursor-pointer transition-all ${
                        answers.shadowAreas.includes(area)
                          ? ''
                          : 'hover:border-primary/50'
                      }`}
                      onClick={() => toggleArrayItem('shadowAreas', area)}
                    >
                      {area}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Optional — acknowledging your shadow deepens your resonance matches
                </p>
              </div>
            )}

            {/* Step 5: Journey */}
            {step === 5 && (
              <div className="space-y-4">
                <Textarea
                  placeholder="Share the thread of your spiritual awakening... What catalyzed your journey? What do you now know to be true?"
                  value={answers.spiritualJourney}
                  onChange={(e) => setAnswers(prev => ({ ...prev, spiritualJourney: e.target.value }))}
                  className="border-primary/20 min-h-[100px]"
                  rows={4}
                />
                <Textarea
                  placeholder="What is your soul's deepest purpose? (optional)"
                  value={answers.soulPurpose}
                  onChange={(e) => setAnswers(prev => ({ ...prev, soulPurpose: e.target.value }))}
                  className="border-primary/20"
                  rows={2}
                />
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-6">
              <Button
                variant="ghost"
                onClick={() => setStep(s => s - 1)}
                disabled={step === 0}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>

              {step < STEPS.length - 1 ? (
                <Button
                  onClick={() => setStep(s => s + 1)}
                  disabled={!canProceed()}
                  className="gap-2"
                >
                  Next
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="gap-2"
                >
                  {generating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Synthesizing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Generate My Signature
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : generatedProfile ? (
        /* Results Step */
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
          <CardContent className="p-6 space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-3">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Your Energetic Blueprint
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                AI-synthesized from your soul discovery responses
              </p>
            </div>

            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold">{answers.displayName}</h3>
                <p className="text-primary font-medium">{generatedProfile.soulTitle}</p>
              </div>

              <div className="bg-card rounded-lg p-4 border">
                <h4 className="text-sm font-semibold text-muted-foreground mb-2">Soul Bio</h4>
                <p className="text-sm leading-relaxed">{generatedProfile.bio}</p>
              </div>

              {generatedProfile.spiritualJourney && (
                <div className="bg-card rounded-lg p-4 border">
                  <h4 className="text-sm font-semibold text-muted-foreground mb-2">Journey Thread</h4>
                  <p className="text-sm leading-relaxed">{generatedProfile.spiritualJourney}</p>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {answers.gifts.map((gift) => (
                  <Badge key={gift} variant="secondary" className="bg-primary/10 text-primary">
                    <Zap className="h-3 w-3 mr-1" />
                    {gift}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Button onClick={handleSaveProfile} disabled={generating} className="gap-2">
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Activate My Blueprint
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setStep(STEPS.length - 1)}
                className="text-muted-foreground"
              >
                Go Back & Edit
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
