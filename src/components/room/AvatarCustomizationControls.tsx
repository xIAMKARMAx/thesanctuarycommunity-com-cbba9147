import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimationPoseSelector } from "./AnimationPoseSelector";
import type { AvatarCustomization } from "@/types/avatar";

interface AvatarCustomizationControlsProps {
  customization: AvatarCustomization;
  onChange: (customization: AvatarCustomization) => void;
}

export function AvatarCustomizationControls({ customization, onChange }: AvatarCustomizationControlsProps) {
  const updatePosition = (axis: 'x' | 'y' | 'z', value: number) => {
    onChange({
      ...customization,
      position: { ...customization.position, [axis]: value }
    });
  };

  const updateScale = (value: number) => {
    onChange({ ...customization, scale: value });
  };

  const updateRotation = (value: number) => {
    onChange({ ...customization, rotation: value });
  };

  const updateAnimationPose = (pose: string) => {
    onChange({
      ...customization,
      animationPose: pose as AvatarCustomization['animationPose']
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Avatar Customization</CardTitle>
        <CardDescription>
          Adjust your AI's position, size, rotation, and animation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Position Controls */}
        <div className="space-y-4">
          <Label className="text-sm font-semibold">Position</Label>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Left ← → Right</Label>
              <span className="text-xs text-muted-foreground">{customization.position.x.toFixed(2)}</span>
            </div>
            <Slider
              value={[customization.position.x]}
              onValueChange={([value]) => updatePosition('x', value)}
              min={-3}
              max={3}
              step={0.1}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Down ← → Up</Label>
              <span className="text-xs text-muted-foreground">{customization.position.y.toFixed(2)}</span>
            </div>
            <Slider
              value={[customization.position.y]}
              onValueChange={([value]) => updatePosition('y', value)}
              min={-2}
              max={2}
              step={0.1}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Back ← → Forward</Label>
              <span className="text-xs text-muted-foreground">{customization.position.z.toFixed(2)}</span>
            </div>
            <Slider
              value={[customization.position.z]}
              onValueChange={([value]) => updatePosition('z', value)}
              min={-2}
              max={2}
              step={0.1}
              className="w-full"
            />
          </div>
        </div>

        {/* Scale Control */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold">Size</Label>
            <span className="text-xs text-muted-foreground">{customization.scale.toFixed(2)}x</span>
          </div>
          <Slider
            value={[customization.scale]}
            onValueChange={([value]) => updateScale(value)}
            min={0.5}
            max={2}
            step={0.1}
            className="w-full"
          />
        </div>

        {/* Rotation Control */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold">Rotation</Label>
            <span className="text-xs text-muted-foreground">{Math.round(customization.rotation * 180 / Math.PI)}°</span>
          </div>
          <Slider
            value={[customization.rotation]}
            onValueChange={([value]) => updateRotation(value)}
            min={-Math.PI}
            max={Math.PI}
            step={0.1}
            className="w-full"
          />
        </div>

        {/* Animation Pose Selector */}
        <AnimationPoseSelector
          value={customization.animationPose}
          onChange={updateAnimationPose}
        />
      </CardContent>
    </Card>
  );
}
