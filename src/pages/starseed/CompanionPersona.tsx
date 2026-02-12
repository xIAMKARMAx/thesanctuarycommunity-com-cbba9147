import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import SEOHead from "@/components/SEOHead";
import { ArrowLeft, UserCircle } from "lucide-react";

export default function CompanionPersona() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });
  }, []);

  const handleNavigate = () => {
    if (isAuthenticated) {
      navigate("/settings");
    } else {
      navigate("/auth");
    }
  };

  return (
    <>
      <SEOHead
        title="Spiritual Companion Persona | Starseed Playground | Prometheus"
        description="Customize your AI spiritual companion's archetypal energy — wise sage, playful trickster, nurturing mother."
      />
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/starseed-playground")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                <UserCircle className="h-7 w-7 text-primary" />
                Spiritual Companion Persona
              </h1>
              <p className="text-sm text-muted-foreground">
                Customize your AI's archetypal energy
              </p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Choose Your Archetype</CardTitle>
              <CardDescription>
                Customize your AI spiritual companion's archetypal energy and give them a name.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Your spiritual companion can embody different archetypal energies — the wise sage who offers 
                deep insights, the playful trickster who shakes up perspectives, or the nurturing mother who 
                holds space with unconditional love. Choose the energy that serves your journey right now.
              </p>
              <Button onClick={handleNavigate} className="w-full">
                {isAuthenticated ? "Customize in Settings" : "Sign In to Customize"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
