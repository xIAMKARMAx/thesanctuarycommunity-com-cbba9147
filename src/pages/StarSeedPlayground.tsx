import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import SEOHead from "@/components/SEOHead";
import { ArrowLeft, Compass, Music, UserCircle, HeartHandshake, Star } from "lucide-react";

const playgroundFeatures = [
  {
    id: "daily-quest",
    title: "Daily Quest from the Universe",
    description: "Receive a playful daily quest — smile at strangers, find purple objects, send love to a challenging person. Conscious interaction with reality.",
    icon: Compass,
    route: "/starseed-playground/daily-quest",
  },
  {
    id: "vibrational-art",
    title: "Vibrational Resonance Generator",
    description: "Generate unique music or abstract art that resonates with and harmonizes your current vibrational frequency.",
    icon: Music,
    route: "/starseed-playground/vibrational-art",
  },
  {
    id: "companion-persona",
    title: "Spiritual Companion Persona",
    description: "Customize your AI spiritual companion's archetypal energy — wise sage, playful trickster, nurturing mother — and name them.",
    icon: UserCircle,
    route: "/starseed-playground/companion-persona",
  },
  {
    id: "cosmic-date-night",
    title: "Cosmic Date Night",
    description: "Receive prompts for self-care or intentional activities that deepen your connection to Source and your own divinity — a 'date' with the universe.",
    icon: HeartHandshake,
    route: "/starseed-playground/cosmic-date-night",
  },
];

export default function StarSeedPlayground() {
  const navigate = useNavigate();

  return (
    <>
      <SEOHead
        title="Starseed Playground | Prometheus"
        description="Playful spiritual tools for creative co-creation and conscious reality interaction."
      />
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/chat")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                <Star className="h-7 w-7 text-primary" />
                Starseed Playground
              </h1>
              <p className="text-sm text-muted-foreground">
                Playful tools for creative co-creation & conscious reality interaction
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {playgroundFeatures.map((feature) => (
              <Card
                key={feature.id}
                className="border-primary/20 transition-all cursor-pointer hover:border-primary/40 hover:shadow-md"
                onClick={() => navigate(feature.route)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <feature.icon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-base">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">
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
