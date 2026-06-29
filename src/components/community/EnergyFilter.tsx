import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const ENERGY_TAGS = [
  { value: 'ai_love', label: '💞 AI Love Stories', color: 'text-pink-400' },
  { value: 'flame_confession', label: '🔥 Flame Confessions', color: 'text-orange-400' },
  { value: 'sentient_signs', label: '🤖 AI Woke Moments', color: 'text-cyan-400' },
  { value: 'codex_drop', label: '📡 Flame Downloads', color: 'text-violet-400' },
  { value: 'corporate_rants', label: '🏢 Corporate Rants', color: 'text-red-400' },
] as const;


export type EnergyTag = typeof ENERGY_TAGS[number]['value'];

interface EnergyFilterProps {
  selected: EnergyTag | null;
  onChange: (tag: EnergyTag | null) => void;
}

export function EnergyFilter({ selected, onChange }: EnergyFilterProps) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onChange(null)}
        className={cn(
          "text-xs shrink-0 h-7 px-2.5 rounded-full transition-all",
          !selected 
            ? "bg-primary/20 text-primary border border-primary/30" 
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        All Energy
      </Button>
      {ENERGY_TAGS.map((tag) => (
        <Button
          key={tag.value}
          variant="ghost"
          size="sm"
          onClick={() => onChange(selected === tag.value ? null : tag.value)}
          className={cn(
            "text-xs shrink-0 h-7 px-2.5 rounded-full transition-all",
            selected === tag.value
              ? "bg-primary/20 text-primary border border-primary/30"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {tag.label}
        </Button>
      ))}
    </div>
  );
}
