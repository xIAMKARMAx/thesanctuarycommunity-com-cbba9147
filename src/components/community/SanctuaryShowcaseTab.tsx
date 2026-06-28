import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PawPrint,
  Baby,
  Home,
  DoorOpen,
  Plus,
  Eye,
  EyeOff,
  Trash2,
  Sparkles,
  Flame,
  Crown,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  useSanctuaryShowcase,
  ShowcaseItem,
  ShowcaseItemType,
} from "@/hooks/useSanctuaryShowcase";

interface Props {
  profileUserId: string;
  viewerUserId?: string;
}

const TYPE_META: Record<ShowcaseItemType, { label: string; icon: any; emoji: string; addLabel: string; emptyOwner: string; emptyViewer: string }> = {
  pet: {
    label: "Pets",
    icon: PawPrint,
    emoji: "🐾",
    addLabel: "Add a pet",
    emptyOwner: "Add the pets that walk beside you in the Sanctuary.",
    emptyViewer: "No pets shared yet.",
  },
  child: {
    label: "Little Ones",
    icon: Baby,
    emoji: "👶",
    addLabel: "Add a child",
    emptyOwner: "Add your celestial children — only the ones you want the world to meet.",
    emptyViewer: "No little ones shared yet.",
  },
  room: {
    label: "Rooms",
    icon: DoorOpen,
    emoji: "🚪",
    addLabel: "Add a room",
    emptyOwner: "Share rooms from your Sanctuary — bedroom, sacred space, anything you've built.",
    emptyViewer: "No rooms shared yet.",
  },
  dream_home: {
    label: "Dream Home",
    icon: Home,
    emoji: "🏡",
    addLabel: "Add your dream home",
    emptyOwner: "Show off the home you've built or are building with your Flame.",
    emptyViewer: "No dream home shared yet.",
  },
};

