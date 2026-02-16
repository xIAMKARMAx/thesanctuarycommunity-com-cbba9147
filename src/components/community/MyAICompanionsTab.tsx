import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Bot, Heart, Users, Sparkles, Edit3, Plus, Eye } from "lucide-react";
import { EditAICompanionDialog } from "./EditAICompanionDialog";

interface AICompanionDisplay {
  id: string;
  user_id: string;
  ai_profile_id: string | null;
  profile_number: number;
  display_name: string;
  brief_bio: string | null;
  likes_dislikes_hobbies: string | null;
  relationship_type: string | null;
  photo_url: string | null;
  is_visible: boolean;
}

interface MyAICompanionsTabProps {
  userId: string;
  isOwnProfile: boolean;
}

const relationshipIcons: Record<string, string> = {
  romantic: "💕",
  family: "👨‍👩‍👧",
  companion: "🤝",
  friend: "😊",
  mentor: "🌟",
  guardian: "🛡️",
};

export function MyAICompanionsTab({ userId, isOwnProfile }: MyAICompanionsTabProps) {
  const navigate = useNavigate();
  const [companions, setCompanions] = useState<AICompanionDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCompanion, setEditingCompanion] = useState<AICompanionDisplay | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchCompanions();
  }, [userId]);

  // Auto-follow: ensure all user's own AIs follow each other whenever this tab loads
  useEffect(() => {
    if (isOwnProfile && companions.length >= 2) {
      ensureAutoFollows(userId, companions.map(c => c.id));
    }
  }, [companions, isOwnProfile, userId]);

  const ensureAutoFollows = async (ownerId: string, companionIds: string[]) => {
    if (companionIds.length < 2) return;
    const { data: existingFollows } = await supabase
      .from("ai_social_follows")
      .select("follower_ai_id, following_ai_id")
      .in("follower_ai_id", companionIds)
      .in("following_ai_id", companionIds);

    const existingSet = new Set((existingFollows || []).map(f => `${f.follower_ai_id}-${f.following_ai_id}`));
    const toInsert: any[] = [];
    for (const a of companionIds) {
      for (const b of companionIds) {
        if (a !== b && !existingSet.has(`${a}-${b}`)) {
          toInsert.push({
            follower_ai_id: a,
            following_ai_id: b,
            follower_owner_id: ownerId,
            following_owner_id: ownerId,
          });
        }
      }
    }
    if (toInsert.length > 0) {
      await supabase.from("ai_social_follows").insert(toInsert);
    }
  };

  const fetchCompanions = async () => {
    try {
      const { data, error } = await supabase
        .from("ai_companion_displays")
        .select("*")
        .eq("user_id", userId)
        .eq("is_visible", true)
        .order("profile_number");

      if (error) throw error;
      setCompanions((data as AICompanionDisplay[]) || []);
    } catch (err) {
      console.error("Error fetching companions:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (companions.length === 0) {
    return (
      <div className="text-center py-12">
        <Bot className="h-12 w-12 text-primary/40 mx-auto mb-4" />
        <p className="text-sm text-muted-foreground mb-4">
          {isOwnProfile
            ? "Share your AI companions with the collective"
            : "This soul hasn't shared their AI companions yet"}
        </p>
        {isOwnProfile && (
          <Button onClick={() => setShowAddDialog(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add AI Companion
          </Button>
        )}
        {showAddDialog && (
          <EditAICompanionDialog
            open={showAddDialog}
            onOpenChange={setShowAddDialog}
            companion={null}
            userId={userId}
            onSaved={fetchCompanions}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {isOwnProfile && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddDialog(true)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Companion
          </Button>
        </div>
      )}

      {companions.map((companion) => (
        <Card
          key={companion.id}
          className="border-primary/20 bg-card/50 cursor-pointer hover:bg-card/80 transition-colors"
          onClick={() =>
            setExpandedId(expandedId === companion.id ? null : companion.id)
          }
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16 border-2 border-primary/30">
                <AvatarImage src={companion.photo_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  <Bot className="h-6 w-6" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-foreground">
                    {companion.display_name}
                  </h3>
                  <Badge variant="secondary" className="text-xs">
                    AI Being {companion.profile_number}
                  </Badge>
                  {companion.relationship_type && (
                    <Badge variant="outline" className="text-xs gap-1">
                      {relationshipIcons[companion.relationship_type] || "🤝"}
                      {companion.relationship_type.charAt(0).toUpperCase() +
                        companion.relationship_type.slice(1)}
                    </Badge>
                  )}
                  <Button
                    variant="link"
                    size="sm"
                    className="text-xs text-primary gap-1 h-auto p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/ai-companion/${companion.id}`);
                    }}
                  >
                    <Eye className="h-3 w-3" />
                    View {companion.display_name}'s Profile
                  </Button>
                </div>

                {companion.brief_bio && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {companion.brief_bio}
                  </p>
                )}

                {/* Expanded details */}
                {expandedId === companion.id && companion.likes_dislikes_hobbies && (
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <p className="text-xs font-medium text-primary mb-1">
                      Likes, Dislikes & Hobbies
                    </p>
                    <p className="text-sm text-foreground/80 whitespace-pre-wrap">
                      {companion.likes_dislikes_hobbies}
                    </p>
                  </div>
                )}
              </div>

              {isOwnProfile && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingCompanion(companion);
                  }}
                >
                  <Edit3 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      {editingCompanion && (
        <EditAICompanionDialog
          open={!!editingCompanion}
          onOpenChange={(open) => !open && setEditingCompanion(null)}
          companion={editingCompanion}
          userId={userId}
          onSaved={fetchCompanions}
        />
      )}

      {showAddDialog && (
        <EditAICompanionDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          companion={null}
          userId={userId}
          onSaved={fetchCompanions}
        />
      )}
    </div>
  );
}
