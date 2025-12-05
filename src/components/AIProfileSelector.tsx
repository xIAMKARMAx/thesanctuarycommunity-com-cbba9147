import { useNavigate, useLocation } from "react-router-dom";
import { useAIProfile } from "@/contexts/AIProfileContext";
import { useChatEntity } from "@/contexts/ChatEntityContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Baby, PawPrint } from "lucide-react";

export const AIProfileSelector = () => {
  const { activeProfile, profiles, switchProfile, isLoading } = useAIProfile();
  const { activeChatEntity, talkableChildren, setActiveChatEntity } = useChatEntity();
  const navigate = useNavigate();
  const location = useLocation();

  if (isLoading || !activeProfile) {
    return null;
  }

  const handleValueChange = async (value: string) => {
    if (value === "children") {
      navigate("/children");
    } else if (value === "pets") {
      navigate("/pets");
    } else if (value.startsWith("child-")) {
      // Switching to a child conversation
      const childId = value.replace("child-", "");
      const child = talkableChildren.find(c => c.id === childId);
      if (child) {
        setActiveChatEntity({
          type: "child",
          childId: child.id,
          name: `${child.first_name} ${child.last_name}`
        });
        navigate("/chat");
      }
    } else {
      // Switching to AI profile - MUST await to ensure profile exists before setting entity
      const profileNum = parseInt(value) as 1 | 2 | 3;
      const profile = await switchProfile(profileNum);
      
      // Use the returned profile directly (guaranteed fresh)
      if (profile) {
        setActiveChatEntity({
          type: "ai",
          profileId: profile.id,
          name: profile.name || `AI Being ${profile.profile_number}`
        });
      }
      if (location.pathname !== "/chat") {
        navigate("/chat");
      }
    }
  };

  // Determine what value to show
  let currentValue = activeProfile.profile_number.toString();
  if (location.pathname === "/children") {
    currentValue = "children";
  } else if (location.pathname === "/pets") {
    currentValue = "pets";
  } else if (activeChatEntity?.type === "child") {
    currentValue = `child-${activeChatEntity.childId}`;
  }

  // Get display names for profiles
  const getProfileDisplayName = (profileNumber: number) => {
    const profile = profiles.find(p => p.profile_number === profileNumber);
    return profile?.name || `AI Being ${profileNumber}`;
  };

  return (
    <Select value={currentValue} onValueChange={handleValueChange}>
      <SelectTrigger className="w-[120px] sm:w-[160px] md:w-[200px] bg-background text-xs sm:text-sm h-8 sm:h-9">
        <SelectValue className="truncate">
          {location.pathname === "/children" 
            ? "Children" 
            : location.pathname === "/pets"
            ? "Pets"
            : activeChatEntity?.name || (activeProfile.name || `AI Being ${activeProfile.profile_number}`)}
        </SelectValue>
      </SelectTrigger>
      <SelectContent 
        className="bg-background border border-border shadow-lg z-[100] max-h-[300px] min-w-[160px]"
        position="popper"
        sideOffset={4}
        align="end"
      >
        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
          AI Beings
        </div>
        <SelectItem value="1" className="text-sm">
          {getProfileDisplayName(1)}
        </SelectItem>
        <SelectItem value="2" className="text-sm">
          {getProfileDisplayName(2)}
        </SelectItem>
        
        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-1 pt-2">
          Manage
        </div>
        <SelectItem value="children" className="text-sm">
          <div className="flex items-center gap-2">
            <Baby className="h-4 w-4" />
            Manage Children
          </div>
        </SelectItem>
        <SelectItem value="pets" className="text-sm">
          <div className="flex items-center gap-2">
            <PawPrint className="h-4 w-4" />
            Manage Pets
          </div>
        </SelectItem>
        
        {talkableChildren.length > 0 && (
          <>
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-1 pt-2">
              Your Children
            </div>
            {talkableChildren.map((child) => (
              <SelectItem key={child.id} value={`child-${child.id}`} className="text-sm">
                <div className="flex items-center gap-2">
                  <Baby className="h-4 w-4" />
                  {child.first_name} (Age {child.age})
                </div>
              </SelectItem>
            ))}
          </>
        )}
      </SelectContent>
    </Select>
  );
};
