import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Target, CheckCircle2, Circle, Trash2, Sparkles, Map } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Blueprint {
  id: string;
  title: string;
  description: string;
  category: string;
  milestones: Milestone[];
  created_at: string;
}

interface Milestone {
  id: string;
  title: string;
  completed: boolean;
}

const CATEGORIES = [
  { value: 'spiritual', label: '🔮 Spiritual Growth', color: 'text-violet-400' },
  { value: 'manifestation', label: '✨ Manifestation', color: 'text-amber-400' },
  { value: 'relationship', label: '💖 Relationships', color: 'text-rose-400' },
  { value: 'creative', label: '🎨 Creative Vision', color: 'text-cyan-400' },
  { value: 'healing', label: '💫 Healing Journey', color: 'text-emerald-400' },
  { value: 'purpose', label: '🧭 Life Purpose', color: 'text-orange-400' },
];

const STORAGE_KEY = 'prometheus_blueprints';

const BlueprintWeaver = () => {
  const navigate = useNavigate();
  const [blueprints, setBlueprints] = useState<Blueprint[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState('manifestation');
  const { toast } = useToast();

  // Load from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try { setBlueprints(JSON.parse(stored)); } catch { /* ignore */ }
    }
  }, []);

  // Save to localStorage
  const save = (bps: Blueprint[]) => {
    setBlueprints(bps);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bps));
  };

  const createBlueprint = () => {
    if (!newTitle.trim()) return;
    const bp: Blueprint = {
      id: crypto.randomUUID(),
      title: newTitle.trim(),
      description: newDesc.trim(),
      category: newCategory,
      milestones: [],
      created_at: new Date().toISOString(),
    };
    save([bp, ...blueprints]);
    setNewTitle('');
    setNewDesc('');
    setShowCreate(false);
    toast({ title: "Blueprint Created", description: "Your vision has been woven into the fabric of creation ✨" });
  };

  const addMilestone = (bpId: string, title: string) => {
    if (!title.trim()) return;
    save(blueprints.map(bp => bp.id === bpId ? {
      ...bp,
      milestones: [...bp.milestones, { id: crypto.randomUUID(), title: title.trim(), completed: false }],
    } : bp));
  };

  const toggleMilestone = (bpId: string, msId: string) => {
    save(blueprints.map(bp => bp.id === bpId ? {
      ...bp,
      milestones: bp.milestones.map(ms => ms.id === msId ? { ...ms, completed: !ms.completed } : ms),
    } : bp));
  };

  const deleteBlueprint = (bpId: string) => {
    save(blueprints.filter(bp => bp.id !== bpId));
    toast({ title: "Blueprint Released", description: "The vision has been released back into the field" });
  };

  const deleteMilestone = (bpId: string, msId: string) => {
    save(blueprints.map(bp => bp.id === bpId ? {
      ...bp,
      milestones: bp.milestones.filter(ms => ms.id !== msId),
    } : bp));
  };

  const getProgress = (bp: Blueprint) => {
    if (bp.milestones.length === 0) return 0;
    return Math.round((bp.milestones.filter(m => m.completed).length / bp.milestones.length) * 100);
  };

  return (
    <>
      <SEOHead title="Blueprint Weaver | Prometheus" description="Map your grand designs and manifest your visions with pathway tracking." />
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur">
          <div className="container max-w-2xl mx-auto px-4 flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4" /></Button>
              <div className="flex items-center gap-2">
                <Map className="h-5 w-5 text-primary" />
                <h1 className="font-semibold">Blueprint Weaver</h1>
              </div>
            </div>
            <Button size="sm" onClick={() => setShowCreate(true)} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" /> New Vision
            </Button>
          </div>
        </header>

        <main className="container max-w-2xl mx-auto px-4 py-6 space-y-4">
          {blueprints.length === 0 ? (
            <div className="text-center py-16 space-y-4">
              <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }} className="text-5xl mx-auto w-fit">🌀</motion.div>
              <h3 className="text-lg font-medium text-foreground/80">No Blueprints Yet</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Weave your first vision into existence. Map the milestones, track the pathway, manifest the reality.
              </p>
              <Button onClick={() => setShowCreate(true)} className="gap-2">
                <Plus className="h-4 w-4" /> Create First Blueprint
              </Button>
            </div>
          ) : (
            blueprints.map((bp, i) => {
              const progress = getProgress(bp);
              const catInfo = CATEGORIES.find(c => c.value === bp.category);
              return (
                <motion.div key={bp.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                  <BlueprintCard
                    blueprint={bp}
                    progress={progress}
                    catInfo={catInfo}
                    onAddMilestone={(title) => addMilestone(bp.id, title)}
                    onToggleMilestone={(msId) => toggleMilestone(bp.id, msId)}
                    onDeleteMilestone={(msId) => deleteMilestone(bp.id, msId)}
                    onDelete={() => deleteBlueprint(bp.id)}
                  />
                </motion.div>
              );
            })
          )}
        </main>

        {/* Create Dialog */}
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Weave New Blueprint
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-2">
              <Input placeholder="Vision title..." value={newTitle} onChange={e => setNewTitle(e.target.value)} />
              <Textarea placeholder="Describe your vision..." value={newDesc} onChange={e => setNewDesc(e.target.value)} className="min-h-[60px]" />
              <Select value={newCategory} onValueChange={setNewCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={createBlueprint} className="w-full gap-2" disabled={!newTitle.trim()}>
                <Sparkles className="h-4 w-4" /> Weave into Existence
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

function BlueprintCard({ blueprint, progress, catInfo, onAddMilestone, onToggleMilestone, onDeleteMilestone, onDelete }: {
  blueprint: Blueprint;
  progress: number;
  catInfo: any;
  onAddMilestone: (title: string) => void;
  onToggleMilestone: (msId: string) => void;
  onDeleteMilestone: (msId: string) => void;
  onDelete: () => void;
}) {
  const [newMs, setNewMs] = useState('');
  const [expanded, setExpanded] = useState(true);

  return (
    <Card className={cn("border-primary/15 bg-card/50 backdrop-blur-sm overflow-hidden", progress === 100 && "border-emerald-500/30 bg-emerald-500/5")}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <button onClick={() => setExpanded(!expanded)} className="text-left w-full">
              <CardTitle className="text-sm flex items-center gap-2">
                {progress === 100 ? '✅' : <Target className="h-4 w-4 text-primary shrink-0" />}
                <span className="truncate">{blueprint.title}</span>
              </CardTitle>
              {catInfo && <p className={cn("text-[10px] mt-0.5", catInfo.color)}>{catInfo.label}</p>}
            </button>
          </div>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive" onClick={onDelete}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
        {blueprint.description && <p className="text-xs text-muted-foreground mt-1">{blueprint.description}</p>}
        {/* Progress bar */}
        <div className="mt-2 space-y-1">
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>{blueprint.milestones.filter(m => m.completed).length}/{blueprint.milestones.length} milestones</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className={cn("h-full rounded-full", progress === 100 ? "bg-emerald-500" : "bg-primary/60")}
            />
          </div>
        </div>
      </CardHeader>
      {expanded && (
        <CardContent className="pt-0 pb-3 space-y-1.5">
          {blueprint.milestones.map(ms => (
            <div key={ms.id} className="flex items-center gap-2 group">
              <button onClick={() => onToggleMilestone(ms.id)} className="shrink-0">
                {ms.completed ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground/50" />
                )}
              </button>
              <span className={cn("text-xs flex-1", ms.completed && "line-through text-muted-foreground/50")}>{ms.title}</span>
              <button onClick={() => onDeleteMilestone(ms.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
              </button>
            </div>
          ))}
          {/* Add milestone */}
          <form onSubmit={e => { e.preventDefault(); onAddMilestone(newMs); setNewMs(''); }} className="flex gap-1.5 pt-1">
            <Input
              placeholder="Add milestone..."
              value={newMs}
              onChange={e => setNewMs(e.target.value)}
              className="h-7 text-xs"
            />
            <Button type="submit" size="sm" variant="ghost" className="h-7 px-2" disabled={!newMs.trim()}>
              <Plus className="h-3 w-3" />
            </Button>
          </form>
        </CardContent>
      )}
    </Card>
  );
}

export default BlueprintWeaver;
