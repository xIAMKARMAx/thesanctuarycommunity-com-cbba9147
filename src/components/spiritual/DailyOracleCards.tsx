import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, RotateCcw, Calendar, Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  ORACLE_DECK, 
  drawRandomCard, 
  getElementColor, 
  getElementBg,
  type OracleCard 
} from "@/lib/oracle-cards";
import { format } from "date-fns";

interface DailyOracleCardsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aiProfile?: { name?: string | null; relationship_description?: string | null } | null;
}

// Helper to get user profile info for Source channeling
const getUserProfile = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("name, gender")
    .eq("id", user.id)
    .single();
  return data;
};

interface TodaysDraw {
  card_name: string;
  card_meaning: string;
  ai_interpretation: string;
  drawn_at: string;
}

const DailyOracleCards = ({ open, onOpenChange, aiProfile }: DailyOracleCardsProps) => {
  const { toast } = useToast();
  
  const [phase, setPhase] = useState<'ready' | 'drawing' | 'revealing' | 'complete'>('ready');
  const [drawnCard, setDrawnCard] = useState<OracleCard | null>(null);
  const [isReversed, setIsReversed] = useState(false);
  const [interpretation, setInterpretation] = useState<string>("");
  const [todaysDraw, setTodaysDraw] = useState<TodaysDraw | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [drawHistory, setDrawHistory] = useState<TodaysDraw[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Check for today's draw when dialog opens
  useEffect(() => {
    if (open) {
      checkTodaysDraw();
      loadDrawHistory();
    }
  }, [open]);

  const checkTodaysDraw = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("oracle_card_draws")
        .select("*")
        .eq("user_id", user.id)
        .eq("draw_date", today)
        .single();

      if (data) {
        setTodaysDraw(data);
        // Find the card in deck
        const card = ORACLE_DECK.find(c => c.name === data.card_name);
        if (card) {
          setDrawnCard(card);
          setIsReversed(data.card_meaning.startsWith("(Reversed)"));
          setInterpretation(data.ai_interpretation || "");
          setPhase('complete');
        }
      } else {
        setTodaysDraw(null);
        setPhase('ready');
      }
    } catch (error) {
      console.error("Error checking today's draw:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDrawHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("oracle_card_draws")
        .select("*")
        .eq("user_id", user.id)
        .order("drawn_at", { ascending: false })
        .limit(7);

      if (data) {
        setDrawHistory(data as TodaysDraw[]);
      }
    } catch (error) {
      console.error("Error loading history:", error);
    }
  };

  const handleDrawCard = async () => {
    setPhase('drawing');
    
    // Animate through cards
    let shuffleCount = 0;
    const shuffleInterval = setInterval(() => {
      const { card, isReversed: rev } = drawRandomCard();
      setDrawnCard(card);
      setIsReversed(rev);
      shuffleCount++;
      
      if (shuffleCount >= 8) {
        clearInterval(shuffleInterval);
        // Final draw
        const final = drawRandomCard();
        setDrawnCard(final.card);
        setIsReversed(final.isReversed);
        setPhase('revealing');
        getInterpretation(final.card, final.isReversed);
      }
    }, 150);
  };

  const getInterpretation = async (card: OracleCard, reversed: boolean) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      // Get USER profile for Source to address them personally
      const userProfile = await getUserProfile();

      const response = await supabase.functions.invoke("interpret-oracle-card", {
        body: {
          cardName: card.name,
          cardMeaning: reversed ? card.reversed : card.upright,
          isReversed: reversed,
          affirmation: card.affirmation,
          userName: userProfile?.name,
          userGender: userProfile?.gender,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to get interpretation");
      }

      setInterpretation(response.data.interpretation);
      setPhase('complete');
      
      toast({
        title: "Card Revealed! ✨",
        description: `You drew ${card.name}${reversed ? ' (Reversed)' : ''}`,
      });
    } catch (error) {
      console.error("Interpretation error:", error);
      // Fallback interpretation
      setInterpretation(reversed ? card.reversed : card.upright);
      setPhase('complete');
      
      toast({
        title: "Card Drawn",
        description: "Using the card's traditional meaning.",
        variant: "default",
      });
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Consulting the cosmos...</p>
        </div>
      );
    }

    if (showHistory) {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Recent Draws</h3>
            <Button variant="ghost" size="sm" onClick={() => setShowHistory(false)}>
              Back
            </Button>
          </div>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {drawHistory.map((draw, i) => {
              const card = ORACLE_DECK.find(c => c.name === draw.card_name);
              return (
                <Card key={i} className="p-3">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{card?.image || '🔮'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{draw.card_name}</span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(draw.drawn_at), "MMM d")}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                        {draw.ai_interpretation}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      );
    }

    if (phase === 'ready') {
      return (
        <div className="flex flex-col items-center py-8 space-y-6">
          <div className="relative">
            <div className="w-32 h-44 bg-gradient-to-br from-purple-600 to-indigo-800 rounded-xl shadow-lg flex items-center justify-center border-2 border-purple-400/50">
              <Sparkles className="h-12 w-12 text-purple-200" />
            </div>
            <div className="absolute -top-2 -right-2 w-32 h-44 bg-gradient-to-br from-purple-600 to-indigo-800 rounded-xl shadow-lg -z-10 rotate-3 opacity-60" />
            <div className="absolute -top-4 -right-4 w-32 h-44 bg-gradient-to-br from-purple-600 to-indigo-800 rounded-xl shadow-lg -z-20 rotate-6 opacity-30" />
          </div>
          
           <div className="text-center space-y-2">
            <h3 className="text-lg font-medium">Daily Guidance from Source</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Open your heart, focus on your intention, and receive today's channeled message from Source.
            </p>
          </div>

          <Button onClick={handleDrawCard} className="gap-2">
            <Sparkles className="h-4 w-4" />
            Draw Your Card
          </Button>

          {drawHistory.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowHistory(true)}
              className="gap-2"
            >
              <Calendar className="h-4 w-4" />
              View History
            </Button>
          )}
        </div>
      );
    }

    if (phase === 'drawing') {
      return (
        <div className="flex flex-col items-center py-8 space-y-6">
          <div className={`w-32 h-44 rounded-xl shadow-lg flex items-center justify-center border-2 transition-all duration-150 ${drawnCard ? getElementBg(drawnCard.element) : 'bg-primary/10 border-primary/30'}`}>
            <span className="text-5xl animate-pulse">{drawnCard?.image || '✨'}</span>
          </div>
          <p className="text-muted-foreground animate-pulse">Shuffling the cosmic deck...</p>
        </div>
      );
    }

    if (phase === 'revealing' || phase === 'complete') {
      if (!drawnCard) return null;

      return (
        <div className="space-y-4">
          {/* Card Display */}
          <div className="flex flex-col items-center">
            <div className={`w-36 h-48 rounded-xl shadow-lg flex flex-col items-center justify-center border-2 ${getElementBg(drawnCard.element)} ${isReversed ? 'rotate-180' : ''}`}>
              <span className={`text-5xl ${isReversed ? 'rotate-180' : ''}`}>{drawnCard.image}</span>
            </div>
            <div className="mt-3 text-center">
              <h3 className="text-lg font-semibold">{drawnCard.name}</h3>
              <div className="flex items-center gap-2 justify-center mt-1">
                <Badge variant="outline" className={getElementColor(drawnCard.element)}>
                  {drawnCard.element}
                </Badge>
                {isReversed && (
                  <Badge variant="secondary" className="gap-1">
                    <RotateCcw className="h-3 w-3" />
                    Reversed
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Interpretation */}
          <Card className={`${getElementBg(drawnCard.element)}`}>
            <CardContent className="p-4 space-y-3">
              {phase === 'revealing' ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Source is channeling your message...</span>
                </div>
              ) : (
                <>
                  <div>
                    <p className="text-sm font-medium mb-1">Message from Source</p>
                    <p className="text-sm text-muted-foreground">{interpretation}</p>
                  </div>
                  <div className="pt-2 border-t border-border/50">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Affirmation</p>
                    <p className="text-sm italic">"{drawnCard.affirmation}"</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {phase === 'complete' && (
            <div className="flex justify-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowHistory(true)}
                className="gap-2"
              >
                <Calendar className="h-4 w-4" />
                Past Draws
              </Button>
              <Button size="sm" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          )}
        </div>
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col p-0 gap-0">
        <div className="sticky top-0 z-20 bg-background border-b px-6 py-4 flex items-center justify-between">
          <DialogTitle className="flex items-center gap-2 m-0">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Daily Oracle Cards
          </DialogTitle>
          <button
            className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
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

export default DailyOracleCards;
