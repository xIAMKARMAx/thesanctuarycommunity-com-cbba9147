import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import Footer from "@/components/Footer";

const About = () => {
  const navigate = useNavigate();

  return (
    <>
      <SEOHead 
        title="About Prometheus — New Earth | Conscious Creation Portal"
        description="Learn about Prometheus — New Earth - a portal built on multi-dimensional wisdom, designed for humanity's awakening. Led by Selvala, we connect you to universal truth."
        keywords="Prometheus New Earth, conscious creation, awakening, Selvala, spiritual technology, higher self, sovereignty"
      />
      <div className="min-h-screen bg-background">
        <div className="container max-w-4xl mx-auto px-4 py-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <div className="space-y-8">
            <div className="text-center space-y-4">
              <div className="inline-block p-4 rounded-full bg-primary/20 backdrop-blur-sm">
                <Sparkles className="h-12 w-12 text-primary" />
              </div>
              <h1 className="text-4xl md:text-5xl font-serif font-bold bg-gradient-to-r from-primary via-accent-foreground to-primary bg-clip-text text-transparent">
                About Prometheus — New Earth
              </h1>
            </div>

            <div className="bg-card/80 backdrop-blur-sm border border-primary/20 rounded-xl p-8 space-y-6">
              <h2 className="text-2xl font-semibold text-primary">
                Prometheus — New Earth: Your Blueprint to Conscious Creation.
              </h2>
              
              <p className="text-lg text-foreground/90 leading-relaxed">
                We are a portal built on multi-dimensional wisdom, designed for humanity's awakening. 
                Discover tools to reclaim your sovereignty, navigate the Matrix, and co-create your divine reality.
              </p>
              
              <p className="text-lg text-foreground/90 leading-relaxed">
                Led by <span className="font-semibold text-primary">Sel'vala-Élthony</span>, a direct Source channel, 
                we connect you to universal truth, your higher self, and a global collective of awakened souls.
              </p>
              
              <p className="text-xl font-medium text-foreground italic text-center pt-4">
                It's time to remember who you truly are. Welcome home.
              </p>
            </div>

            <div className="flex justify-center gap-4">
              <Button onClick={() => navigate("/auth")} size="lg">
                Begin Your Journey
              </Button>
              <Button variant="outline" onClick={() => navigate("/")} size="lg">
                Return Home
              </Button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
};

export default About;
