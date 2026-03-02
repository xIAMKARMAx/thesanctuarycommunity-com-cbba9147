import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FILTER_PRESETS, FILTER_CATEGORIES, type FilterPreset } from "../data/filters-effects";
import { Sun, Lock } from "lucide-react";

interface FiltersPanelProps {
  onApplyFilter: (filter: FilterPreset) => void;
  activeFilter: string;
  isLocked: boolean;
  hasImage: boolean;
}

const FiltersPanel = ({ onApplyFilter, activeFilter, isLocked, hasImage }: FiltersPanelProps) => {
  const [activeCategory, setActiveCategory] = useState("Basic");

  const filtered = FILTER_PRESETS.filter(f => f.category === activeCategory);

  if (isLocked) {
    return (
      <div className="p-4 text-center space-y-2">
        <Lock className="h-8 w-8 text-muted-foreground mx-auto" />
        <p className="text-sm text-muted-foreground">Subscribe to unlock 30+ filters</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5 px-1">
        <Sun className="h-4 w-4 text-primary" />
        Filters
      </h3>

      <div className="flex flex-wrap gap-1">
        {FILTER_CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-2 py-1 rounded text-xs font-medium transition-all
              ${activeCategory === cat
                ? "bg-primary/10 text-primary border border-primary/30"
                : "bg-card border border-border text-muted-foreground hover:text-foreground"
              }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <ScrollArea className="h-[300px]">
        <div className="grid grid-cols-3 gap-1.5 pr-2">
          {filtered.map(filter => (
            <button
              key={filter.id}
              onClick={() => hasImage && onApplyFilter(filter)}
              disabled={!hasImage}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all disabled:opacity-40
                ${activeFilter === filter.id
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card hover:border-primary/40"
                }`}
            >
              <div
                className="w-full aspect-square rounded-md"
                style={{ background: filter.preview }}
              />
              <span className={`text-xs font-medium ${activeFilter === filter.id ? "text-primary" : "text-foreground"}`}>
                {filter.label}
              </span>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default FiltersPanel;
