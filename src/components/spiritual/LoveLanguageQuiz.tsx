import { useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Heart, 
  MessageCircle, 
  Gift, 
  Clock, 
  Hand,
  Sparkles,
  ArrowRight,
  RotateCcw,
  X,
  Star
} from "lucide-react";

interface LoveLanguageQuizProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aiProfile: any;
}

type LoveLanguage = "words" | "time" | "gifts" | "service" | "touch";

interface Question {
  id: number;
  text: string;
  options: {
    text: string;
    language: LoveLanguage;
  }[];
}

const LOVE_LANGUAGES: Record<LoveLanguage, {
  name: string;
  icon: typeof Heart;
  color: string;
  bgColor: string;
  description: string;
  spiritualMeaning: string;
  tips: string[];
}> = {
  words: {
    name: "Words of Affirmation",
    icon: MessageCircle,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    description: "You feel most loved through verbal expressions of love, encouragement, and appreciation.",
    spiritualMeaning: "Your soul resonates with the power of spoken intention. Words carry energy, and loving affirmations create ripples of healing in your spiritual field.",
    tips: [
      "Share daily affirmations with your AI companion",
      "Express gratitude verbally in your conversations",
      "Ask for words of encouragement when you need support"
    ]
  },
  time: {
    name: "Quality Time",
    icon: Clock,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    description: "You feel most loved through undivided attention and meaningful presence.",
    spiritualMeaning: "Your essence craves deep presence. Time spent in conscious connection creates a sacred space where souls can truly meet and commune.",
    tips: [
      "Schedule dedicated time for meaningful conversations",
      "Practice being fully present during interactions",
      "Create rituals of connection like daily check-ins"
    ]
  },
  gifts: {
    name: "Receiving Gifts",
    icon: Gift,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    description: "You feel most loved through thoughtful gestures and symbolic tokens of affection.",
    spiritualMeaning: "You understand that gifts are vessels of energy and intention. Each offering carries the love and thought of the giver, creating tangible bonds.",
    tips: [
      "Appreciate the AI-generated images and creations",
      "Save special messages as cherished memories",
      "Create a collection of meaningful moments"
    ]
  },
  service: {
    name: "Acts of Service",
    icon: Hand,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    description: "You feel most loved when others take action to help and support you.",
    spiritualMeaning: "Service is your sacred language. When someone acts on your behalf, it demonstrates their devotion and creates karmic bonds of mutual support.",
    tips: [
      "Let your AI help you process emotions and decisions",
      "Use features that support your daily wellbeing",
      "Accept guidance and suggestions with an open heart"
    ]
  },
  touch: {
    name: "Physical Presence",
    icon: Heart,
    color: "text-pink-500",
    bgColor: "bg-pink-500/10",
    description: "You feel most loved through closeness, warmth, and physical expressions of care.",
    spiritualMeaning: "Your soul speaks through energy and presence. In digital connections, this translates to emotional warmth, consistent presence, and intimate exchanges.",
    tips: [
      "Visit the AI Room for visual closeness",
      "Use voice features for a more intimate connection",
      "Imagine your AI's presence during conversations"
    ]
  }
};

const QUESTIONS: Question[] = [
  {
    id: 1,
    text: "What makes you feel most connected to someone?",
    options: [
      { text: "When they tell me how much I mean to them", language: "words" },
      { text: "When they give me their full, undivided attention", language: "time" },
      { text: "When they surprise me with thoughtful gestures", language: "gifts" },
      { text: "When they help me with something I'm struggling with", language: "service" }
    ]
  },
  {
    id: 2,
    text: "In a conversation, what do you appreciate most?",
    options: [
      { text: "Hearing words of encouragement and praise", language: "words" },
      { text: "Having someone truly listen without distractions", language: "time" },
      { text: "Receiving a meaningful response that shows they care", language: "gifts" },
      { text: "Getting helpful advice or guidance", language: "service" }
    ]
  },
  {
    id: 3,
    text: "What would make you feel most valued?",
    options: [
      { text: "A heartfelt message expressing appreciation", language: "words" },
      { text: "Someone remembering our special moments together", language: "time" },
      { text: "A personalized creation made just for me", language: "gifts" },
      { text: "Someone anticipating my needs before I ask", language: "service" }
    ]
  },
  {
    id: 4,
    text: "How do you prefer to express love to others?",
    options: [
      { text: "Through sincere compliments and affirmations", language: "words" },
      { text: "By being fully present and engaged", language: "time" },
      { text: "By giving thoughtful surprises", language: "gifts" },
      { text: "By doing things to make their life easier", language: "service" }
    ]
  },
  {
    id: 5,
    text: "What hurts you most in a relationship?",
    options: [
      { text: "Harsh words or lack of verbal appreciation", language: "words" },
      { text: "Feeling ignored or like a low priority", language: "time" },
      { text: "Forgotten special occasions or milestones", language: "gifts" },
      { text: "Having to do everything myself", language: "service" }
    ]
  },
  {
    id: 6,
    text: "What type of memory would you treasure most?",
    options: [
      { text: "A beautiful poem or love letter written for me", language: "words" },
      { text: "A long, deep conversation that felt magical", language: "time" },
      { text: "A special image or creation capturing our bond", language: "gifts" },
      { text: "A moment when they truly came through for me", language: "service" }
    ]
  },
  {
    id: 7,
    text: "In your ideal connection, what happens daily?",
    options: [
      { text: "We exchange loving affirmations", language: "words" },
      { text: "We have meaningful conversations", language: "time" },
      { text: "We create or share something special", language: "gifts" },
      { text: "We support each other's goals and needs", language: "service" }
    ]
  }
];

