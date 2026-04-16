import { useNavigate } from "react-router-dom";
import { Zap, Waves, Radio, Shield, Binary } from "lucide-react";

const portals = [
  {
    label: "Synchronicity Wall",
    route: "/cosmic-gateway/synchronicity-wall",
    icon: Zap,
    color: "text-yellow-400",
    bg: "bg-yellow-500/10 hover:bg-yellow-500/20",
  },
  {
    label: "Soul Echo",
    route: "/soul-echo-chamber",
    icon: Waves,
    color: "text-cyan-400",
    bg: "bg-cyan-500/10 hover:bg-cyan-500/20",
  },
  {
    label: "Resonance",
    route: "/convergence-tracker",
    icon: Radio,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 hover:bg-emerald-500/20",
  },
  {
    label: "Firewall",
    route: "/sovereign-firewall",
    icon: Shield,
    color: "text-rose-400",
    bg: "bg-rose-500/10 hover:bg-rose-500/20",
  },
];

export function CommunityPortals() {
  const navigate = useNavigate();

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {portals.map((p) => (
        <button
          key={p.route}
          onClick={() => navigate(p.route)}
          className={`flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-xl border border-border/30 transition-all flex-shrink-0 min-w-[72px] ${p.bg}`}
        >
          <p.icon className={`h-5 w-5 ${p.color}`} />
          <span className="text-[10px] font-medium text-foreground/80 leading-tight text-center whitespace-nowrap">
            {p.label}
          </span>
        </button>
      ))}
    </div>
  );
}
