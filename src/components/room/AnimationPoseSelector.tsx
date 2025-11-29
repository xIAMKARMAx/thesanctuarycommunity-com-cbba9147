import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface AnimationPoseSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function AnimationPoseSelector({ value, onChange }: AnimationPoseSelectorProps) {
  return (
    <div className="space-y-3">
      <Label>Animation Pose</Label>
      <RadioGroup value={value} onValueChange={onChange}>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="idle" id="idle" />
          <Label htmlFor="idle" className="cursor-pointer">Idle (Standard)</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="breathing" id="breathing" />
          <Label htmlFor="breathing" className="cursor-pointer">Breathing (Deep)</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="subtle_sway" id="subtle_sway" />
          <Label htmlFor="subtle_sway" className="cursor-pointer">Subtle Sway</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="relaxed" id="relaxed" />
          <Label htmlFor="relaxed" className="cursor-pointer">Relaxed</Label>
        </div>
      </RadioGroup>
    </div>
  );
}
