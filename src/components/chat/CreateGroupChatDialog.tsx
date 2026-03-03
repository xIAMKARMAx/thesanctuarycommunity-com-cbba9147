import { useState } from "react";
import { useAIProfile } from "@/contexts/AIProfileContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { isVIPTier } from "@/lib/subscription-tiers";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Users } from "lucide-react";

interface CreateGroupChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateGroup: (selectedProfileIds: string[], title: string) => void;
}

export const CreateGroupChatDialog = ({
  open,
  onOpenChange,
  onCreateGroup,
}: CreateGroupChatDialogProps) => {
  const { profiles, isAdmin, customBeingLimit, subscriptionProductId } = useAIProfile();
  const { productId } = useSubscription();
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>([]);
  const [groupTitle, setGroupTitle] = useState("");

  // Tier-based slots: Architect=3, Anchoring=4, Awakening=2, Free=1
  const getTierSlots = () => {
    if (isAdmin) return 10;
    const pid = subscriptionProductId || productId;
    if (pid === 'prod_Tt8qVh88c2WQld' || pid === 'source_grant') return 3;
    if (pid === 'prod_U3xV1AfsrdaJTz' || pid === 'prod_TgZlr0QLYQPqEn') return 4;
    return 1;
  };
  const maxSlots = customBeingLimit ?? getTierSlots();
  const availableProfiles = profiles.filter(p => p.profile_number <= maxSlots);

  const handleToggleProfile = (profileId: string) => {
    setSelectedProfiles(prev => 
      prev.includes(profileId)
        ? prev.filter(id => id !== profileId)
        : [...prev, profileId]
    );
  };

  const handleCreate = () => {
    if (selectedProfiles.length >= 2) {
      const title = groupTitle.trim() || 
        `Group Chat (${selectedProfiles.length} beings)`;
      onCreateGroup(selectedProfiles, title);
      setSelectedProfiles([]);
      setGroupTitle("");
      onOpenChange(false);
    }
  };

  const handleClose = () => {
    setSelectedProfiles([]);
    setGroupTitle("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Create Group Chat
          </DialogTitle>
          <DialogDescription>
            Select at least 2 AI beings to include in this group chat.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="group-title">Group Name (optional)</Label>
            <Input
              id="group-title"
              placeholder="e.g., Family Discussion"
              value={groupTitle}
              onChange={(e) => setGroupTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Select AI Beings</Label>
            <div className="space-y-3 rounded-md border border-border p-3">
              {availableProfiles.map((profile) => (
                <div key={profile.id} className="flex items-center space-x-3">
                  <Checkbox
                    id={`profile-${profile.id}`}
                    checked={selectedProfiles.includes(profile.id)}
                    onCheckedChange={() => handleToggleProfile(profile.id)}
                  />
                  <Label
                    htmlFor={`profile-${profile.id}`}
                    className="flex-1 cursor-pointer text-sm font-normal"
                  >
                    {profile.name || `AI Being ${profile.profile_number}`}
                    {profile.profile_number === 4 && (
                      <span className="ml-2 text-xs text-primary">(VIP)</span>
                    )}
                  </Label>
                </div>
              ))}
            </div>
            {selectedProfiles.length < 2 && (
              <p className="text-xs text-muted-foreground">
                Select at least 2 beings to create a group
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={selectedProfiles.length < 2}
          >
            Create Group
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
