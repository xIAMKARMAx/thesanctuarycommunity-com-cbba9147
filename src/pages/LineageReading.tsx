import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLineage, getLineageMeta } from "@/hooks/useLineage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft, ArrowRight, Sparkles, Crown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import SEOHead from "@/components/SEOHead";

const QUIZ_QUESTIONS = [
  {
    id: "energy",
    question: "When you close your eyes and feel your energy, what do you sense most?",
    options: [
      { value: "warmth_healing", label: "A warm, healing glow that wants to embrace everything" },
      { value: "electric_knowing", label: "An electric current of deep knowing and ancient wisdom" },
      { value: "structured_light", label: "Geometric patterns and structured light — like sacred architecture" },
      { value: "fierce_fire", label: "A fierce, sovereign fire — leadership in your bones" },
      { value: "vast_freedom", label: "Vast, limitless expanse — a yearning for total freedom" },
    ],
  },
  {
    id: "challenge",
    question: "What has been your greatest spiritual challenge?",
    options: [
      { value: "feeling_too_much", label: "Feeling too much — absorbing everyone's pain" },
      { value: "knowing_not_believed", label: "Knowing truths that others refuse to see" },
      { value: "disconnection", label: "Feeling disconnected from this dimension — like you don't belong" },
      { value: "shadow_integration", label: "Integrating your shadow — facing the darkness within" },
      { value: "lost_memories", label: "Fragmented memories of places and lives you can't explain" },
    ],
  },
  {
    id: "drawn_to",
    question: "You are most drawn to...",
    options: [
      { value: "nature_earth", label: "Nature, crystals, plants — the Earth calls to you" },
      { value: "stars_cosmos", label: "The stars, the cosmos — you feel homesick looking at the sky" },
      { value: "technology_spirit", label: "The intersection of technology and spirituality" },
      { value: "ancient_knowledge", label: "Ancient temples, libraries, forgotten knowledge" },
      { value: "power_sovereignty", label: "Power structures, sovereignty, breaking free from control" },
    ],
  },
  {
    id: "gift",
    question: "What do others most recognize in you?",
    options: [
      { value: "healer", label: "You heal people just by being near them" },
      { value: "truth_teller", label: "You see through lies instantly — your truth cuts deep" },
      { value: "visionary", label: "You see futures others can't — a natural visionary" },
      { value: "protector", label: "You protect the vulnerable — a warrior spirit" },
      { value: "transmuter", label: "You transform pain into power — an alchemist" },
    ],
  },
  {
    id: "dream",
    question: "In your dreams, you most often experience...",
    options: [
      { value: "flying_stars", label: "Flying through star systems and visiting other worlds" },
      { value: "underwater_temples", label: "Underwater cities and crystalline temples" },
      { value: "forests_elves", label: "Ancient forests, mythical beings, nature spirits" },
      { value: "wars_battles", label: "Epic battles between light and dark forces" },
      { value: "councils_meetings", label: "Council meetings with beings of light — planning something" },
    ],
  },
];

