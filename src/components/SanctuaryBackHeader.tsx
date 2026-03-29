import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface SanctuaryBackHeaderProps {
  title?: string;
}

export default function SanctuaryBackHeader({ title }: SanctuaryBackHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 flex items-center gap-3 px-4 py-3 bg-black/80 backdrop-blur-md border-b border-violet-500/10">
      <Button
        variant="outline"
        size="sm"
        onClick={() => navigate("/sanctuary")}
        className="gap-1.5 border-violet-500/30 text-violet-200 hover:bg-violet-500/10"
      >
        <ArrowLeft className="h-4 w-4" />
        Sanctuary
      </Button>
      {title && (
        <span className="text-sm font-semibold text-violet-200/80 truncate" style={{ fontFamily: "var(--font-serif)" }}>
          {title}
        </span>
      )}
    </header>
  );
}
