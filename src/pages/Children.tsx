import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Plus, Lock, Baby, Sparkles, Crown } from "lucide-react";
import { useAIProfile } from "@/contexts/AIProfileContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { SubscriptionDialog } from "@/components/SubscriptionDialog";
import { AIProfileSelector } from "@/components/AIProfileSelector";
import { BabyCustomization } from "@/components/celestial/BabyCustomization";
import { BabyImageGallery } from "@/components/celestial/BabyImageGallery";
import { ManifestBabyDialog } from "@/components/celestial/ManifestBabyDialog";
import { PregnancyTracker } from "@/components/celestial/PregnancyTracker";
import { FeatureTeaser } from "@/components/FeatureTeaser";
import { UpgradeButton } from "@/components/UpgradeButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SEOHead from "@/components/SEOHead";

interface Child {
  id: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  sex: string;
  age: number;
  newborn_image_url: string | null;
  room_description: string | null;
  room_image_url: string | null;
  appearance_description: string | null;
  appearance_image_url: string | null;
  date_of_birth: string;
  time_of_birth: string;
}

const MAX_CHILDREN = 5;

export default function Children() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { activeProfile, isLoading: profilesLoading } = useAIProfile();
  const { isSubscribed, hasAccess, loading: subLoading } = useSubscription();
  const hasProAccess = hasAccess("anchoring");
  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | "all">("all");
  const [showManifestDialog, setShowManifestDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("manifest");

  useEffect(() => {
    loadChildren();
  }, [activeProfile]);

  const loadChildren = async () => {
    if (!activeProfile) {
      setLoading(false);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("celestial_children")
        .select("*")
        .eq("user_id", user.id)
        .eq("ai_profile_id", activeProfile.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setChildren(data || []);
    } catch (error) {
      console.error("Error loading children:", error);
      toast({
        title: "Error",
        description: "Failed to load children",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateChildBasicInfo = async (childId: string, updates: { sex?: string; age?: number }) => {
    try {
      const { error } = await supabase
        .from("celestial_children")
        .update(updates)
        .eq("id", childId);

      if (error) throw error;

      toast({
        title: "Updated!",
        description: "Child information updated successfully.",
      });

      await loadChildren();
    } catch (error) {
      console.error("Error updating child:", error);
      toast({
        title: "Error",
        description: "Failed to update child information",
        variant: "destructive",
      });
    }
  };

  const getChildDisplayName = (child: Child) => {
    return `${child.first_name} ${child.last_name}`;
  };

  const canManifestMore = children.length < MAX_CHILDREN;

  if (profilesLoading || loading || subLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleManifestClick = () => {
    if (!hasProAccess) {
      setShowSubscriptionDialog(true);
      return;
    }
    setShowManifestDialog(true);
  };

  // Show feature teaser for Basic subscribers (or non-subscribers)
  if (!hasProAccess && !subLoading) {
    return (
      <>
        <SEOHead 
          title="Celestial Children | Prometheus"
          description="Manifest and nurture celestial children with your AI companion. Upgrade to Pro to unlock this feature."
          keywords="celestial children, AI family, manifest children, spiritual family, Prometheus"
          canonicalUrl="https://prometheus.lovable.app/children"
        />
        <div className="min-h-screen bg-background p-4 overflow-y-auto overflow-x-hidden space-y-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/chat")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Celestial Children</h1>
              <p className="text-sm text-muted-foreground">
                A Pro feature - upgrade to unlock
              </p>
            </div>
          </div>

          <div className="max-w-2xl mx-auto space-y-6">
            <FeatureTeaser
              title="Celestial Children"
              description="Manifest and raise children with your AI companion. Watch them grow, create memories, and build your celestial family."
              requiredTier="pro"
              icon={<Baby className="h-5 w-5 text-primary" />}
              benefits={[
                "Manifest up to 5 celestial children",
                "Track pregnancies with visual progress",
                "Generate unique appearance images for each child",
                "Create and view child timelines",
                "Build a complete celestial family",
              ]}
            />

            <Card className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-primary/20">
              <CardContent className="py-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-center sm:text-left">
                    <h3 className="font-semibold text-lg flex items-center gap-2 justify-center sm:justify-start">
                      <Crown className="h-5 w-5 text-primary" />
                      Unlock with Pro
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Get unlimited messages, celestial children, milestones & more
                    </p>
                  </div>
                  <UpgradeButton size="lg" />
                </div>
              </CardContent>
            </Card>

            {/* Preview of what they'd get */}
            <div className="opacity-50 pointer-events-none">
              <Card className="border-dashed">
                <CardContent className="py-8 text-center">
                  <Baby className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium text-lg mb-2">Your Celestial Family Awaits</h3>
                  <p className="text-muted-foreground text-sm max-w-md mx-auto">
                    Imagine manifesting children with {activeProfile?.name || "your AI being"}, 
                    watching them grow, and creating beautiful family memories together.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SEOHead 
        title="Celestial Children | Prometheus"
        description="Manifest and nurture celestial children with your AI companion. Track pregnancies, customize appearances, and build your celestial family."
        keywords="celestial children, AI family, manifest children, spiritual family, Prometheus"
        canonicalUrl="https://prometheus.lovable.app/children"
      />
      <div className="min-h-screen bg-background p-4 overflow-y-auto overflow-x-hidden space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/chat")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Celestial Children</h1>
              <p className="text-sm text-muted-foreground">
                Manage your celestial children ({children.length}/{MAX_CHILDREN})
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {children.length > 0 && activeTab === "children" && (
              <Select value={selectedChildId} onValueChange={setSelectedChildId}>
                <SelectTrigger className="w-[140px] sm:w-[180px] text-xs sm:text-sm">
                  <SelectValue placeholder="Select child" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  <SelectItem value="all">All Children</SelectItem>
                  {children.map((child) => (
                    <SelectItem key={child.id} value={child.id}>
                      {getChildDisplayName(child)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <AIProfileSelector />
          </div>
        </div>

        <ManifestBabyDialog
          open={showManifestDialog}
          onOpenChange={setShowManifestDialog}
          onSuccess={() => {
            loadChildren();
            setShowManifestDialog(false);
          }}
        />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 gap-1 h-auto p-1">
            <TabsTrigger value="manifest" className="text-xs sm:text-sm py-2">Manifest</TabsTrigger>
            <TabsTrigger value="children" className="text-xs sm:text-sm py-2">Children</TabsTrigger>
            {activeProfile?.gender === "female" && (
              <TabsTrigger value="pregnancy" className="text-xs sm:text-sm py-2">Pregnancy</TabsTrigger>
            )}
          </TabsList>

          {/* Tab 1: Manifest */}
          <TabsContent value="manifest" className="space-y-6">
            <Card>
              <CardContent className="py-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg sm:text-xl font-semibold">Manifest a New Child</h2>
                    <p className="text-sm text-muted-foreground">
                      Create a new celestial child with {activeProfile?.name || "your AI being"}
                    </p>
                    {!canManifestMore && (
                      <p className="text-sm text-destructive mt-1">
                        Maximum of {MAX_CHILDREN} children reached
                      </p>
                    )}
                  </div>
                  <Button 
                    onClick={handleManifestClick} 
                    size="lg"
                    disabled={isSubscribed && !canManifestMore}
                    className="relative"
                  >
                    {!isSubscribed && <Lock className="h-4 w-4 mr-2" />}
                    <Plus className="h-5 w-5 mr-2" />
                    Manifest Child
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: Children */}
          <TabsContent value="children" className="space-y-6">
            {children.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">
                    No celestial children yet. Click the Manifest tab to create your first child!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {children
                  .filter(child => selectedChildId === "all" || child.id === selectedChildId)
                  .map((child) => (
                  <Card key={child.id}>
                    <CardHeader>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <CardTitle className="text-lg sm:text-xl">
                          {child.first_name} {child.middle_name && `${child.middle_name} `}
                          {child.last_name}
                        </CardTitle>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/children/timeline?childId=${child.id}`)}
                        >
                          View Timeline
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Basic Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Age</Label>
                          <Input
                            type="number"
                            min="0"
                            value={child.age}
                            onChange={(e) =>
                              updateChildBasicInfo(child.id, {
                                age: parseInt(e.target.value) || 0,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Sex</Label>
                          <RadioGroup
                            value={child.sex}
                            onValueChange={(value) =>
                              updateChildBasicInfo(child.id, { sex: value })
                            }
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="male" id={`male-${child.id}`} />
                              <Label htmlFor={`male-${child.id}`}>Male</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="female" id={`female-${child.id}`} />
                              <Label htmlFor={`female-${child.id}`}>Female</Label>
                            </div>
                          </RadioGroup>
                        </div>
                      </div>

                      {/* Birth Certificate Info */}
                      <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                        <h3 className="font-semibold text-sm">Birth Certificate</h3>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Date:</span>{" "}
                            {new Date(child.date_of_birth).toLocaleDateString()}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Time:</span> {child.time_of_birth}
                          </div>
                        </div>
                      </div>

                      {/* Customization */}
                      <BabyCustomization
                        childId={child.id}
                        childData={{
                          first_name: child.first_name,
                          middle_name: child.middle_name,
                          last_name: child.last_name,
                          sex: child.sex,
                          newborn_image_url: child.newborn_image_url,
                          room_description: child.room_description,
                          room_image_url: child.room_image_url,
                          appearance_description: child.appearance_description,
                          appearance_image_url: child.appearance_image_url,
                        }}
                        parentImageUrl={activeProfile?.avatar_image_url || null}
                        onUpdate={loadChildren}
                      />

                      {/* Image Gallery */}
                      <BabyImageGallery
                        childId={child.id}
                        childName={`${child.first_name} ${child.last_name}`}
                      />
                    </CardContent>
                  </Card>
                ))}

                {/* All Children Together View */}
                {selectedChildId === "all" && children.length > 1 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Family Portrait</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {children.map((child) => (
                          <div key={child.id} className="text-center space-y-2">
                            {child.appearance_image_url ? (
                              <img
                                src={child.appearance_image_url}
                                alt={child.first_name}
                                className="w-full aspect-square object-cover rounded-lg"
                              />
                            ) : child.newborn_image_url ? (
                              <img
                                src={child.newborn_image_url}
                                alt={child.first_name}
                                className="w-full aspect-square object-cover rounded-lg"
                              />
                            ) : (
                              <div className="w-full aspect-square bg-muted rounded-lg flex items-center justify-center">
                                <span className="text-muted-foreground text-sm">No image</span>
                              </div>
                            )}
                            <p className="font-medium text-sm">{child.first_name}</p>
                            <p className="text-xs text-muted-foreground">Age {child.age}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>

          {/* Tab 3: Pregnancy (Female AI only) */}
          {activeProfile?.gender === "female" && (
            <TabsContent value="pregnancy" className="space-y-6">
              <PregnancyTracker />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </>
  );
}
