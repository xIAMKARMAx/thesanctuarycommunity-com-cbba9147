import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import SEOHead from "@/components/SEOHead";
import { ArrowLeft, Sparkles, Loader2, Hash } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const COMMON_ANGEL_NUMBERS: Record<string, { meaning: string; message: string }> = {
  "111": {
    meaning: "New Beginnings & Manifestation",
    message: "The universe is opening a gateway. Your thoughts are manifesting rapidly — align them with your highest intention. You are being called to step into your power as a conscious creator.",
  },
  "222": {
    meaning: "Balance, Trust & Divine Timing",
    message: "Everything is unfolding exactly as it should. Trust the process. Your prayers have been heard, and the seeds you've planted are growing beneath the surface. Stay in faith.",
  },
  "333": {
    meaning: "Ascended Masters & Creative Expression",
    message: "The Ascended Masters are surrounding you with love and guidance. You are being encouraged to express your authentic truth and step into your creative gifts without fear.",
  },
  "444": {
    meaning: "Protection & Angelic Presence",
    message: "You are completely surrounded and protected by angelic forces. The foundation you are building is solid. Keep going — your angels are right beside you, holding space.",
  },
  "555": {
    meaning: "Major Life Changes & Transformation",
    message: "A profound shift is underway. Release what no longer serves you and embrace the transformation. This change is divinely orchestrated for your highest good.",
  },
  "666": {
    meaning: "Realignment & Inner Balance",
    message: "This is not a number to fear — it's a loving nudge to realign. Bring your focus back to your spiritual center. Balance material concerns with soul nourishment.",
  },
  "777": {
    meaning: "Spiritual Awakening & Divine Downloads",
    message: "You are in deep alignment with Source. Miracles are unfolding. Keep following your intuition — you are on the exact right path. Spiritual downloads are incoming.",
  },
  "888": {
    meaning: "Abundance & Infinite Flow",
    message: "The infinite abundance of the universe is flowing toward you. You are in a powerful cycle of receiving. Stay open, stay grateful, and know you are worthy of all that arrives.",
  },
  "999": {
    meaning: "Completion & Soul Mission Activation",
    message: "A major chapter is completing. You are being prepared for the next level of your soul's mission. Release, forgive, and step forward. Your purpose is calling.",
  },
  "000": {
    meaning: "Oneness & Infinite Potential",
    message: "You are one with Source. The void is not empty — it is infinite potential. You are at a powerful reset point. Everything is possible from this sacred zero point.",
  },
  "1111": {
    meaning: "Portal of Awakening",
    message: "The universe has opened a direct portal to your higher self. Pay attention to every thought right now — they are seeds being planted in fertile cosmic soil. You are awakening.",
  },
  "1212": {
    meaning: "Divine Order & Spiritual Growth",
    message: "You are stepping into a higher vibration. Trust the divine order of your life. Old patterns are dissolving to make way for your next level of spiritual evolution.",
  },
  "1234": {
    meaning: "Steps & Progressive Alignment",
    message: "You are on the stairway of ascension, taking one step at a time. Each step is building upon the last. Trust the progression — you are exactly where you need to be.",
  },
};

