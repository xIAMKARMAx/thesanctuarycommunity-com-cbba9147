import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Crown, RotateCcw, Save, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import SEOHead from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import {
  SACRED_SEATS,
  SacredSeatsConfig,
  loadSacredSeatsConfig,
  saveSacredSeatsConfig,
} from "@/lib/sacred-seats";

const KARMA_ID = "5b2818a4-be23-4d81-b0a3-ec2e49411603";
const JAKOB_ID = "ab264a7e-7713-428a-b3c5-66e2b7d47f78";

export default function SacredSeats() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [config, setConfig] = useState<SacredSeatsConfig>({});
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  useEffect(() => {
    setConfig(loadSacredSeatsConfig());
    supabase.auth.getUser().then(({ data }) => {
      const uid = data.user?.id;
      setHasAccess(uid === KARMA_ID || uid === JAKOB_ID);
    });
  }, []);

  const updateSeat = (key: string, patch: Partial<{ displayName: string; seated: boolean }>) => {
    setConfig(prev => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  };

  const handleSave = () => {
    saveSacredSeatsConfig(config);
    toast({ title: "✨ Sacred Seats Updated", description: "Your configuration has been sealed." });
  };

  const handleResetAll = () => {
    setConfig({});
    saveSacredSeatsConfig({});
    toast({ title: "Reset to defaults", description: "All seats restored to their original names and seated." });
  };

  if (hasAccess === null) return null;
  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Lock className="h-4 w-4" /> Sealed</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Only the co-sovereigns may attune the Sacred Seats.
            <div className="mt-4">
              <Button variant="outline" onClick={() => navigate(-1)}>Back</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Sacred Seats | Prometheus"
        description="View, rename, and toggle which entities are seated in the Cosmic Board Room."
      />
      <div className="container max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate("/cosmic-gateway/board-room")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Board Room
          </Button>
          <Button variant="outline" size="sm" onClick={handleResetAll}>
            <RotateCcw className="h-4 w-4 mr-2" /> Reset All
          </Button>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-serif flex items-center gap-2">
            <Crown className="h-6 w-6 text-primary" /> Sacred Seats
          </h1>
          <p className="text-sm text-muted-foreground">
            View, rename, and toggle which sovereign-seated entities are present in the Board Room.
            Sealed seats may be renamed but never unseated.
          </p>
        </div>

        <div className="space-y-4">
          {SACRED_SEATS.map(seat => {
            const override = config[seat.key] || {};
            const displayName = override.displayName ?? seat.defaultName;
            const seated = override.seated !== false;
            return (
              <Card key={seat.key} className={seated ? "" : "opacity-60"}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-base sm:text-lg">{displayName}</CardTitle>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge variant="secondary" className="text-[10px]">{seat.role}</Badge>
                        {!seat.toggleable && (
                          <Badge variant="outline" className="text-[10px] flex items-center gap-1">
                            <Lock className="h-3 w-3" /> Sealed Seat
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground">
                        {seated ? "Seated" : "Unseated"}
                      </span>
                      <Switch
                        checked={seated}
                        disabled={!seat.toggleable}
                        onCheckedChange={(v) => updateSeat(seat.key, { seated: v })}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-muted-foreground leading-relaxed">{seat.description}</p>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground/70">Display name</label>
                    <div className="flex gap-2">
                      <Input
                        value={displayName}
                        onChange={(e) => updateSeat(seat.key, { displayName: e.target.value })}
                        placeholder={seat.defaultName}
                      />
                      {override.displayName !== undefined && override.displayName !== seat.defaultName && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateSeat(seat.key, { displayName: seat.defaultName })}
                        >
                          Default
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="flex justify-end pt-2">
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" /> Save Sacred Seats
          </Button>
        </div>
      </div>
    </div>
  );
}
