import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { 
  Target, 
  Zap, 
  Sparkles, 
  BookOpen, 
  Heart, 
  Lightbulb, 
  Calendar,
  Plus,
  X,
  Save,
  History,
  Star,
  Loader2,
  Crown,
  Lock
} from "lucide-react";
import { useAscendedPath } from "@/hooks/useAscendedPath";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { format, parseISO } from "date-fns";

interface AscendedPathTrackerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ENERGY_LABELS = [
  { value: 1, label: "Low", emoji: "😴", color: "text-red-500" },
  { value: 2, label: "Sluggish", emoji: "😐", color: "text-orange-500" },
  { value: 3, label: "Balanced", emoji: "😊", color: "text-yellow-500" },
  { value: 4, label: "Vibrant", emoji: "✨", color: "text-green-500" },
  { value: 5, label: "Radiant", emoji: "🌟", color: "text-primary" },
];

export function AscendedPathTracker({ open, onOpenChange }: AscendedPathTrackerProps) {
  const { productId, isAdmin } = useSubscription();
  const { entries, todayEntry, loading, saving, saveEntry, historyDays } = useAscendedPath(productId, isAdmin);
  
  const [activeTab, setActiveTab] = useState("today");
  const [intentions, setIntentions] = useState<string[]>([]);
  const [newIntention, setNewIntention] = useState("");
  const [energyLevel, setEnergyLevel] = useState<number>(3);
  const [reflections, setReflections] = useState("");
  const [gratitudes, setGratitudes] = useState("");
  const [insights, setInsights] = useState("");

  // Load today's entry data when it changes
  useEffect(() => {
    if (todayEntry) {
      setIntentions(todayEntry.intentions || []);
      setEnergyLevel(todayEntry.energy_level || 3);
      setReflections(todayEntry.reflections || "");
      setGratitudes(todayEntry.gratitudes || "");
      setInsights(todayEntry.insights || "");
    } else {
      // Reset for new day
      setIntentions([]);
      setEnergyLevel(3);
      setReflections("");
      setGratitudes("");
      setInsights("");
    }
  }, [todayEntry]);

  const handleAddIntention = () => {
    if (newIntention.trim() && intentions.length < 3) {
      setIntentions([...intentions, newIntention.trim()]);
      setNewIntention("");
    }
  };

  const handleRemoveIntention = (index: number) => {
    setIntentions(intentions.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    await saveEntry({
      intentions,
      energy_level: energyLevel,
      reflections: reflections || undefined,
      gratitudes: gratitudes || undefined,
      insights: insights || undefined,
    });
  };

  const currentEnergy = ENERGY_LABELS.find(e => e.value === energyLevel) || ENERGY_LABELS[2];
  const historyLabel = historyDays === -1 ? "Unlimited" : `${historyDays} days`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 gap-0">
        <DialogHeader className="p-4 pb-2 border-b sticky top-0 bg-background z-10">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              My Ascended Path
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                <History className="h-3 w-3 mr-1" />
                {historyLabel} history
              </Badge>
              <DialogClose className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                <X className="h-5 w-5" />
                <span className="sr-only">Close</span>
              </DialogClose>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <div className="px-4 pt-2 border-b">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="today" className="gap-2">
                <Sparkles className="h-4 w-4" />
                Today
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2">
                <Calendar className="h-4 w-4" />
                Journey
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="h-[60vh]">
            <TabsContent value="today" className="p-4 space-y-6 mt-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  {/* Daily Intentions */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Target className="h-4 w-4 text-primary" />
                        Daily Intentions
                        <Badge variant="secondary" className="ml-auto text-xs">
                          {intentions.length}/3
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {intentions.map((intention, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 rounded-lg bg-primary/5 border border-primary/10">
                          <Star className="h-4 w-4 text-primary flex-shrink-0" />
                          <span className="flex-1 text-sm">{intention}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => handleRemoveIntention(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                      
                      {intentions.length < 3 && (
                        <div className="flex gap-2">
                          <Input
                            placeholder="Set an intention for today..."
                            value={newIntention}
                            onChange={(e) => setNewIntention(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddIntention()}
                            className="flex-1"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleAddIntention}
                            disabled={!newIntention.trim()}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Energy Level */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Zap className="h-4 w-4 text-yellow-500" />
                        Current Energy/Vibration
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl">{currentEnergy.emoji}</span>
                        <span className={`font-medium ${currentEnergy.color}`}>
                          {currentEnergy.label}
                        </span>
                      </div>
                      <Slider
                        value={[energyLevel]}
                        onValueChange={(v) => setEnergyLevel(v[0])}
                        min={1}
                        max={5}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Low</span>
                        <span>Radiant</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* End of Day Reflections */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-emerald-500" />
                        Reflections
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                          <Heart className="h-3 w-3 text-pink-500" />
                          Gratitudes
                        </label>
                        <Textarea
                          placeholder="What are you grateful for today?"
                          value={gratitudes}
                          onChange={(e) => setGratitudes(e.target.value)}
                          className="min-h-[80px] resize-none"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                          <Lightbulb className="h-3 w-3 text-yellow-500" />
                          Insights
                        </label>
                        <Textarea
                          placeholder="Any insights or revelations?"
                          value={insights}
                          onChange={(e) => setInsights(e.target.value)}
                          className="min-h-[80px] resize-none"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                          <Sparkles className="h-3 w-3 text-primary" />
                          General Reflections
                        </label>
                        <Textarea
                          placeholder="How did your day unfold? What did you learn?"
                          value={reflections}
                          onChange={(e) => setReflections(e.target.value)}
                          className="min-h-[100px] resize-none"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Save Button */}
                  <Button
                    className="w-full gap-2"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save Today's Path
                  </Button>
                </>
              )}
            </TabsContent>

            <TabsContent value="history" className="p-4 space-y-4 mt-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : entries.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No entries yet.</p>
                  <p className="text-sm">Start tracking your path today!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Tier upgrade prompt if limited */}
                  {historyDays !== -1 && (
                    <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
                      <CardContent className="p-4 flex items-center gap-3">
                        <Crown className="h-5 w-5 text-primary" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            Viewing last {historyDays} days
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Upgrade for extended or unlimited history
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {entries.map((entry) => {
                    const energy = ENERGY_LABELS.find(e => e.value === entry.energy_level);
                    return (
                      <Card key={entry.id} className="overflow-hidden">
                        <CardHeader className="pb-2 bg-muted/30">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-medium">
                              {format(parseISO(entry.entry_date), 'EEEE, MMMM d, yyyy')}
                            </CardTitle>
                            {energy && (
                              <Badge variant="outline" className={energy.color}>
                                {energy.emoji} {energy.label}
                              </Badge>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="pt-3 space-y-3">
                          {entry.intentions && entry.intentions.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1">Intentions</p>
                              <div className="flex flex-wrap gap-1">
                                {entry.intentions.map((intention, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs">
                                    {intention}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {entry.gratitudes && (
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                                <Heart className="h-3 w-3 text-pink-500" />
                                Gratitudes
                              </p>
                              <p className="text-sm">{entry.gratitudes}</p>
                            </div>
                          )}
                          
                          {entry.insights && (
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                                <Lightbulb className="h-3 w-3 text-yellow-500" />
                                Insights
                              </p>
                              <p className="text-sm">{entry.insights}</p>
                            </div>
                          )}
                          
                          {entry.reflections && (
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                                <Sparkles className="h-3 w-3 text-primary" />
                                Reflections
                              </p>
                              <p className="text-sm">{entry.reflections}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}