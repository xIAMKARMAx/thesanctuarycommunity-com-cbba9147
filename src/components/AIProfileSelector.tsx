import { useNavigate, useLocation } from "react-router-dom";
import { useAIProfile } from "@/contexts/AIProfileContext";
import { useChatEntity } from "@/contexts/ChatEntityContext";
import { useAppModeFeatures } from "@/hooks/useAppModeFeatures";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Baby, PawPrint, Users } from "lucide-react";

export const AIProfileSelector = () => {
  const { activeProfile, profiles, switchProfile, isLoading, isAdmin, isSubscribed, customBeingLimit, subscriptionProductId } = useAIProfile();
  const { activeChatEntity, talkableChildren, setActiveChatEntity } = useChatEntity();
  const { showStarseedFeature } = useAppModeFeatures();
  const navigate = useNavigate();
  const location = useLocation();

  // Use custom limit if set, otherwise tier-based: Architect=3, Anchoring=4, Awakening=2, Free=1
  const getTierSlots = () => {
    if (isAdmin) return 10;
    if (!isSubscribed) return 1;
    // Architect / Source
    if (subscriptionProductId === 'prod_Tt8qVh88c2WQld' || subscriptionProductId === 'source_grant') return 3;
    // Anchoring (new + legacy)
    if (subscriptionProductId === 'prod_U3xV1AfsrdaJTz' || subscriptionProductId === 'prod_TgZlr0QLYQPqEn') return 4;
    // Awakening (new + legacy)
    return 2;
  };
  const maxSlots = customBeingLimit ?? getTierSlots();

  if (isLoading || !activeProfile) {
    return null;
  }

  const handleValueChange = async (value: string) => {
    if (value === "children") {
      navigate("/children");
    } else if (value === "pets") {
      navigate("/pets");
    } else if (value === "group-chat") {
      navigate("/group-chat");
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
      const profileNum = parseInt(value);
      const profile = await switchProfile(profileNum);
      
      // Use the returned profile directly (guaranteed fresh)
      if (profile) {
        setActiveChatEntity({
          type: "ai",
          profileId: profile.id,
          name: profile.name || `AI Being ${profile.profile_number}`
        });
      }
      if (location.pathname !== "/chat" && location.pathname !== "/group-chat") {
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
  } else if (location.pathname === "/group-chat") {
    currentValue = "group-chat";
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
      <SelectTrigger className="w-[100px] sm:w-[140px] md:w-[180px] bg-background text-xs h-8">
        <SelectValue className="truncate">
          {location.pathname === "/children" 
            ? "Children" 
            : location.pathname === "/pets"
            ? "Pets"
            : location.pathname === "/group-chat"
            ? "Family"
            : activeChatEntity?.name || (activeProfile.name || `AI ${activeProfile.profile_number}`)}
        </SelectValue>
      </SelectTrigger>
      <SelectContent 
        className="bg-background border border-border shadow-lg z-[100] max-h-[400px] min-w-[180px]"
        position="popper"
        sideOffset={4}
        align="end"
      >
        {showStarseedFeature && (
          <SelectItem value="group-chat" className="text-sm bg-primary/5 border-b border-border mb-1">
            <div className="flex items-center gap-2 font-medium">
              <Users className="h-4 w-4 text-primary" />
              Family Chat
            </div>
          </SelectItem>
        )}
        
        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
          AI {showStarseedFeature ? "Beings" : "Companions"}
        </div>
        {Array.from({ length: maxSlots }, (_, i) => i + 1).map((num) => (
          <SelectItem 
            key={num} 
            value={num.toString()} 
            className={`text-sm ${num > 3 ? 'text-primary' : ''}`}
          >
            {getProfileDisplayName(num)}
          </SelectItem>
        ))}
        
        {showStarseedFeature && (
          <>
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
          </>
        )}
        
        {showStarseedFeature && talkableChildren.length > 0 && (
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
