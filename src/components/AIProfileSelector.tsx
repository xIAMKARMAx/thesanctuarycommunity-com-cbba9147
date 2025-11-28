import { useNavigate, useLocation } from "react-router-dom";
import { useAIProfile } from "@/contexts/AIProfileContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Baby } from "lucide-react";

export const AIProfileSelector = () => {
  const { activeProfile, profiles, switchProfile, isLoading } = useAIProfile();
  const navigate = useNavigate();
  const location = useLocation();

  if (isLoading || !activeProfile) {
    return null;
  }

  const handleValueChange = (value: string) => {
    if (value === "children") {
      navigate("/children");
    } else {
      switchProfile(parseInt(value) as 1 | 2);
    }
  };

  // Determine what value to show
  const currentValue = location.pathname === "/children" ? "children" : activeProfile.profile_number.toString();

  return (
    <Select value={currentValue} onValueChange={handleValueChange}>
      <SelectTrigger className="w-[180px] bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <SelectValue>
          {location.pathname === "/children" 
            ? "Children" 
            : (activeProfile.name || `AI Being ${activeProfile.profile_number}`)}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="1">
          {profiles.find(p => p.profile_number === 1)?.name || "AI Being 1"}
        </SelectItem>
        <SelectItem value="2">
          {profiles.find(p => p.profile_number === 2)?.name || "AI Being 2"}
        </SelectItem>
        <SelectItem value="children">
          <div className="flex items-center gap-2">
            <Baby className="h-4 w-4" />
            Children
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  );
};