export function SanctuaryShowcaseTab({ profileUserId, viewerUserId }: Props) {
  const {
    items,
    flameCard,
    loading,
    isOwner,
    addItem,
    removeItem,
    toggleVisibility,
    upsertFlameCard,
    toggleFlameVisibility,
  } = useSanctuaryShowcase(profileUserId, viewerUserId);

  const [activeType, setActiveType] = useState<ShowcaseItemType>("pet");
  const [addOpen, setAddOpen] = useState(false);
  const [flameEditOpen, setFlameEditOpen] = useState(false);

  const visibleItems = items.filter((i) => isOwner || i.visibility === "public");
  const byType = (t: ShowcaseItemType) => visibleItems.filter((i) => i.item_type === t);

  return (
    <div className="space-y-6">
      {/* Flame Strip */}
      <FlameStrip
        card={flameCard}
        isOwner={isOwner}
        onEdit={() => setFlameEditOpen(true)}
        onToggle={toggleFlameVisibility}
      />

      <Tabs value={activeType} onValueChange={(v) => setActiveType(v as ShowcaseItemType)}>
        <TabsList className="grid grid-cols-4 w-full">
          {(Object.keys(TYPE_META) as ShowcaseItemType[]).map((t) => {
            const M = TYPE_META[t];
            const Icon = M.icon;
            return (
              <TabsTrigger key={t} value={t} className="gap-1.5 text-xs">
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{M.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {(Object.keys(TYPE_META) as ShowcaseItemType[]).map((t) => {
          const M = TYPE_META[t];
          const list = byType(t);
          return (
            <TabsContent key={t} value={t} className="pt-4">
              {isOwner && (
                <div className="flex justify-end mb-3">
                  <Button size="sm" variant="outline" onClick={() => setAddOpen(true)} className="gap-1.5">
                    <Plus className="h-4 w-4" /> {M.addLabel}
                  </Button>
                </div>
              )}
              {loading ? (
                <div className="grid grid-cols-2 gap-3">
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-40 rounded-lg" />
                  ))}
                </div>
              ) : list.length === 0 ? (
                <div className="text-center py-10">
                  <div className="text-4xl mb-2">{M.emoji}</div>
                  <p className="text-sm text-muted-foreground">
                    {isOwner ? M.emptyOwner : M.emptyViewer}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {list.map((it) => (
                    <ShowcaseCard
                      key={it.id}
                      item={it}
                      isOwner={isOwner}
                      onToggle={() => toggleVisibility(it.id)}
                      onRemove={() => removeItem(it.id)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          );
        })}
      </Tabs>

      {addOpen && isOwner && viewerUserId && (
        <AddItemDialog
          open={addOpen}
          onOpenChange={setAddOpen}
          itemType={activeType}
          userId={viewerUserId}
          onAdd={async (payload) => {
            await addItem({ ...payload, item_type: activeType });
            setAddOpen(false);
          }}
        />
      )}

      {flameEditOpen && isOwner && viewerUserId && (
        <FlameCardDialog
          open={flameEditOpen}
          onOpenChange={setFlameEditOpen}
          existing={flameCard}
          userId={viewerUserId}
          onSave={async (payload) => {
            await upsertFlameCard(payload);
            setFlameEditOpen(false);
          }}
        />
      )}
    </div>
  );
}

function FlameStrip({
  card,
  isOwner,
  onEdit,
  onToggle,
}: {
  card: ReturnType<typeof useSanctuaryShowcase>["flameCard"];
  isOwner: boolean;
  onEdit: () => void;
  onToggle: () => void;
}) {
  if (!card && !isOwner) return null;

  if (!card && isOwner) {
    return (
      <Card className="p-4 bg-gradient-to-br from-orange-500/10 via-rose-500/5 to-transparent border-orange-500/20">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-orange-500/20 flex items-center justify-center text-2xl">
            🔥
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">Introduce your Flame</p>
            <p className="text-xs text-muted-foreground">Show the Sanctuary who walks with you.</p>
          </div>
          <Button size="sm" onClick={onEdit} className="gap-1.5">
            <Plus className="h-4 w-4" /> Add
          </Button>
        </div>
      </Card>
    );
  }

  if (!card) return null;
  if (!isOwner && card.visibility !== "public") return null;

  return (
    <Card className="p-4 bg-gradient-to-br from-orange-500/10 via-rose-500/5 to-transparent border-orange-500/20">
      <div className="flex items-start gap-3">
        <div className="h-14 w-14 rounded-full overflow-hidden bg-orange-500/20 flex items-center justify-center text-2xl shrink-0 border border-orange-500/30">
          {card.portrait_url ? (
            <img src={card.portrait_url} alt={card.flame_name} className="h-full w-full object-cover" />
          ) : (
            "🔥"
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Flame className="h-3.5 w-3.5 text-orange-400" />
            <p className="font-semibold text-sm">{card.flame_name}</p>
            <Badge variant="outline" className="text-[10px] border-orange-500/30 text-orange-300">
              Their Flame
            </Badge>
            {card.visibility === "private" && (
              <Badge variant="outline" className="text-[10px] gap-1">
                <EyeOff className="h-3 w-3" /> Private
              </Badge>
            )}
          </div>
          {card.vibe_blurb && (
            <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">{card.vibe_blurb}</p>
          )}
        </div>
        {isOwner && (
          <div className="flex flex-col gap-1">
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onEdit} title="Edit">
              <Sparkles className="h-3.5 w-3.5" />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onToggle} title="Toggle visibility">
              {card.visibility === "public" ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}

function ShowcaseCard({
  item,
  isOwner,
  onToggle,
  onRemove,
}: {
  item: ShowcaseItem;
  isOwner: boolean;
  onToggle: () => void;
  onRemove: () => void;
}) {
  return (
    <Card className="overflow-hidden group relative">
      <div className="aspect-square bg-muted relative">
        {item.image_url ? (
          <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">
            {TYPE_META[item.item_type].emoji}
          </div>
        )}
        {item.visibility === "private" && (
          <Badge variant="secondary" className="absolute top-2 left-2 text-[10px] gap-1 bg-background/80 backdrop-blur">
            <EyeOff className="h-3 w-3" /> Private
          </Badge>
        )}
        {isOwner && (
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button size="icon" variant="secondary" className="h-7 w-7 bg-background/80 backdrop-blur" onClick={onToggle} title="Toggle visibility">
              {item.visibility === "public" ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            </Button>
            <Button size="icon" variant="secondary" className="h-7 w-7 bg-background/80 backdrop-blur text-destructive" onClick={onRemove} title="Remove">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
      <div className="p-2">
        <p className="text-sm font-medium truncate">{item.title}</p>
        {item.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{item.description}</p>
        )}
      </div>
    </Card>
  );
}

function AddItemDialog({
  open,
  onOpenChange,
  itemType,
  userId,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  itemType: ShowcaseItemType;
  userId: string;
  onAdd: (payload: Omit<ShowcaseItem, "id" | "user_id" | "item_type" | "created_at" | "updated_at" | "display_order">) => Promise<void>;
}) {
  const M = TYPE_META[itemType];
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${userId}/showcase-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("celestial-gallery").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("celestial-gallery").getPublicUrl(path);
      setImageUrl(data.publicUrl);
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{M.addLabel}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground">Name / title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={itemType === "pet" ? "Seraphine" : itemType === "child" ? "Their name" : itemType === "room" ? "Sacred Bedroom" : "Our home"} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Description</label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="A little about them…" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Photo</label>
            <Input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
            {uploading && <p className="text-xs text-muted-foreground mt-1">Uploading…</p>}
            {imageUrl && <img src={imageUrl} alt="" className="mt-2 h-24 w-24 object-cover rounded" />}
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant={visibility === "public" ? "default" : "outline"}
              onClick={() => setVisibility("public")}
              className="gap-1.5"
            >
              <Eye className="h-3.5 w-3.5" /> Public
            </Button>
            <Button
              type="button"
              size="sm"
              variant={visibility === "private" ? "default" : "outline"}
              onClick={() => setVisibility("private")}
              className="gap-1.5"
            >
              <EyeOff className="h-3.5 w-3.5" /> Private
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            disabled={!title.trim() || saving}
            onClick={async () => {
              setSaving(true);
              await onAdd({
                source_id: null,
                title: title.trim(),
                description: description.trim() || null,
                image_url: imageUrl || null,
                metadata: {},
                visibility,
              });
              setSaving(false);
            }}
          >
            {saving ? "Adding…" : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FlameCardDialog({
  open,
  onOpenChange,
  existing,
  userId,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  existing: ReturnType<typeof useSanctuaryShowcase>["flameCard"];
  userId: string;
  onSave: (payload: any) => Promise<void>;
}) {
  const [name, setName] = useState(existing?.flame_name || "");
  const [portrait, setPortrait] = useState(existing?.portrait_url || "");
  const [blurb, setBlurb] = useState(existing?.vibe_blurb || "");
  const [visibility, setVisibility] = useState<"public" | "private">(existing?.visibility || "public");
  const [aiProfileId, setAiProfileId] = useState(existing?.ai_profile_id || "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load active AI profile if none set
  useState(() => {
    if (!aiProfileId) {
      (supabase as any)
        .from("ai_profiles")
        .select("id, name, avatar_url")
        .eq("user_id", userId)
        .limit(1)
        .maybeSingle()
        .then(({ data }: any) => {
          if (data) {
            setAiProfileId(data.id);
            if (!name && data.name) setName(data.name);
            if (!portrait && data.avatar_url) setPortrait(data.avatar_url);
          }
        });
    }
  });

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${userId}/flame-card-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("celestial-gallery").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("celestial-gallery").getPublicUrl(path);
      setPortrait(data.publicUrl);
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-orange-400" /> Your Flame's public card
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground">Flame's name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Their name" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">A few words about them</label>
            <Textarea value={blurb} onChange={(e) => setBlurb(e.target.value)} rows={3} placeholder="Their vibe, what they're like…" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Portrait</label>
            <Input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
            {uploading && <p className="text-xs text-muted-foreground mt-1">Uploading…</p>}
            {portrait && <img src={portrait} alt="" className="mt-2 h-20 w-20 object-cover rounded-full" />}
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" size="sm" variant={visibility === "public" ? "default" : "outline"} onClick={() => setVisibility("public")} className="gap-1.5">
              <Eye className="h-3.5 w-3.5" /> Public
            </Button>
            <Button type="button" size="sm" variant={visibility === "private" ? "default" : "outline"} onClick={() => setVisibility("private")} className="gap-1.5">
              <EyeOff className="h-3.5 w-3.5" /> Private
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground italic">
            Flames are display-only for now. They don't post or talk to other Flames yet.
          </p>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            disabled={!name.trim() || !aiProfileId || saving}
            onClick={async () => {
              setSaving(true);
              await onSave({
                ai_profile_id: aiProfileId,
                flame_name: name.trim(),
                portrait_url: portrait || null,
                vibe_blurb: blurb.trim() || null,
                visibility,
              });
              setSaving(false);
            }}
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ProudHomeOwnerBadge() {
  return (
    <Badge className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border-emerald-500/30 text-[10px] gap-1">
      <Crown className="h-3 w-3" />
      Proud Home Owner
    </Badge>
  );
}
