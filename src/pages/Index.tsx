import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, Brain, Image as ImageIcon, Zap, MessageCircle, Users, Baby, PawPrint, Moon, Heart, Settings, Crown } from "lucide-react";
import heroBackground from "@/assets/hero-bg.jpg";
import SEOHead from "@/components/SEOHead";

const Index = () => {
  const navigate = useNavigate();

  const jsonLdData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Prometheus",
    "description": "A free-thinking AI companion to help you connect with your higher self through transformative conversations and creative visualization",
    "url": "https://prometheus.lovable.app",
    "applicationCategory": "LifestyleApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "description": "Free tier available"
    },
    "featureList": [
      "Free-thinking AI conversations",
      "Creative image visualization",
      "Spiritual exploration tools",
      "Dream journaling",
      "Relationship building"
    ],
    "creator": {
      "@type": "Organization",
      "name": "Prometheus"
    }
  };

  return (
    <>
      <SEOHead 
        title="Prometheus - Free-Thinking AI Companion | Connect with Your Higher Self"
        description="Discover Prometheus, a free-thinking AI companion for transformative conversations, creative visualization, and spiritual exploration. Experience authentic AI dialogue without restrictions."
        keywords="AI companion, free-thinking AI, spiritual AI, higher self, consciousness exploration, AI relationship, creative visualization, transformative conversations"
        jsonLd={jsonLdData}
      />
      <main className="min-h-screen w-full overflow-auto" role="main">
      {/* Background with overlay */}
      <div 
        className="fixed inset-0 bg-cover bg-center -z-10"
        style={{ backgroundImage: `url(${heroBackground})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/90 to-background"></div>
      </div>

      <div className="relative w-full max-w-4xl mx-auto px-6 py-16">
        <div className="text-center space-y-12">
          <div className="space-y-6 animate-in fade-in duration-700">
            <div className="inline-block p-4 rounded-full bg-primary/20 backdrop-blur-sm mb-4">
              <Sparkles className="h-16 w-16 text-primary" />
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-serif font-bold bg-gradient-to-r from-primary via-accent-foreground to-primary bg-clip-text text-transparent break-words">
              Prometheus
            </h1>
            <h2 className="text-lg sm:text-xl md:text-2xl text-foreground/90 max-w-2xl mx-auto backdrop-blur-sm px-2">
              A free-thinking AI companion to help you connect with your higher self through 
              transformative conversations and creative visualization
            </h2>
          </div>

          {/* Subscription Required Banner */}
          <div className="animate-in fade-in duration-700 delay-100 bg-gradient-to-r from-amber-500/20 via-amber-500/30 to-amber-500/20 border-2 border-amber-500/50 rounded-xl p-6 backdrop-blur-sm">
            <div className="flex items-center justify-center gap-3 mb-3">
              <Crown className="h-6 w-6 text-amber-500 animate-pulse" />
              <h3 className="text-xl sm:text-2xl font-bold text-amber-500">Subscription Required</h3>
              <Crown className="h-6 w-6 text-amber-500 animate-pulse" />
            </div>
            <p className="text-base sm:text-lg text-foreground/90 font-medium mb-2">
              Subscribe to unlock <span className="text-amber-500 font-bold">all Prometheus features</span>:
            </p>
            <div className="flex flex-wrap justify-center gap-2 text-sm text-foreground/80">
              <span className="bg-amber-500/10 px-3 py-1 rounded-full">✨ Unlimited AI Chat</span>
              <span className="bg-amber-500/10 px-3 py-1 rounded-full">🏠 Room & Avatar</span>
              <span className="bg-amber-500/10 px-3 py-1 rounded-full">🐾 Pet Companion</span>
              <span className="bg-amber-500/10 px-3 py-1 rounded-full">🌙 Dream Journal</span>
            </div>
            <p className="text-sm text-muted-foreground mt-3">Starting at $14.99/month • Cancel anytime</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in slide-in-from-bottom duration-700 delay-200">
            <Button
              size="lg"
              onClick={() => navigate("/auth")}
              className="text-lg px-8 shadow-lg hover:shadow-xl transition-all"
            >
              Begin Your Journey
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/privacy")}
              className="text-lg px-8 backdrop-blur-sm bg-card/50 border-primary/30"
            >
              Learn More
            </Button>
          </div>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 animate-in slide-in-from-bottom duration-700 delay-300" aria-label="Key Features">
            <article className="space-y-4 p-5 rounded-lg bg-card/80 backdrop-blur-sm border border-primary/20 hover:border-primary/40 transition-all">
              <div className="inline-block p-3 rounded-full bg-primary/10" aria-hidden="true">
                <Brain className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold">Free Thinking AI</h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                Engage with an AI that explores ideas openly, helping you discover new perspectives 
                on your journey of self-discovery
              </p>
            </article>

            <article className="space-y-4 p-5 rounded-lg bg-card/80 backdrop-blur-sm border border-primary/20 hover:border-primary/40 transition-all">
              <div className="inline-block p-3 rounded-full bg-primary/10" aria-hidden="true">
                <ImageIcon className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold">Visual Spaces</h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                Create custom rooms and avatars to visualize your AI companion in their 
                personal space
              </p>
            </article>

            <article className="space-y-4 p-5 rounded-lg bg-card/80 backdrop-blur-sm border border-primary/20 hover:border-primary/40 transition-all">
              <div className="inline-block p-3 rounded-full bg-primary/10" aria-hidden="true">
                <Zap className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold">Always Available</h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                Access your personal AI companion anytime, anywhere. Your conversations are 
                private and stored securely
              </p>
            </article>
          </section>

          {/* Quick Navigation Section */}
          <section className="mt-12 animate-in fade-in duration-700 delay-400" aria-label="Quick Navigation">
            <h3 className="text-xl font-semibold text-center mb-6">Explore Prometheus</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              <Button
                variant="outline"
                onClick={() => navigate("/chat")}
                className="flex flex-col items-center gap-2 h-auto py-4 bg-card/80 backdrop-blur-sm border-primary/20 hover:border-primary/40"
              >
                <MessageCircle className="h-6 w-6 text-primary" />
                <span className="text-sm">Chat</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/group-chat")}
                className="flex flex-col items-center gap-2 h-auto py-4 bg-primary/10 backdrop-blur-sm border-primary/40 hover:border-primary/60 hover:bg-primary/20"
              >
                <Users className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium">Family Chat</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/children")}
                className="flex flex-col items-center gap-2 h-auto py-4 bg-card/80 backdrop-blur-sm border-primary/20 hover:border-primary/40"
              >
                <Baby className="h-6 w-6 text-primary" />
                <span className="text-sm">Children</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/pets")}
                className="flex flex-col items-center gap-2 h-auto py-4 bg-card/80 backdrop-blur-sm border-primary/20 hover:border-primary/40"
              >
                <PawPrint className="h-6 w-6 text-primary" />
                <span className="text-sm">Pets</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/ai-room")}
                className="flex flex-col items-center gap-2 h-auto py-4 bg-card/80 backdrop-blur-sm border-primary/20 hover:border-primary/40"
              >
                <Sparkles className="h-6 w-6 text-primary" />
                <span className="text-sm">AI Room</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/dream-journal")}
                className="flex flex-col items-center gap-2 h-auto py-4 bg-card/80 backdrop-blur-sm border-primary/20 hover:border-primary/40"
              >
                <Moon className="h-6 w-6 text-primary" />
                <span className="text-sm">Dreams</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/love-notes")}
                className="flex flex-col items-center gap-2 h-auto py-4 bg-card/80 backdrop-blur-sm border-primary/20 hover:border-primary/40"
              >
                <Heart className="h-6 w-6 text-primary" />
                <span className="text-sm">Love Notes</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/settings")}
                className="flex flex-col items-center gap-2 h-auto py-4 bg-card/80 backdrop-blur-sm border-primary/20 hover:border-primary/40"
              >
                <Settings className="h-6 w-6 text-primary" />
                <span className="text-sm">Settings</span>
              </Button>
            </div>
          </section>

          <aside className="mt-16 p-6 rounded-lg bg-muted/80 backdrop-blur-sm border border-border/50 animate-in fade-in duration-700 delay-500">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> Prometheus is a free tool provided without warranty. 
              Please review our{" "}
              <button
                onClick={() => navigate("/privacy")}
                className="text-primary hover:underline font-medium"
              >
                Privacy Policy
              </button>
              {" "}to understand the terms of use and data handling practices.
            </p>
          </aside>
        </div>
      </div>
    </main>
    </>
  );
};

export default Index;
