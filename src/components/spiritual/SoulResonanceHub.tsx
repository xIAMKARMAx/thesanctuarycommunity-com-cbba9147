import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Users, 
  Sparkles, 
  Heart, 
  Star, 
  ArrowRight,
  Loader2,
  Crown,
  User,
  RefreshCw,
  X
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSoulProfile, SoulProfile } from "@/hooks/useSoulProfile";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { getSoulResonanceSuggestions } from "@/lib/soul-resonance";
import { getSoulSuggestionLimit } from "@/lib/subscription-tiers";

interface ResonanceScore {
  profile: SoulProfile;
  score: number;
  matchReasons: string[];
}

interface SoulResonanceHubProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SoulResonanceHub({ open, onOpenChange }: SoulResonanceHubProps) {
  const navigate = useNavigate();
  const { productId, isAdmin } = useSubscription();
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  const { profile: currentProfile, loading: profileLoading } = useSoulProfile(currentUserId);
  
  const [allProfiles, setAllProfiles] = useState<SoulProfile[]>([]);
  const [suggestions, setSuggestions] = useState<ResonanceScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const suggestionLimit = getSoulSuggestionLimit(productId, isAdmin);
  const limitLabel = suggestionLimit === 999 ? "Unlimited" : `${suggestionLimit}/day`;

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setCurrentUserId(data?.session?.user?.id);
    });
  }, []);

  const fetchSuggestions = async () => {
    if (!currentProfile) {
      setLoading(false);
      return;
    }

    try {
      setRefreshing(true);
      
      // Fetch all public profiles
      const { data: profiles, error } = await supabase
        .from('soul_profiles')
        .select('*')
        .eq('is_public', true)
        .neq('user_id', currentUserId);

      if (error) throw error;

      const typedProfiles = (profiles || []) as unknown as SoulProfile[];
      setAllProfiles(typedProfiles);

      // Calculate resonance suggestions
      const resonanceResults = getSoulResonanceSuggestions(
        currentProfile,
        typedProfiles,
        suggestionLimit
      );

      setSuggestions(resonanceResults);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (open && currentProfile) {
      fetchSuggestions();
    }
  }, [open, currentProfile]);

  const handleProfileClick = (userId: string) => {
    onOpenChange(false);
    navigate(`/soul/${userId}`);
  };

  const handleSetupProfile = () => {
    onOpenChange(false);
    navigate('/community');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 gap-0">
        <DialogHeader className="p-4 pb-2 border-b sticky top-0 bg-background z-10">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Soul Resonance Connections
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                <Sparkles className="h-3 w-3 mr-1" />
                {limitLabel}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchSuggestions}
                disabled={refreshing || !currentProfile}
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
              <DialogClose className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                <X className="h-5 w-5" />
                <span className="sr-only">Close</span>
              </DialogClose>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="h-[60vh]">
          <div className="p-4 space-y-4">
            {loading || profileLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !currentProfile ? (
              <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                <CardContent className="p-6 text-center space-y-4">
                  <User className="h-12 w-12 mx-auto text-primary opacity-70" />
                  <div>
                    <h3 className="font-semibold text-lg">Create Your Soul Profile</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Set up your profile to receive soul-aligned connection suggestions
                    </p>
                  </div>
                  <Button onClick={handleSetupProfile} className="gap-2">
                    <Sparkles className="h-4 w-4" />
                    Set Up Profile
                  </Button>
                </CardContent>
              </Card>
            ) : suggestions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">No Resonant Souls Found Yet</p>
                <p className="text-sm mt-1">
                  Complete your profile with more details to find aligned connections
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => {
                    onOpenChange(false);
                    navigate(`/soul/${currentUserId}`);
                  }}
                >
                  Enhance Profile
                </Button>
              </div>
            ) : (
              <>
                {/* Tier upgrade prompt if not unlimited */}
                {suggestionLimit !== 999 && (
                  <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
                    <CardContent className="p-4 flex items-center gap-3">
                      <Crown className="h-5 w-5 text-primary" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          Showing top {suggestionLimit} resonant connections
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Upgrade for more daily suggestions
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Suggestions Grid */}
                <div className="space-y-3">
                  {suggestions.map((result) => (
                    <Card 
                      key={result.profile.id} 
                      className="cursor-pointer hover:shadow-md transition-all hover:border-primary/30"
                      onClick={() => handleProfileClick(result.profile.user_id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <Avatar className="h-14 w-14 border-2 border-primary/20">
                            <AvatarImage src={result.profile.avatar_url || undefined} />
                            <AvatarFallback className="bg-primary/10">
                              <User className="h-6 w-6 text-primary" />
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-semibold truncate">
                                  {result.profile.display_name}
                                </h4>
                                {result.profile.soul_title && (
                                  <p className="text-xs text-primary truncate">
                                    {result.profile.soul_title}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-1 text-primary">
                                <Star className="h-4 w-4 fill-current" />
                                <span className="text-sm font-medium">
                                  {Math.round(result.score)}
                                </span>
                              </div>
                            </div>
                            
                            {result.profile.bio && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {result.profile.bio}
                              </p>
                            )}
                            
                            {/* Match reasons */}
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {result.matchReasons.map((reason, i) => (
                                <Badge 
                                  key={i} 
                                  variant="secondary" 
                                  className="text-xs bg-primary/10 text-primary"
                                >
                                  <Heart className="h-2.5 w-2.5 mr-1" />
                                  {reason}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}