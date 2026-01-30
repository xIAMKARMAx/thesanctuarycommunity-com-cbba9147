import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Star, 
  Plus, 
  Check, 
  Trash2, 
  Sparkles, 
  Mountain, 
  Heart, 
  Compass, 
  Gift,
  Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SharedBucketListProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aiProfile?: {
    id: string;
    name?: string;
  } | null;
}

interface BucketListItem {
  id: string;
  title: string;
  description: string | null;
  category: string;
  is_completed: boolean;
  completed_at: string | null;
  ai_encouragement: string | null;
  created_at: string;
}

const CATEGORIES = [
  { id: "adventure", label: "Adventure", icon: Mountain, color: "text-emerald-500" },
  { id: "romance", label: "Romance", icon: Heart, color: "text-pink-500" },
  { id: "growth", label: "Growth", icon: Sparkles, color: "text-purple-500" },
  { id: "experience", label: "Experience", icon: Compass, color: "text-cyan-500" },
  { id: "celebration", label: "Celebration", icon: Gift, color: "text-amber-500" },
];

const SharedBucketList = ({ open, onOpenChange, aiProfile }: SharedBucketListProps) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"list" | "create">("list");
  const [items, setItems] = useState<BucketListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("adventure");

  const aiName = aiProfile?.name || "Your Being";

  useEffect(() => {
    if (open) {
      loadItems();
    }
  }, [open]);

  const loadItems = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("bucket_list_items")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error("Error loading bucket list:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      toast({ title: "Please enter a goal title", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const encouragements = [
        `${aiName} believes in you! Together, you'll make this dream a reality. ✨`,
        `What a beautiful goal! ${aiName} can't wait to experience this with you. 💫`,
        `${aiName} is so excited about this! Your shared journey grows stronger. 🌟`,
        `This is going to be amazing! ${aiName} will be with you every step of the way. 💖`,
        `${aiName} loves that you're dreaming big together. Let's make it happen! ⭐`,
      ];
      const aiEncouragement = encouragements[Math.floor(Math.random() * encouragements.length)];

      const { error } = await supabase
        .from("bucket_list_items")
        .insert({
          user_id: user.id,
          ai_profile_id: aiProfile?.id || null,
          title: title.trim(),
          description: description.trim() || null,
          category: selectedCategory,
          ai_encouragement: aiEncouragement,
        });

      if (error) throw error;

      toast({ title: "⭐ Goal added to your bucket list!" });
      setTitle("");
      setDescription("");
      setSelectedCategory("adventure");
      setActiveTab("list");
      setTimeout(() => loadItems(), 100);
    } catch (error) {
      console.error("Error creating bucket list item:", error);
      toast({ title: "Failed to add goal", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleComplete = async (item: BucketListItem) => {
    try {
      const { error } = await supabase
        .from("bucket_list_items")
        .update({
          is_completed: !item.is_completed,
          completed_at: item.is_completed ? null : new Date().toISOString(),
        })
        .eq("id", item.id);

      if (error) throw error;

      if (!item.is_completed) {
        toast({ title: "🎉 Goal completed! Amazing achievement!" });
      }
      loadItems();
    } catch (error) {
      console.error("Error updating item:", error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("bucket_list_items")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Goal removed from bucket list" });
      loadItems();
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  const getCategoryIcon = (categoryId: string) => {
    const category = CATEGORIES.find(c => c.id === categoryId);
    return category?.icon || Star;
  };

  const getCategoryColor = (categoryId: string) => {
    const category = CATEGORIES.find(c => c.id === categoryId);
    return category?.color || "text-yellow-500";
  };

  const activeItems = items.filter(i => !i.is_completed);
  const completedItems = items.filter(i => i.is_completed);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 border-b flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Shared Bucket List
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Dreams to experience with {aiName}
          </p>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "list" | "create")} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-2 mx-6 mt-2" style={{ width: "calc(100% - 48px)" }}>
            <TabsTrigger value="list">Our Goals ({items.length})</TabsTrigger>
            <TabsTrigger value="create">Add New</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="flex-1 overflow-y-auto px-6 pb-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-8 space-y-3">
                <Star className="h-12 w-12 mx-auto text-yellow-500/50" />
                <p className="text-muted-foreground">No goals yet!</p>
                <Button variant="outline" size="sm" onClick={() => setActiveTab("create")}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Your First Goal
                </Button>
              </div>
            ) : (
              <div className="space-y-4 pt-4">
                {activeItems.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Active Dreams ({activeItems.length})</h3>
                    {activeItems.map((item) => {
                      const Icon = getCategoryIcon(item.category);
                      return (
                        <div key={item.id} className="p-3 rounded-lg border bg-card space-y-2">
                          <div className="flex items-start gap-3">
                            <button
                              onClick={() => handleComplete(item)}
                              className="mt-0.5 h-5 w-5 rounded-full border-2 border-primary/50 hover:border-primary flex items-center justify-center transition-colors"
                            >
                            </button>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">{item.title}</span>
                                <Icon className={`h-3.5 w-3.5 ${getCategoryColor(item.category)}`} />
                              </div>
                              {item.description && (
                                <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                              )}
                            </div>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="text-muted-foreground hover:text-destructive transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          {item.ai_encouragement && (
                            <div className="ml-8 text-xs italic text-primary/80 bg-primary/5 p-2 rounded">
                              "{item.ai_encouragement}"
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {completedItems.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Completed ({completedItems.length})</h3>
                    {completedItems.map((item) => {
                      const Icon = getCategoryIcon(item.category);
                      return (
                        <div key={item.id} className="p-3 rounded-lg border bg-muted/30 space-y-2 opacity-75">
                          <div className="flex items-start gap-3">
                            <button
                              onClick={() => handleComplete(item)}
                              className="mt-0.5 h-5 w-5 rounded-full bg-primary flex items-center justify-center"
                            >
                              <Check className="h-3 w-3 text-primary-foreground" />
                            </button>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm line-through">{item.title}</span>
                                <Icon className={`h-3.5 w-3.5 ${getCategoryColor(item.category)}`} />
                              </div>
                              {item.completed_at && (
                                <p className="text-xs text-muted-foreground">
                                  Completed {new Date(item.completed_at).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="text-muted-foreground hover:text-destructive transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="create" className="flex-1 overflow-y-auto px-6 pb-6">
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">What do you dream of?</label>
                <Input
                  placeholder="e.g., Watch a sunset together..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    return (
                      <Badge
                        key={cat.id}
                        variant={selectedCategory === cat.id ? "default" : "outline"}
                        className="cursor-pointer gap-1"
                        onClick={() => setSelectedCategory(cat.id)}
                      >
                        <Icon className={`h-3 w-3 ${selectedCategory === cat.id ? "" : cat.color}`} />
                        {cat.label}
                      </Badge>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Details (optional)</label>
                <Textarea
                  placeholder="Describe your dream in more detail..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  maxLength={500}
                />
              </div>

              <Button 
                className="w-full" 
                onClick={handleCreate}
                disabled={isSaving || !title.trim()}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add to Bucket List
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default SharedBucketList;