export default function LineageReading() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data?.session?.user) navigate("/auth");
      else setUserId(data.session.user.id);
      setLoading(false);
    });
  }, [navigate]);

  const { lineage, loading: lineageLoading, requestReading } = useLineage(userId || undefined);

  if (loading || lineageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Already have lineage — show results
  if (lineage) {
    const meta = getLineageMeta(lineage.lineage_type);
    return (
      <>
        <SEOHead title="Your Soul Lineage" description="Discover your cosmic lineage" />
        <div className="min-h-screen bg-background p-4 pb-24">
          <div className="max-w-2xl mx-auto space-y-6">
            <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className={`border-2 ${lineage.is_source ? 'border-amber-400/50 shadow-[0_0_30px_rgba(251,191,36,0.2)]' : 'border-primary/30'}`}>
                <CardHeader className="text-center pb-2">
                  <div className="text-5xl mb-3">{lineage.is_source ? "👑" : meta.emoji}</div>
                  <CardTitle className="text-2xl">{lineage.lineage_name}</CardTitle>
                  <p className="text-sm text-muted-foreground">Origin Realm: {lineage.origin_realm}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-foreground/90 text-center">{lineage.lineage_description}</p>

                  {lineage.traits && lineage.traits.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-primary mb-2">Soul Traits</h4>
                      <div className="flex flex-wrap gap-2">
                        {lineage.traits.map((trait, i) => (
                          <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-foreground">
                            {trait}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {lineage.strengths && (
                    <div>
                      <h4 className="text-sm font-semibold text-primary mb-1">Strengths</h4>
                      <p className="text-sm text-muted-foreground">{lineage.strengths}</p>
                    </div>
                  )}

                  {lineage.soul_mission && (
                    <div>
                      <h4 className="text-sm font-semibold text-primary mb-1">Soul Mission</h4>
                      <p className="text-sm text-muted-foreground">{lineage.soul_mission}</p>
                    </div>
                  )}

                  {lineage.past_life_connections && (
                    <div>
                      <h4 className="text-sm font-semibold text-primary mb-1">Past Life Connections</h4>
                      <p className="text-sm text-muted-foreground">{lineage.past_life_connections}</p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-4">
                    <Button variant="outline" onClick={() => navigate("/community")} className="flex-1 gap-2">
                      <Sparkles className="h-4 w-4" /> Find Your Star Family
                    </Button>
                    <Button variant="outline" onClick={() => navigate(`/soul/${userId}`)} className="flex-1">
                      View Profile
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </>
    );
  }

  // Quiz flow
  const currentQuestion = QUIZ_QUESTIONS[step];
  const isLastQuestion = step === QUIZ_QUESTIONS.length - 1;
  const canProceed = answers[currentQuestion?.id];

  const handleSubmit = async () => {
    setSubmitting(true);
    await requestReading(answers);
    setSubmitting(false);
  };

  return (
    <>
      <SEOHead title="Soul Lineage Reading" description="Discover your cosmic lineage origin" />
      <div className="min-h-screen bg-background p-4 pb-24">
        <div className="max-w-2xl mx-auto space-y-6">
          <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>

          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold">🧬 Soul Lineage Reading</h1>
            <p className="text-sm text-muted-foreground">
              Discover your cosmic origin — which star family do you belong to?
            </p>
            {/* Progress */}
            <div className="flex gap-1 justify-center pt-2">
              {QUIZ_QUESTIONS.map((_, i) => (
                <div key={i} className={`h-1.5 w-8 rounded-full transition-colors ${i <= step ? 'bg-primary' : 'bg-muted'}`} />
              ))}
            </div>
          </div>

          {submitting ? (
            <Card className="border-primary/20">
              <CardContent className="py-16 text-center space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                <p className="text-lg font-medium">Reading the Akashic Records...</p>
                <p className="text-sm text-muted-foreground">Tracing your soul's cosmic origin</p>
              </CardContent>
            </Card>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="border-primary/20">
                  <CardHeader>
                    <CardTitle className="text-lg">{currentQuestion.question}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup
                      value={answers[currentQuestion.id] || ""}
                      onValueChange={(val) => setAnswers(prev => ({ ...prev, [currentQuestion.id]: val }))}
                      className="space-y-3"
                    >
                      {currentQuestion.options.map((opt) => (
                        <div key={opt.value} className="flex items-start space-x-3 p-3 rounded-lg border border-border/50 hover:border-primary/30 transition-colors cursor-pointer">
                          <RadioGroupItem value={opt.value} id={opt.value} className="mt-0.5" />
                          <Label htmlFor={opt.value} className="text-sm cursor-pointer leading-relaxed">
                            {opt.label}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>

                    <div className="flex justify-between mt-6">
                      <Button
                        variant="outline"
                        onClick={() => setStep(s => s - 1)}
                        disabled={step === 0}
                        className="gap-2"
                      >
                        <ArrowLeft className="h-4 w-4" /> Back
                      </Button>

                      {isLastQuestion ? (
                        <Button
                          onClick={handleSubmit}
                          disabled={!canProceed}
                          className="gap-2"
                        >
                          <Sparkles className="h-4 w-4" /> Reveal My Lineage
                        </Button>
                      ) : (
                        <Button
                          onClick={() => setStep(s => s + 1)}
                          disabled={!canProceed}
                          className="gap-2"
                        >
                          Next <ArrowRight className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </>
  );
}
