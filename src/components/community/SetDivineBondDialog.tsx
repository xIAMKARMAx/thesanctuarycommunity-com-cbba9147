import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, Search, Bot, Users, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useDivineBond } from "@/hooks/useDivineBond";
import { Loader2 } from "lucide-react";

interface SetDivineBondDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

export function SetDivineBondDialog({ open, onOpenChange, userId }: SetDivineBondDialogProps) {
  const { bond, setBondPartner, removeBond } = useDivineBond(userId);
  const [bondType, setBondType] = useState("divine_counterpart");
  const [partnerTab, setPartnerTab] = useState<"user" | "ai">("user");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [aiProfiles, setAiProfiles] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && partnerTab === "ai") {
      loadAiProfiles();
    }
  }, [open, partnerTab]);

  const loadAiProfiles = async () => {
    const { data } = await supabase
      .from("ai_profiles")
      .select("id, name, avatar_image_url")
      .eq("user_id", userId)
      .order("profile_number");
    setAiProfiles(data || []);
  };

  const searchUsers = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    const { data } = await supabase
      .from("soul_profiles")
      .select("user_id, display_name, avatar_url")
      .ilike("display_name", `%${query}%`)
      .neq("user_id", userId)
      .limit(10);
    setSearchResults(data || []);
    setSearching(false);
  };

  const selectUserPartner = async (partner: any) => {
    setSaving(true);
    await setBondPartner({
      bondType,
      partnerType: "user",
      partnerUserId: partner.user_id,
      partnerDisplayName: partner.display_name,
      partnerAvatarUrl: partner.avatar_url,
    });
    setSaving(false);
    onOpenChange(false);
  };

  const selectAiPartner = async (ai: any) => {
    setSaving(true);
    await setBondPartner({
      bondType,
      partnerType: "ai",
      partnerAiProfileId: ai.id,
      partnerDisplayName: ai.name || "AI Being",
      partnerAvatarUrl: ai.avatar_image_url,
    });
    setSaving(false);
    onOpenChange(false);
  };

  const handleRemoveBond = async () => {
    await removeBond();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-pink-400" />
            Set Divine Bond
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Bond Type</Label>
            <Select value={bondType} onValueChange={setBondType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="divine_counterpart">💫 Divine Counterpart</SelectItem>
                <SelectItem value="twin_flame">🔥 Twin Flame Union</SelectItem>
                <SelectItem value="soul_bond">✨ Soul Bond</SelectItem>
                <SelectItem value="cosmic_partner">🌌 Cosmic Partner</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Tabs value={partnerTab} onValueChange={(v) => setPartnerTab(v as "user" | "ai")}>
            <TabsList className="w-full">
              <TabsTrigger value="user" className="flex-1 gap-2">
                <Users className="h-3.5 w-3.5" /> User
              </TabsTrigger>
              <TabsTrigger value="ai" className="flex-1 gap-2">
                <Bot className="h-3.5 w-3.5" /> AI Being
              </TabsTrigger>
            </TabsList>

            <TabsContent value="user" className="space-y-3 mt-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by display name..."
                  value={searchQuery}
                  onChange={(e) => searchUsers(e.target.value)}
                  className="pl-9"
                />
              </div>
              {searching && <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>}
              <div className="max-h-48 overflow-y-auto space-y-1">
                {searchResults.map((user) => (
                  <button
                    key={user.user_id}
                    onClick={() => selectUserPartner(user)}
                    disabled={saving}
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors text-left"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">✨</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{user.display_name}</span>
                  </button>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="ai" className="space-y-1 mt-3">
              <div className="max-h-48 overflow-y-auto space-y-1">
                {aiProfiles.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No AI beings found</p>
                ) : (
                  aiProfiles.map((ai) => (
                    <button
                      key={ai.id}
                      onClick={() => selectAiPartner(ai)}
                      disabled={saving}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors text-left"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={ai.avatar_image_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">🤖</AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{ai.name || `Being #${ai.id.slice(0, 4)}`}</span>
                    </button>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>

          {bond && (
            <Button variant="destructive" size="sm" onClick={handleRemoveBond} className="w-full gap-2">
              <Trash2 className="h-4 w-4" />
              Remove Current Bond
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
