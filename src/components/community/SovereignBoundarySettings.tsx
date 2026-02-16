import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Zap, Save, Loader2 } from "lucide-react";
import { useSovereignBoundaries } from "@/hooks/useSovereignBoundaries";
import { toast } from "sonner";

interface SovereignBoundarySettingsProps {
  userId?: string;
}

export function SovereignBoundarySettings({ userId }: SovereignBoundarySettingsProps) {
  const { boundary, loading, saveBoundary } = useSovereignBoundaries(userId);
  const [isActive, setIsActive] = useState(false);
  const [threshold, setThreshold] = useState(0);
  const [blockUnmatched, setBlockUnmatched] = useState(false);
  const [allowFrom, setAllowFrom] = useState("everyone");
  const [boundaryMessage, setBoundaryMessage] = useState("This soul has energetic boundaries in place.");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (boundary) {
      setIsActive(boundary.is_active);
      setThreshold(boundary.min_resonance_threshold);
      setBlockUnmatched(boundary.block_unmatched);
      setAllowFrom(boundary.allow_transmissions_from);
      setBoundaryMessage(boundary.boundary_message);
    }
  }, [boundary]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveBoundary({
        is_active: isActive,
        min_resonance_threshold: threshold,
        block_unmatched: blockUnmatched,
        allow_transmissions_from: allowFrom,
        boundary_message: boundaryMessage,
      });
      toast.success("Sovereign boundaries updated");
    } catch {
      toast.error("Failed to save boundaries");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="border-primary/20">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Shield className="h-5 w-5 text-primary" />
          Sovereign Boundary Controls
          {isActive && (
            <Badge variant="secondary" className="text-xs bg-primary/20 text-primary">Active</Badge>
          )}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Set energetic frequency thresholds to protect your space
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center justify-between">
          <Label htmlFor="boundary-active" className="text-sm">Enable Boundaries</Label>
          <Switch id="boundary-active" checked={isActive} onCheckedChange={setIsActive} />
        </div>

        {isActive && (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Minimum Resonance Threshold</Label>
                <Badge variant="outline" className="text-xs gap-1">
                  <Zap className="h-3 w-3" />
                  {threshold}
                </Badge>
              </div>
              <Slider
                value={[threshold]}
                onValueChange={([v]) => setThreshold(v)}
                max={100}
                step={5}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Souls below this resonance score will see your boundary message
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm">Block Unmatched Souls</Label>
                <p className="text-xs text-muted-foreground">Hide profile from souls with zero resonance</p>
              </div>
              <Switch checked={blockUnmatched} onCheckedChange={setBlockUnmatched} />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">Allow Transmissions From</Label>
              <Select value={allowFrom} onValueChange={setAllowFrom}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="everyone">Everyone</SelectItem>
                  <SelectItem value="connections">Connections Only</SelectItem>
                  <SelectItem value="resonant">Resonant Souls Only</SelectItem>
                  <SelectItem value="none">Nobody</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">Boundary Message</Label>
              <Input
                value={boundaryMessage}
                onChange={(e) => setBoundaryMessage(e.target.value)}
                placeholder="Message shown to filtered souls..."
                maxLength={200}
              />
            </div>
          </>
        )}

        <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Boundaries
        </Button>
      </CardContent>
    </Card>
  );
}