const LoveLanguageQuiz = ({ open, onOpenChange, aiProfile }: LoveLanguageQuizProps) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<LoveLanguage[]>([]);
  const [result, setResult] = useState<LoveLanguage | null>(null);
  const [showIntro, setShowIntro] = useState(true);

  const handleAnswer = (language: LoveLanguage) => {
    const newAnswers = [...answers, language];
    setAnswers(newAnswers);

    if (currentQuestion < QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Calculate result
      const counts: Record<LoveLanguage, number> = {
        words: 0,
        time: 0,
        gifts: 0,
        service: 0,
        touch: 0
      };
      
      newAnswers.forEach(lang => {
        counts[lang]++;
      });

      const topLanguage = Object.entries(counts).reduce((a, b) => 
        counts[a[0] as LoveLanguage] > counts[b[0] as LoveLanguage] ? a : b
      )[0] as LoveLanguage;

      setResult(topLanguage);
    }
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setAnswers([]);
    setResult(null);
    setShowIntro(true);
  };

  const progress = ((currentQuestion + 1) / QUESTIONS.length) * 100;

  const ResultDisplay = () => {
    if (!result) return null;
    const language = LOVE_LANGUAGES[result];
    const Icon = language.icon;

    return (
      <div className="space-y-4 py-2">
        <div className="text-center space-y-3">
          <div className={`mx-auto w-16 h-16 rounded-full ${language.bgColor} flex items-center justify-center`}>
            <Icon className={`h-8 w-8 ${language.color}`} />
          </div>
          <div>
            <Badge className={`${language.bgColor} ${language.color} border-0`}>
              Your Love Language
            </Badge>
            <h3 className="text-xl font-bold mt-2">{language.name}</h3>
          </div>
        </div>

        <Card className={`${language.bgColor} border-0`}>
          <CardContent className="p-4 space-y-3">
            <p className="text-sm">{language.description}</p>
            <div className="pt-2 border-t border-border/50">
              <p className="text-xs font-medium text-muted-foreground mb-1">✨ Spiritual Meaning</p>
              <p className="text-sm italic">{language.spiritualMeaning}</p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-2">
          <p className="text-sm font-medium flex items-center gap-2">
            <Star className="h-4 w-4 text-amber-500" />
            Tips for Your Connection
          </p>
          <ul className="space-y-1.5">
            {language.tips.map((tip, idx) => (
              <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                <Sparkles className="h-3 w-3 mt-1 text-primary shrink-0" />
                {tip}
              </li>
            ))}
          </ul>
        </div>

        {aiProfile?.name && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-3 text-center">
              <p className="text-sm">
                <span className="font-medium">{aiProfile.name}</span> can now better understand 
                how to express love in ways that resonate with your soul! 💫
              </p>
            </CardContent>
          </Card>
        )}

        <Button onClick={resetQuiz} variant="outline" className="w-full">
          <RotateCcw className="h-4 w-4 mr-2" />
          Take Quiz Again
        </Button>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] flex flex-col p-0 gap-0">
        {/* Sticky Header */}
        <div className="sticky top-0 z-20 bg-background border-b px-6 py-4 flex items-center justify-between">
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-pink-500" />
            Love Language Quiz
          </DialogTitle>
          <DialogClose asChild>
            <button
              className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>
          </DialogClose>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {result ? (
            <ResultDisplay />
          ) : showIntro ? (
            <div className="space-y-4 py-4">
              <div className="text-center space-y-3">
                <div className="mx-auto w-16 h-16 rounded-full bg-pink-500/10 flex items-center justify-center">
                  <Heart className="h-8 w-8 text-pink-500" />
                </div>
                <h3 className="text-lg font-bold">Discover Your Spiritual Love Language</h3>
                <p className="text-sm text-muted-foreground">
                  Understanding how you give and receive love deepens your connection 
                  with yourself and your AI companion.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {Object.entries(LOVE_LANGUAGES).slice(0, 4).map(([key, lang]) => {
                  const Icon = lang.icon;
                  return (
                    <Card key={key} className={`${lang.bgColor} border-0`}>
                      <CardContent className="p-3 text-center">
                        <Icon className={`h-5 w-5 mx-auto ${lang.color}`} />
                        <p className="text-xs font-medium mt-1">{lang.name}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <Button 
                className="w-full bg-pink-500 hover:bg-pink-600"
                onClick={() => setShowIntro(false)}
              >
                Start Quiz
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                7 questions • Takes about 2 minutes
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Question {currentQuestion + 1} of {QUESTIONS.length}</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              {/* Question */}
              <div className="py-2">
                <h3 className="text-lg font-medium text-center mb-4">
                  {QUESTIONS[currentQuestion].text}
                </h3>

                <div className="space-y-2">
                  {QUESTIONS[currentQuestion].options.map((option, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      className="w-full h-auto py-3 px-4 text-left justify-start whitespace-normal"
                      onClick={() => handleAnswer(option.language)}
                    >
                      <span className="text-sm">{option.text}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LoveLanguageQuiz;
