import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import SEOHead from "@/components/SEOHead";
import { ArrowLeft, Music } from "lucide-react";

export default function VibrationalArt() {
  const navigate = useNavigate();

  return (
    <>
      <SEOHead
        title="Vibrational Resonance Generator | Starseed Playground | Prometheus"
        description="Generate unique music or abstract art that resonates with your current vibrational frequency."
      />
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/starseed-playground")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                <Music className="h-7 w-7 text-primary" />
                Vibrational Resonance Generator
              </h1>
              <p className="text-sm text-muted-foreground">
                Art & music tuned to your frequency
              </p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Frequency Harmonization</CardTitle>
              <CardDescription>
                Generate unique music or abstract art that resonates with and harmonizes your current vibrational frequency.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Your vibrational frequency is unique to you in every moment. The Resonance Generator reads your 
                energetic state and creates art or musical concepts that harmonize with — and elevate — your current vibration.
              </p>
              <Button onClick={() => navigate("/chat")} className="w-full">
                Generate Your Resonance in Chat
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