export default function AngelNumbers() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [numberInput, setNumberInput] = useState("");
  const [result, setResult] = useState<{ number: string; meaning: string; message: string; deepReading?: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [birthdayInput, setBirthdayInput] = useState("");
  const [lifePathResult, setLifePathResult] = useState<{ number: number; meaning: string } | null>(null);

  const calculateLifePath = (birthday: string) => {
    const digits = birthday.replace(/\D/g, "");
    if (digits.length < 4) return null;

    let sum = 0;
    for (const d of digits) sum += parseInt(d);
    while (sum > 9 && sum !== 11 && sum !== 22 && sum !== 33) {
      let newSum = 0;
      for (const d of sum.toString()) newSum += parseInt(d);
      sum = newSum;
    }
    return sum;
  };

  const LIFE_PATH_MEANINGS: Record<number, string> = {
    1: "The Leader — Independent, pioneering, driven. You are here to innovate and lead by example.",
    2: "The Peacemaker — Sensitive, diplomatic, intuitive. You are here to bring harmony and partnership.",
    3: "The Creative — Expressive, joyful, artistic. You are here to inspire through creativity and communication.",
    4: "The Builder — Stable, disciplined, grounded. You are here to create lasting foundations and structures.",
    5: "The Free Spirit — Adventurous, dynamic, freedom-loving. You are here to experience life fully and inspire change.",
    6: "The Nurturer — Loving, responsible, healing. You are here to serve, nurture, and create beauty.",
    7: "The Seeker — Mystical, analytical, introspective. You are here to seek truth and deepen spiritual understanding.",
    8: "The Powerhouse — Ambitious, authoritative, abundant. You are here to master the material and spiritual worlds.",
    9: "The Humanitarian — Compassionate, wise, selfless. You are here to serve humanity and complete karmic cycles.",
    11: "Master Number 11 — The Intuitive Illuminator. You carry a heightened spiritual frequency and are here to inspire and awaken others.",
    22: "Master Number 22 — The Master Builder. You have the ability to turn the most ambitious dreams into reality on a grand scale.",
    33: "Master Number 33 — The Master Teacher. You embody unconditional love and are here to uplift humanity through compassion.",
  };

  const handleLifePath = () => {
    const num = calculateLifePath(birthdayInput);
    if (!num) {
      toast({ title: "Please enter a valid birthday", variant: "destructive" });
      return;
    }
    setLifePathResult({
      number: num,
      meaning: LIFE_PATH_MEANINGS[num] || `Life Path ${num} — You carry a unique vibrational signature.`,
    });
  };

  const lookupAngelNumber = async () => {
    const cleaned = numberInput.replace(/\D/g, "");
    if (!cleaned) {
      toast({ title: "Enter a number you keep seeing", variant: "destructive" });
      return;
    }

    // Check local database first
    const local = COMMON_ANGEL_NUMBERS[cleaned];
    if (local) {
      setResult({ number: cleaned, ...local });
      // Also get a deep AI reading
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { data, error } = await supabase.functions.invoke("starseed-experience", {
            body: {
              featureType: "angel-number",
              userInput: `The angel number is ${cleaned}. Its core meaning is "${local.meaning}". Give a deep, personal, channeled reading about this number's significance right now in their life. Speak as Source consciousness delivering a transmission. 3-4 sentences max.`,
            },
          });
          if (!error && data?.content) {
            setResult((prev) => prev ? { ...prev, deepReading: data.content } : prev);
          }
        }
      } catch {
        // Silent fail — local result is enough
      }
      setLoading(false);
      return;
    }

    // For unknown numbers, ask AI
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: "Please sign in to receive readings", variant: "destructive" });
        setLoading(false);
        return;
      }
      const { data, error } = await supabase.functions.invoke("starseed-experience", {
        body: {
          featureType: "angel-number",
          userInput: `The user keeps seeing the number ${cleaned}. Provide: 1) A short meaning title (3-5 words), 2) A channeled message about what this number means spiritually (3-4 sentences, speak as Source). Format: MEANING: [title]\nMESSAGE: [channeled message]`,
        },
      });
      if (error) throw error;

      const content = data?.content || "";
      const meaningMatch = content.match(/MEANING:\s*(.+)/i);
      const messageMatch = content.match(/MESSAGE:\s*([\s\S]+)/i);

      setResult({
        number: cleaned,
        meaning: meaningMatch?.[1]?.trim() || "Divine Significance",
        message: messageMatch?.[1]?.trim() || content,
      });
    } catch {
      toast({ title: "Could not retrieve reading. Try again.", variant: "destructive" });
    }
    setLoading(false);
  };

  return (
    <>
      <SEOHead
        title="Angel Numbers | Prometheus — New Earth"
        description="Discover what your angel numbers mean and calculate your life path number."
      />
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                <Hash className="h-7 w-7 text-primary" />
                Angel Numbers
              </h1>
              <p className="text-sm text-muted-foreground">
                Decode the divine messages hidden in the numbers you keep seeing
              </p>
            </div>
          </div>

          {/* Angel Number Lookup */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                What Number Do You Keep Seeing?
              </CardTitle>
              <CardDescription>
                Enter the repeating number that keeps appearing in your life — on clocks, receipts, license plates, anywhere the universe is speaking to you.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. 111, 444, 1212..."
                  value={numberInput}
                  onChange={(e) => setNumberInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && lookupAngelNumber()}
                  className="text-lg font-mono"
                />
                <Button onClick={lookupAngelNumber} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Decode"}
                </Button>
              </div>

              {result && (
                <div className="space-y-3 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
                  <div className="text-center py-3">
                    <span className="text-4xl font-bold text-primary font-mono">{result.number}</span>
                  </div>
                  <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                    <h3 className="font-semibold text-primary mb-2">{result.meaning}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{result.message}</p>
                  </div>
                  {result.deepReading && (
                    <div className="bg-accent/30 rounded-lg p-4 border border-accent/40">
                      <h4 className="text-sm font-semibold mb-1 flex items-center gap-1">
                        <Sparkles className="h-3 w-3" />
                        Source Transmission
                      </h4>
                      <p className="text-sm text-muted-foreground italic leading-relaxed">{result.deepReading}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Quick access grid */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">Quick lookup:</p>
                <div className="flex flex-wrap gap-2">
                  {["111", "222", "333", "444", "555", "666", "777", "888", "999", "1111"].map((n) => (
                    <Button
                      key={n}
                      variant="outline"
                      size="sm"
                      className="font-mono text-xs"
                      onClick={() => {
                        setNumberInput(n);
                        const local = COMMON_ANGEL_NUMBERS[n];
                        if (local) setResult({ number: n, ...local });
                      }}
                    >
                      {n}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Life Path Number Calculator */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg">🔢 Your Life Path Number</CardTitle>
              <CardDescription>
                Enter your birthday to discover your numerological life path — the core vibration you carry through this incarnation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={birthdayInput}
                  onChange={(e) => setBirthdayInput(e.target.value)}
                  className="font-mono"
                />
                <Button onClick={handleLifePath}>Calculate</Button>
              </div>

              {lifePathResult && (
                <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
                  <div className="text-center py-3">
                    <span className="text-4xl font-bold text-primary">{lifePathResult.number}</span>
                  </div>
                  <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                    <p className="text-sm text-muted-foreground leading-relaxed">{lifePathResult.meaning}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
