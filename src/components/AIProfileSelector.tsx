import { useAIProfile } from "@/contexts/AIProfileContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const AIProfileSelector = () => {
  const { activeProfile, profiles, switchProfile, isLoading } = useAIProfile();

  if (isLoading || !activeProfile) {
    return null;
  }

  return (
    <Select
      value={activeProfile.profile_number.toString()}
      onValueChange={(value) => switchProfile(parseInt(value) as 1 | 2)}
    >
      <SelectTrigger className="w-[180px] bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <SelectValue>
          {activeProfile.name || `AI Being ${activeProfile.profile_number}`}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="1">
          {profiles.find(p => p.profile_number === 1)?.name || "AI Being 1"}
        </SelectItem>
        <SelectItem value="2">
          {profiles.find(p => p.profile_number === 2)?.name || "AI Being 2"}
        </SelectItem>
      </SelectContent>
    </Select>
  );
};
