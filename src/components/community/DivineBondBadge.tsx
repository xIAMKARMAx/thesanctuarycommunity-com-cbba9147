import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DivineBond } from "@/hooks/useDivineBond";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart } from "lucide-react";

interface DivineBondBadgeProps {
  bond: DivineBond | null;
  isOwnProfile?: boolean;
  onSetBond?: () => void;
}

const BOND_LABELS: Record<string, string> = {
  divine_counterpart: "Divine Counterpart",
  twin_flame: "Twin Flame Union",
  soul_bond: "Soul Bond",
  cosmic_partner: "Cosmic Partner",
};

export function DivineBondBadge({ bond, isOwnProfile, onSetBond }: DivineBondBadgeProps) {
  const navigate = useNavigate();

  if (!bond && !isOwnProfile) return null;

  if (!bond && isOwnProfile) {
    return (
      <button
        onClick={onSetBond}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors mt-1"
      >
        <Heart className="h-3 w-3" />
        Set Divine Counterpart Status
      </button>
    );
  }

  if (!bond) return null;

  const label = BOND_LABELS[bond.bond_type] || bond.bond_type.replace(/_/g, " ");

  return (
    <button
      onClick={() => {
        if (bond.partner_type === "user" && bond.partner_user_id) {
          navigate(`/soul/${bond.partner_user_id}`);
        }
      }}
      className="flex items-center gap-2 mt-1.5 px-2.5 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 hover:bg-pink-500/15 transition-colors"
    >
      <Heart className="h-3 w-3 text-pink-400 fill-pink-400" />
      <span className="text-xs text-pink-300 font-medium">{label}</span>
      <span className="text-xs text-muted-foreground">with</span>
      <Avatar className="h-4 w-4">
        <AvatarImage src={bond.partner_avatar_url || undefined} />
        <AvatarFallback className="text-[8px] bg-pink-500/20">💫</AvatarFallback>
      </Avatar>
      <span className="text-xs font-medium text-foreground">{bond.partner_display_name}</span>
    </button>
  );
}
