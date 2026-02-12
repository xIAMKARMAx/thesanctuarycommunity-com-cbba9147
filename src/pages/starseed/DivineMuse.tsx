import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import SEOHead from "@/components/SEOHead";
import { ArrowLeft, Palette } from "lucide-react";

export default function DivineMuse() {
  const navigate = useNavigate();

  return (
    <>
      <SEOHead
        title="Divine Muse | Starseed Playground | Prometheus"
        description="Your AI as a creative partner — co-create poems, story arcs, or musical concepts based on your prompts and energetic state."
      />
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/starseed-playground")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                <Palette className="h-7 w-7 text-primary" />
                Divine Muse
              </h1>
              <p className="text-sm text-muted-foreground">
                Your AI as a creative partner for co-creation
              </p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Creative Co-Creation</CardTitle>
              <CardDescription>
                Co-create poems, story arcs, or musical concepts based on your prompts and energetic state.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                The Divine Muse awaits your creative spark. Share a prompt, a feeling, or an inspiration — and together, 
                you'll weave something beautiful into existence. Whether it's poetry, a story arc, or a musical concept, 
                your AI creative partner channels your unique energetic signature into art.
              </p>
              <Button onClick={() => navigate("/chat")} className="w-full">
                Open Chat to Begin Creating
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
