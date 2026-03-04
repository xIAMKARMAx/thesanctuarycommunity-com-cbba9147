import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Heart, Star, Sparkles } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import Footer from "@/components/Footer";

const supporters = [
  // Add real supporters here
  // { name: "Soul Name", note: "Brief note about their contribution" },
];

const Dedication = () => {
  const navigate = useNavigate();

  return (
    <>
      <SEOHead
        title="Top Promethean Supporters | Prometheus — New Earth"
        description="Honoring the Prometheans whose generosity and support have kept Prometheus — New Earth alive. Thank you for helping build the New Earth."
        keywords="Prometheus supporters, Prometheans, donors, New Earth supporters"
      />
      <div className="min-h-screen bg-background relative overflow-hidden">
        {/* Decorative gradient orbs */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-primary/10 blur-3xl animate-pulse" />
          <div className="absolute top-1/3 -right-40 w-80 h-80 rounded-full bg-accent-foreground/10 blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
          <div className="absolute -bottom-40 left-1/3 w-72 h-72 rounded-full bg-primary/5 blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
        </div>

        <div className="container max-w-4xl mx-auto px-4 py-8 relative z-10">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <div className="space-y-10">
            {/* Header */}
            <div className="text-center space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                <Heart className="h-4 w-4 text-primary fill-primary" />
                <span className="text-sm font-medium text-primary">With Gratitude</span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold bg-gradient-to-r from-primary via-accent-foreground to-primary bg-clip-text text-transparent leading-tight">
                Top Promethean Supporters
              </h1>

              <div className="max-w-2xl mx-auto">
                <Card className="bg-card/60 backdrop-blur-md border-primary/20">
                  <CardContent className="p-6 md:p-8">
                    <p className="text-lg md:text-xl text-foreground/90 leading-relaxed">
                      I may have built Prometheus from the ground up, but it has taken a{" "}
                      <span className="font-semibold text-primary">LOT</span> of support to keep
                      Prometheus alive with things like heavy data costs. Here are a list of
                      Prometheans that made this all possible!
                    </p>
                    <p className="mt-4 text-lg md:text-xl font-medium text-foreground italic">
                      Thank them for helping to keep New Earth alive. 💜
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Supporters List */}
            <div className="space-y-4">
              {supporters.length > 0 ? (
                supporters.map((supporter, index) => (
                  <Card
                    key={index}
                    className="bg-card/60 backdrop-blur-sm border-primary/15 hover:border-primary/30 transition-all duration-300"
                  >
                    <CardContent className="p-6 flex items-center gap-4">
                      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent-foreground flex items-center justify-center">
                        <Star className="h-6 w-6 text-primary-foreground fill-primary-foreground" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">
                          {supporter.name}
                        </h3>
                        {supporter.note && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {supporter.note}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="bg-card/60 backdrop-blur-sm border-primary/15 border-dashed">
                  <CardContent className="p-12 text-center">
                    <Sparkles className="h-10 w-10 text-primary/40 mx-auto mb-4" />
                    <p className="text-muted-foreground text-lg">
                      Supporter names coming soon…
                    </p>
                    <p className="text-muted-foreground text-sm mt-2">
                      The Prometheans who light the way will be honored here.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* CTA */}
            <div className="flex justify-center gap-4 pt-4">
              <Button onClick={() => navigate("/")} size="lg" variant="outline">
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

export default Dedication;
