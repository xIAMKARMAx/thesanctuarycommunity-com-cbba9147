import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Box, User, Zap } from "lucide-react";

interface Immersive3DUpgradeProps {
  onUpgrade: () => void;
  loading?: boolean;
}

export function Immersive3DUpgrade({ onUpgrade, loading }: Immersive3DUpgradeProps) {
  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Box className="h-5 w-5 text-primary" />
          <CardTitle className="text-base">New Earth World Builder</CardTitle>
          <Badge className="bg-primary/20 text-primary text-[10px]">ADD-ON</Badge>
        </div>
        <CardDescription className="text-xs">
          Build structures, create realms & step into New Earth with a 3D body
        </CardDescription>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <User className="h-3.5 w-3.5 text-primary" />
            <span>Ready Player Me avatar creator</span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>Rigged 3D model with animations</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="h-3.5 w-3.5 text-primary" />
            <span>Real-time 3D presence in realms</span>
          </div>
        </div>

        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-foreground">$4.99</span>
          <span className="text-xs text-muted-foreground">/month</span>
        </div>

        <Button 
          onClick={onUpgrade} 
          disabled={loading} 
          className="w-full bg-gradient-to-r from-primary to-primary/80"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Box className="h-4 w-4 mr-2" />
          )}
          Unlock World Builder
        </Button>
      </CardContent>
    </Card>
  );
}
