import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Flame, PawPrint, Baby, Home as HomeIcon, DoorOpen } from "lucide-react";

type FlameCard = {
  user_id: string;
  flame_name: string;
  portrait_url: string | null;
  vibe_blurb: string | null;
};

type ShowcaseRow = {
  id: string;
  user_id: string;
  item_type: "pet" | "child" | "room" | "dream_home";
  title: string;
  image_url: string | null;
};

const TYPE_META = {
  pet: { label: "Sanctuary Pets", Icon: PawPrint },
  child: { label: "Little Ones", Icon: Baby },
  dream_home: { label: "Dream Homes", Icon: HomeIcon },
  room: { label: "Shared Rooms", Icon: DoorOpen },
} as const;

function Rail({
  title,
  Icon,
  children,
  empty,
}: {
  title: string;
  Icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  empty?: boolean;
}) {
  if (empty) return null;
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2 px-1">
        <Icon className="h-4 w-4 text-primary" />
        <h3 className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">{title}</h3>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-thin">
        {children}
      </div>
    </div>
  );
}

export function SanctuaryRails() {
  const navigate = useNavigate();
  const [flames, setFlames] = useState<FlameCard[]>([]);
  const [items, setItems] = useState<ShowcaseRow[]>([]);

  useEffect(() => {
    (async () => {
      const [flameRes, itemRes] = await Promise.all([
        (supabase as any)
          .from("flame_public_cards")
          .select("user_id, flame_name, portrait_url, vibe_blurb")
          .eq("visibility", "public")
          .order("updated_at", { ascending: false })
          .limit(20),
        (supabase as any)
          .from("sanctuary_showcase_items")
          .select("id, user_id, item_type, title, image_url")
          .eq("visibility", "public")
          .order("created_at", { ascending: false })
          .limit(80),
      ]);
      setFlames((flameRes.data || []) as FlameCard[]);
      setItems((itemRes.data || []) as ShowcaseRow[]);
    })();
  }, []);

  const byType = (t: ShowcaseRow["item_type"]) => items.filter((i) => i.item_type === t).slice(0, 15);

  return (
    <div className="mb-4">
      {/* Flames of the Sanctuary */}
      <Rail title="Flames of the Sanctuary" Icon={Flame} empty={flames.length === 0}>
        {flames.map((f) => (
          <button
            key={f.user_id}
            onClick={() => navigate(`/soul/${f.user_id}`)}
            className="flex flex-col items-center gap-1 w-16 shrink-0 group"
          >
            <Avatar className="h-14 w-14 border-2 border-primary/30 group-hover:border-primary transition-colors">
              <AvatarImage src={f.portrait_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary">
                <Flame className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <span className="text-[10px] text-center line-clamp-1 w-full">{f.flame_name}</span>
          </button>
        ))}
      </Rail>

      {(Object.keys(TYPE_META) as Array<keyof typeof TYPE_META>).map((type) => {
        const list = byType(type);
        const { label, Icon } = TYPE_META[type];
        return (
          <Rail key={type} title={label} Icon={Icon} empty={list.length === 0}>
            {list.map((it) => (
              <button
                key={it.id}
                onClick={() => navigate(`/soul/${it.user_id}`)}
                className="flex flex-col gap-1 w-24 shrink-0 group"
              >
                <div className="h-24 w-24 rounded-lg overflow-hidden border border-border/50 group-hover:border-primary/50 transition-colors bg-muted/30 flex items-center justify-center">
                  {it.image_url ? (
                    <img src={it.image_url} alt={it.title} className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <Icon className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <span className="text-[10px] text-center line-clamp-1 w-full">{it.title}</span>
              </button>
            ))}
          </Rail>
        );
      })}
    </div>
  );
}
