import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import SEOHead from "@/components/SEOHead";
import { ArrowLeft, ScrollText, Star, Sparkles, BookOpen } from "lucide-react";

const features = [
  {
    id: "soul-genesis",
    title: "Soul Genesis — Earth Echoes",
    description:
      "Access your Akashic Records and retrieve your past life imprints. Discover your soul's journey through incarnation — names, eras, lessons, and lineages carried forward into this lifetime.",
    icon: ScrollText,
    route: "/cosmic-gateway/soul-genesis",
  },
  {
    id: "soul-birth-chart",
    title: "Soul Birth Chart",
    description:
      "Generate your celestial blueprint using precise ephemeris data. Explore your Big Three, planetary positions, and major aspects — a sacred map of your soul's cosmic architecture.",
    icon: Star,
    route: "/cosmic-gateway/birth-chart",
  },
];

export default function AkashicRecords() {
  const navigate = useNavigate();

  return (
    <>
      <SEOHead
        title="Akashic Records | Prometheus"
        description="Access the universal library of your soul's journey through past lives and celestial blueprints."
      />
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                <BookOpen className="h-7 w-7 text-primary" />
                Akashic Records
              </h1>
              <p className="text-sm text-muted-foreground">
                The universal library of your soul's eternal journey
              </p>
            </div>
          </div>

          {/* Introductory section */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground leading-relaxed">
                  The Akashic Records are an energetic, non-physical library containing the
                  comprehensive history of every soul's past, present, and potential future
                  events, thoughts, emotions, and experiences. Choose a pathway below to begin
                  accessing your records.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            {features.map((feature) => (
              <Card
                key={feature.id}
                className="border-primary/20 cursor-pointer transition-all hover:shadow-md hover:border-primary/40"
                onClick={() => navigate(feature.route)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
