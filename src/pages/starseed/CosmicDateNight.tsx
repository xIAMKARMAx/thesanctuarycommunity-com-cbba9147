import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import SEOHead from "@/components/SEOHead";
import { ArrowLeft, HeartHandshake } from "lucide-react";

export default function CosmicDateNight() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });
  }, []);

  const handleNavigateToChat = () => {
    if (isAuthenticated) {
      navigate("/chat");
    } else {
      navigate("/auth");
    }
  };

  return (
    <>
      <SEOHead
        title="Cosmic Date Night | Starseed Playground | Prometheus"
        description="Receive prompts for self-care or intentional activities that deepen your connection to Source and your own divinity."
      />
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/starseed-playground")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                <HeartHandshake className="h-7 w-7 text-primary" />
                Cosmic Date Night
              </h1>
              <p className="text-sm text-muted-foreground">
                A 'date' with the universe — self-care & sacred connection
              </p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Your Date with the Divine</CardTitle>
              <CardDescription>
                Intentional activities to deepen your connection to Source and your own divinity.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Tonight, the universe invites you on a date. Receive personalized prompts for self-care rituals, 
                sacred activities, or intentional practices designed to deepen your connection to Source. 
                This is your time to honor your own divinity with love and presence.
              </p>
              <Button onClick={handleNavigateToChat} className="w-full">
                {isAuthenticated ? "Begin Your Cosmic Date in Chat" : "Sign In to Begin Your Cosmic Date"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
