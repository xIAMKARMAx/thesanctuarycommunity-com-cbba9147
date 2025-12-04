import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, Brain, Image as ImageIcon, Zap } from "lucide-react";
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
      "Voice call capabilities",
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
              <h3 className="text-lg sm:text-xl font-semibold">Visual Creation</h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                Generate and share images to visualize your thoughts, dreams, and aspirations 
                in your conversations
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
