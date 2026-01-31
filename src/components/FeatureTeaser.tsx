import { Lock, Crown, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface FeatureTeaserProps {
  title: string;
  description: string;
  requiredTier: "basic" | "pro" | "vip";
  icon?: React.ReactNode;
  preview?: React.ReactNode;
  benefits?: string[];
  className?: string;
  variant?: "card" | "inline" | "overlay";
}

const tierColors = {
  basic: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  pro: "bg-primary/10 text-primary border-primary/20",
  vip: "bg-amber-500/10 text-amber-500 border-amber-500/20",
};

const tierLabels = {
  basic: "Basic",
  pro: "Pro", 
  vip: "VIP",
};

const tierPrices = {
  basic: "$9.99",
  pro: "$14.99",
  vip: "$29.99",
};

export const FeatureTeaser = ({
  title,
  description,
  requiredTier,
  icon,
  preview,
  benefits = [],
  className,
  variant = "card",
}: FeatureTeaserProps) => {
  const navigate = useNavigate();

  if (variant === "inline") {
    return (
      <div className={cn("flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border/50", className)}>
        <div className="p-2 rounded-full bg-primary/10">
          <Lock className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-muted-foreground truncate">{description}</p>
        </div>
        <Badge variant="outline" className={cn("shrink-0", tierColors[requiredTier])}>
          {tierLabels[requiredTier]}+
        </Badge>
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={() => navigate("/pricing")}
          className="shrink-0"
        >
          Upgrade
          <ArrowRight className="ml-1 h-3 w-3" />
        </Button>
      </div>
    );
  }

  if (variant === "overlay") {
    return (
      <div className={cn("relative", className)}>
        {preview && (
          <div className="opacity-30 blur-sm pointer-events-none">
            {preview}
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg">
          <div className="text-center p-6 max-w-sm">
            <div className="inline-flex p-3 rounded-full bg-primary/10 mb-4">
              {requiredTier === "vip" ? (
                <Crown className="h-6 w-6 text-amber-500" />
              ) : (
                <Lock className="h-6 w-6 text-primary" />
              )}
            </div>
            <h3 className="text-lg font-semibold mb-2">{title}</h3>
            <p className="text-sm text-muted-foreground mb-4">{description}</p>
            <Badge className={cn("mb-4", tierColors[requiredTier])}>
              {tierLabels[requiredTier]}+ Feature
            </Badge>
            <Button onClick={() => navigate("/pricing")} className="w-full">
              <Sparkles className="mr-2 h-4 w-4" />
              Upgrade to {tierLabels[requiredTier]} - {tierPrices[requiredTier]}/mo
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Default card variant
  return (
    <Card className={cn("relative overflow-hidden border-dashed", className)}>
      <div className="absolute top-0 right-0 p-2">
        <Badge className={cn(tierColors[requiredTier])}>
          {requiredTier === "vip" && <Crown className="mr-1 h-3 w-3" />}
          {tierLabels[requiredTier]}+
        </Badge>
      </div>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-primary/10">
            {icon || <Lock className="h-5 w-5 text-primary" />}
          </div>
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {benefits.length > 0 && (
          <ul className="space-y-2 mb-4">
            {benefits.map((benefit, index) => (
              <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="h-3 w-3 text-primary shrink-0" />
                {benefit}
              </li>
            ))}
          </ul>
        )}
        <Button onClick={() => navigate("/pricing")} className="w-full" variant="outline">
          <Lock className="mr-2 h-4 w-4" />
          Unlock with {tierLabels[requiredTier]}
        </Button>
      </CardContent>
    </Card>
  );
};

export default FeatureTeaser;
