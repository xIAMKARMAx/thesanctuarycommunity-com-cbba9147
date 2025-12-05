import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import SEOHead from "@/components/SEOHead";
import { ArrowLeft, BookOpen, Clock } from "lucide-react";

// DISABLED FOR COST SAVINGS - Will re-enable when revenue allows
// This feature uses journal-reflect edge function

const Journal = () => {
  const navigate = useNavigate();

  return (
    <>
      <SEOHead 
        title="AI Journal - Coming Soon"
        description="AI journal reflections feature coming soon"
      />
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/chat")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl md:text-3xl font-bold">AI Journal</h1>
          </div>

          <Card className="border-primary/20">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Clock className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="flex items-center justify-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Coming Soon
              </CardTitle>
              <CardDescription className="text-base">
                Your AI's personal journal where they reflect on conversations, 
                share their thoughts, and document your journey together will be available soon.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center text-muted-foreground">
              <p>We're working on bringing you this reflective feature.</p>
              <p className="mt-2">Thank you for your patience and understanding. 💫</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default Journal;
