import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2, X, Lock, Eye, HelpCircle, Sun, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useToast } from "@/hooks/use-toast";
import { MAJOR_ARCANA, drawCelticCrossSpread, drawSingleCard, type TarotSpread } from "@/lib/tarot-cards";

type ReadingMode = "full" | "yes_no" | "divine_message";

interface TarotReadingProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// All paid subscriptions get access
const ALLOWED_PRODUCTS = [
  "prod_U3xVsHqEFcsR2V", // Awakening new
  "prod_TtTdHv6WE0qozS", // Awakening legacy
  "prod_U3xV1AfsrdaJTz", // Anchoring new
  "prod_TgZlr0QLYQPqEn", // Anchoring legacy
  "prod_Tt8qVh88c2WQld", // Architect
  "prod_U5jdDVZhQFGQWv", // New Earth
  "source_grant",
];

const MODE_INFO: Record<ReadingMode, { icon: React.ReactNode; title: string; desc: string; cooldown: string }> = {
  full: {
    icon: <Eye className="h-6 w-6" />,
    title: "Full Celtic Cross",
    desc: "10-card spread — A complete life reading",
    cooldown: "1 per day",
  },
  yes_no: {
    icon: <HelpCircle className="h-6 w-6" />,
    title: "Yes or No",
    desc: "Ask a direct question, receive a clear answer",
    cooldown: "1 per day",
  },
  divine_message: {
    icon: <Sun className="h-6 w-6" />,
    title: "Divine Message",
    desc: "A weekly transmission from Source meant just for you",
    cooldown: "1 per week",
  },
};

