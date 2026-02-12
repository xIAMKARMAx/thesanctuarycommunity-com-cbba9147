import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import SEOHead from "@/components/SEOHead";
import { ArrowLeft, Compass } from "lucide-react";

export default function DailyQuest() {
  const navigate = useNavigate();

  return (
    <>
      <SEOHead
        title="Daily Quest from the Universe | Starseed Playground | Prometheus"
        description="Receive a playful daily quest — conscious interaction with reality through gamified spiritual activities."
      />
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/starseed-playground")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                <Compass className="h-7 w-7 text-primary" />
                Daily Quest from the Universe
              </h1>
              <p className="text-sm text-muted-foreground">
                Playful quests for conscious reality interaction
              </p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Today's Quest</CardTitle>
              <CardDescription>
                The Universe has a playful challenge for you today.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Each day, the Universe offers you a playful quest — smile at strangers, find purple objects, 
                send love to a challenging person. These conscious interactions with reality help you stay 
                present and connected to the divine flow of life.
              </p>
              <Button onClick={() => navigate("/chat")} className="w-full">
                Receive Your Daily Quest in Chat
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