const TarotReading = ({ open, onOpenChange }: TarotReadingProps) => {
  const { toast } = useToast();
  const { isSubscribed, isAdmin, productId } = useSubscription();
  const hasAccess = isAdmin || (isSubscribed && ALLOWED_PRODUCTS.includes(productId || ""));

  const [phase, setPhase] = useState<"choose" | "ask" | "drawing" | "revealing" | "complete" | "locked">("choose");
  const [readingMode, setReadingMode] = useState<ReadingMode>("full");
  const [question, setQuestion] = useState("");
  const [spread, setSpread] = useState<TarotSpread | null>(null);
  const [interpretation, setInterpretation] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [revealedCards, setRevealedCards] = useState<number[]>([]);
  const [cooldowns, setCooldowns] = useState<Record<string, boolean>>({ full: false, yes_no: false, divine_message: false });
  const [existingReadings, setExistingReadings] = useState<Record<string, any>>({});

  useEffect(() => {
    if (open) {
      checkCooldowns();
    }
  }, [open]);

  const checkCooldowns = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (!hasAccess) {
        setPhase("locked");
        setIsLoading(false);
        return;
      }

      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

      // Check all three reading types
      const [fullRes, yesNoRes, divineRes] = await Promise.all([
        supabase
          .from("tarot_readings")
          .select("*")
          .eq("user_id", user.id)
          .eq("reading_type", "full")
          .gte("created_at", twentyFourHoursAgo)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("tarot_readings")
          .select("*")
          .eq("user_id", user.id)
          .eq("reading_type", "yes_no")
          .gte("created_at", twentyFourHoursAgo)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("tarot_readings")
          .select("*")
          .eq("user_id", user.id)
          .eq("reading_type", "divine_message")
          .gte("created_at", sevenDaysAgo)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      const newCooldowns = {
        full: !!fullRes.data,
        yes_no: !!yesNoRes.data,
        divine_message: !!divineRes.data,
      };
      setCooldowns(newCooldowns);

      const readings: Record<string, any> = {};
      if (fullRes.data) readings.full = fullRes.data;
      if (yesNoRes.data) readings.yes_no = yesNoRes.data;
      if (divineRes.data) readings.divine_message = divineRes.data;
      setExistingReadings(readings);

      setPhase("choose");
    } catch (error) {
      console.error("Error checking cooldowns:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectMode = (mode: ReadingMode) => {
    // If on cooldown, show the existing reading
    if (cooldowns[mode] && existingReadings[mode]) {
      const data = existingReadings[mode];
      const cards = typeof data.cards === "string" ? JSON.parse(data.cards) : data.cards;
      setSpread({
        cards: cards.map((c: any) => ({
          card: MAJOR_ARCANA.find(m => m.name === c.name) || MAJOR_ARCANA[0],
          isReversed: c.isReversed,
          position: c.position,
        })),
      });
      setInterpretation(data.ai_interpretation);
      setRevealedCards(cards.map((_: any, i: number) => i));
      setQuestion(data.question || "");
      setReadingMode(mode);
      setPhase("complete");
      return;
    }

    setReadingMode(mode);
    setQuestion("");
    setPhase("ask");
  };

  const handleStartReading = async () => {
    if (!hasAccess) {
      setPhase("locked");
      return;
    }

    const drawnSpread = readingMode === "full" ? drawCelticCrossSpread() : drawSingleCard();
    setSpread(drawnSpread);
    setPhase("drawing");
    setRevealedCards([]);

    const cardCount = drawnSpread.cards.length;
    for (let i = 0; i < cardCount; i++) {
      await new Promise(r => setTimeout(r, readingMode === "full" ? 500 : 800));
      setRevealedCards(prev => [...prev, i]);
    }

    setPhase("revealing");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const cardsPayload = drawnSpread.cards.map(c => ({
        name: c.card.name,
        numeral: c.card.numeral,
        position: c.position,
        upright: c.card.upright,
        reversed: c.card.reversed,
        isReversed: c.isReversed,
      }));

      const response = await supabase.functions.invoke("tarot-reading", {
        body: {
          question: question.trim() || null,
          cards: cardsPayload,
          readingMode,
        },
      });

      if (response.error) {
        const errorMsg = typeof response.error === "object" && "message" in response.error
          ? response.error.message : String(response.error);
        throw new Error(errorMsg);
      }

      setInterpretation(response.data.interpretation);
      setPhase("complete");

      toast({
        title: "Reading Complete ✨",
        description: readingMode === "divine_message"
          ? "Source has sent you a divine message."
          : "Source has spoken through the cards.",
      });
    } catch (error: any) {
      console.error("Tarot reading error:", error);
      const fallback = drawnSpread.cards.map(c =>
        `${c.position}: ${c.card.name} — ${c.isReversed ? c.card.reversed : c.card.upright}`
      ).join(". ");
      setInterpretation(fallback);
      setPhase("complete");

      toast({
        title: "Reading Complete",
        description: "Using traditional card meanings.",
        variant: "default",
      });
    }
  };

  const renderCardBack = () => (
    <div className="w-16 h-24 sm:w-20 sm:h-28 bg-gradient-to-br from-indigo-700 to-purple-900 rounded-lg shadow-lg flex items-center justify-center border border-indigo-400/40">
      <Sparkles className="h-5 w-5 text-indigo-300 animate-pulse" />
    </div>
  );

  const renderCard = (index: number) => {
    if (!spread) return renderCardBack();
    const { card, isReversed, position } = spread.cards[index];
    const isRevealed = revealedCards.includes(index);

    if (!isRevealed) return renderCardBack();

    return (
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-[8px] sm:text-[10px] text-muted-foreground font-medium uppercase tracking-wider text-center leading-tight max-w-[60px] sm:max-w-[80px]">{position}</span>
        <div className={`w-16 h-24 sm:w-20 sm:h-28 rounded-lg shadow-lg flex flex-col items-center justify-center border-2 transition-all duration-500
          ${isReversed ? "rotate-180 border-rose-400/50 bg-rose-950/30" : "border-amber-400/50 bg-amber-950/20"}`}>
          <span className={`text-2xl sm:text-3xl ${isReversed ? "rotate-180" : ""}`}>{card.image}</span>
          <span className={`text-[7px] sm:text-[9px] font-medium mt-0.5 text-center px-0.5 ${isReversed ? "rotate-180" : ""}`}>{card.numeral}</span>
        </div>
        <span className="text-[8px] sm:text-[10px] font-medium text-center max-w-[60px] sm:max-w-[80px] leading-tight">{card.name}</span>
        {isReversed && (
          <Badge variant="secondary" className="text-[7px] px-1 py-0">Reversed</Badge>
        )}
      </div>
    );
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">Preparing the sacred spread...</p>
        </div>
      );
    }

    if (phase === "locked") {
      return (
        <div className="flex flex-col items-center py-8 space-y-4 text-center">
          <Lock className="h-12 w-12 text-muted-foreground" />
          <h3 className="text-lg font-medium">Tarot Readings</h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            AI-powered tarot readings are available for all subscribers ($12.99/mo and above).
          </p>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </div>
      );
    }

    // Mode selection
    if (phase === "choose") {
      return (
        <div className="flex flex-col items-center py-4 space-y-5">
          <div className="text-center space-y-1">
            <h3 className="text-lg font-medium">Choose Your Reading</h3>
            <p className="text-xs text-muted-foreground">Select how Source will speak to you</p>
          </div>

          <div className="grid gap-3 w-full max-w-sm">
            {(Object.keys(MODE_INFO) as ReadingMode[]).map(mode => {
              const info = MODE_INFO[mode];
              const onCooldown = cooldowns[mode];
              return (
                <button
                  key={mode}
                  onClick={() => handleSelectMode(mode)}
                  className="flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-card/50 hover:bg-accent/30 hover:border-primary/40 transition-all text-left group relative"
                >
                  <div className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                    onCooldown ? "bg-muted/30 text-muted-foreground" : "bg-primary/10 text-primary group-hover:bg-primary/20"
                  }`}>
                    {info.icon}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{info.title}</p>
                    <p className="text-xs text-muted-foreground">{info.desc}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">{info.cooldown}</span>
                    </div>
                  </div>
                  {onCooldown && (
                    <Badge variant="secondary" className="text-[10px] absolute top-2 right-2">
                      View Last
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    // Ask phase
    if (phase === "ask") {
      const isSingleCard = readingMode !== "full";
      const modeTitle = MODE_INFO[readingMode].title;

      return (
        <div className="flex flex-col items-center py-4 space-y-5">
          <div className="flex gap-2">
            {isSingleCard ? renderCardBack() : (
              <>
                {Array.from({ length: 5 }, (_, i) => (
                  <div key={i}>{renderCardBack()}</div>
                ))}
              </>
            )}
          </div>
          {readingMode === "full" && (
            <p className="text-[10px] text-muted-foreground">+ 5 more cards in the Celtic Cross</p>
          )}

          <div className="text-center space-y-2 max-w-sm">
            <h3 className="text-lg font-medium">{modeTitle}</h3>
            <p className="text-sm text-muted-foreground">
              {readingMode === "full" && "10-card Celtic Cross — Source will channel deep guidance through the Major Arcana."}
              {readingMode === "yes_no" && "Focus on your question. Source will answer through a single card."}
              {readingMode === "divine_message" && "A single card will channel Source's weekly message meant just for your soul."}
            </p>
          </div>

          {readingMode === "yes_no" && (
            <div className="w-full max-w-sm space-y-2">
              <label className="text-xs text-muted-foreground">Your Yes/No question</label>
              <Textarea
                placeholder="Will I find what I'm looking for?"
                value={question}
                onChange={(e) => setQuestion(e.target.value.slice(0, 200))}
                className="resize-none h-16 text-sm"
              />
              <p className="text-[10px] text-muted-foreground text-right">{question.length}/200</p>
            </div>
          )}

          {readingMode === "full" && (
            <div className="w-full max-w-sm space-y-2">
              <label className="text-xs text-muted-foreground">Ask a question (optional)</label>
              <Textarea
                placeholder="What does my soul need to know right now?"
                value={question}
                onChange={(e) => setQuestion(e.target.value.slice(0, 200))}
                className="resize-none h-16 text-sm"
              />
              <p className="text-[10px] text-muted-foreground text-right">{question.length}/200</p>
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => { setPhase("choose"); setQuestion(""); }}>
              Back
            </Button>
            <Button
              onClick={handleStartReading}
              className="gap-2"
              disabled={readingMode === "yes_no" && !question.trim()}
            >
              <Sparkles className="h-4 w-4" />
              {readingMode === "divine_message" ? "Receive Divine Message" : readingMode === "full" ? "Draw the Cards" : "Draw the Card"}
            </Button>
          </div>
        </div>
      );
    }

    // Drawing / Revealing / Complete
    const cardCount = spread?.cards.length || 0;
    const isCelticCross = cardCount === 10;

    return (
      <div className="space-y-4 py-4">
        {isCelticCross ? (
          // Celtic Cross layout: show in rows for readability
          <div className="space-y-3">
            <div className="flex justify-center gap-2 flex-wrap">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="transition-all duration-500">
                  {renderCard(i)}
                </div>
              ))}
            </div>
            <div className="flex justify-center gap-2 flex-wrap">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i + 6} className="transition-all duration-500">
                  {renderCard(i + 6)}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex justify-center gap-3 sm:gap-5">
            {Array.from({ length: cardCount }, (_, i) => (
              <div key={i} className="transition-all duration-500">
                {renderCard(i)}
              </div>
            ))}
          </div>
        )}

        {question && readingMode !== "divine_message" && (
          <p className="text-center text-xs text-muted-foreground italic">
            "{question}"
          </p>
        )}

        <Card className="border-indigo-500/20 bg-indigo-950/10">
          <CardContent className="p-4 space-y-2">
            {phase !== "complete" ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">
                  {readingMode === "divine_message"
                    ? "Source is channeling your divine message..."
                    : "Source is reading the cards..."}
                </span>
              </div>
            ) : (
              <>
                <p className="text-sm font-medium">
                  {readingMode === "divine_message" ? "Your Divine Message" : "Message from Source"}
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{interpretation}</p>
              </>
            )}
          </CardContent>
        </Card>

        {phase === "complete" && (
          <div className="flex justify-center gap-2">
            <Button variant="outline" size="sm" onClick={() => {
              setPhase("choose");
              setSpread(null);
              setInterpretation("");
              setQuestion("");
              setRevealedCards([]);
            }}>
              Back to Menu
            </Button>
            <Button size="sm" onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col p-0 gap-0">
        <div className="sticky top-0 z-20 bg-background border-b px-6 py-4 flex items-center justify-between">
          <DialogTitle className="flex items-center gap-2 m-0">
            <Sparkles className="h-5 w-5 text-indigo-500" />
            Tarot Reading
          </DialogTitle>
          <button
            className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TarotReading;
