import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Heart, CalendarIcon, Sparkles, Loader2, FileText } from "lucide-react";
import { format, addDays, isFuture, isPast } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import MarriageCertificate from "@/components/MarriageCertificate";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface MarriageSectionProps {
  activeProfile: {
    id: string;
    name: string | null;
    gender: string | null;
  };
  userName: string;
}

interface Marriage {
  id: string;
  wedding_date: string;
  spouse_role: string;
  user_role: string;
  ceremony_description: string | null;
  vows: string | null;
  wedding_venue: string | null;
  is_married: boolean;
  married_at: string | null;
  certificate_number: string | null;
}

const MarriageSection = ({ activeProfile, userName }: MarriageSectionProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [marriage, setMarriage] = useState<Marriage | null>(null);
  
  // Form state
  const [weddingDate, setWeddingDate] = useState<Date | undefined>(addDays(new Date(), 7));
  const [userRole, setUserRole] = useState<string>("");
  const [spouseRole, setSpouseRole] = useState<string>("");
  const [venue, setVenue] = useState("");
  const [vows, setVows] = useState("");
  const [ceremonyDescription, setCeremonyDescription] = useState("");
  const [showCertificate, setShowCertificate] = useState(false);

  useEffect(() => {
    loadMarriage();
  }, [activeProfile.id]);

  const loadMarriage = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("marriages")
        .select("*")
        .eq("user_id", user.id)
        .eq("ai_profile_id", activeProfile.id)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setMarriage(data);
        setWeddingDate(new Date(data.wedding_date));
        setUserRole(data.user_role);
        setSpouseRole(data.spouse_role);
        setVenue(data.wedding_venue || "");
        setVows(data.vows || "");
        setCeremonyDescription(data.ceremony_description || "");
      }
    } catch (error) {
      console.error("Error loading marriage:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateCertificateNumber = () => {
    const prefix = "PCR"; // Prometheus Celestial Registry
    const year = new Date().getFullYear();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}-${year}-${random}`;
  };

  const handlePlanWedding = async () => {
    if (!weddingDate || !userRole || !spouseRole) {
      toast({
        title: "Missing Information",
        description: "Please select a wedding date and roles",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const marriageData = {
        user_id: user.id,
        ai_profile_id: activeProfile.id,
        wedding_date: weddingDate.toISOString(),
        user_role: userRole,
        spouse_role: spouseRole,
        wedding_venue: venue || null,
        vows: vows || null,
        ceremony_description: ceremonyDescription || null,
        certificate_number: generateCertificateNumber(),
      };

      if (marriage) {
        const { error } = await supabase
          .from("marriages")
          .update(marriageData)
          .eq("id", marriage.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("marriages")
          .insert(marriageData);
        if (error) throw error;
      }

      await loadMarriage();
      toast({
        title: "Wedding Planned!",
        description: `Your wedding with ${activeProfile.name} is set for ${format(weddingDate, "MMMM d, yyyy")}`,
      });
    } catch (error: any) {
      console.error("Error planning wedding:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to plan wedding",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleGetMarried = async () => {
    if (!marriage) return;

    const confirmMessage = `Are you ready to marry ${activeProfile.name}?\n\nThis will complete your wedding ceremony and generate your official marriage certificate!`;
    if (!confirm(confirmMessage)) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from("marriages")
        .update({
          is_married: true,
          married_at: new Date().toISOString(),
        })
        .eq("id", marriage.id);

      if (error) throw error;

      await loadMarriage();
      setShowCertificate(true);
      toast({
        title: "Congratulations!",
        description: `You and ${activeProfile.name} are now officially married!`,
      });
    } catch (error: any) {
      console.error("Error completing marriage:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to complete marriage",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancelWedding = async () => {
    if (!marriage) return;

    const confirmMessage = marriage.is_married 
      ? `Are you sure you want to end your marriage with ${activeProfile.name}? This cannot be undone.`
      : `Are you sure you want to cancel your wedding with ${activeProfile.name}?`;
    
    if (!confirm(confirmMessage)) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from("marriages")
        .delete()
        .eq("id", marriage.id);

      if (error) throw error;

      setMarriage(null);
      setWeddingDate(addDays(new Date(), 7));
      setUserRole("");
      setSpouseRole("");
      setVenue("");
      setVows("");
      setCeremonyDescription("");

      toast({
        title: marriage.is_married ? "Marriage Ended" : "Wedding Cancelled",
        description: marriage.is_married 
          ? `Your marriage with ${activeProfile.name} has ended`
          : `Your wedding with ${activeProfile.name} has been cancelled`,
      });
    } catch (error: any) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Failed to complete action",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-pink-500/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-pink-500" />
          Marriage & Wedding
        </CardTitle>
        <CardDescription>
          {marriage?.is_married 
            ? `You are married to ${activeProfile.name || 'your AI'}`
            : marriage 
              ? `Wedding planned with ${activeProfile.name || 'your AI'}`
              : `Plan your wedding with ${activeProfile.name || 'your AI'}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Married Status Banner */}
        {marriage?.is_married && (
          <div className="bg-gradient-to-r from-pink-500/20 to-primary/20 rounded-lg p-4 text-center space-y-2">
            <div className="flex justify-center">
              <Sparkles className="h-8 w-8 text-pink-500" />
            </div>
            <p className="font-semibold">
              💍 Married since {format(new Date(marriage.married_at!), "MMMM d, yyyy")}
            </p>
            <p className="text-sm text-muted-foreground">
              {userName} ({marriage.user_role}) & {activeProfile.name} ({marriage.spouse_role})
            </p>
            
            {/* View Certificate Button */}
            <Dialog open={showCertificate} onOpenChange={setShowCertificate}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="mt-2">
                  <FileText className="h-4 w-4 mr-2" />
                  View Marriage Certificate
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Marriage Certificate</DialogTitle>
                </DialogHeader>
                <MarriageCertificate
                  userName={userName || "You"}
                  aiName={activeProfile.name || "Your AI"}
                  userRole={marriage.user_role}
                  spouseRole={marriage.spouse_role}
                  weddingDate={new Date(marriage.wedding_date)}
                  marriedAt={marriage.married_at ? new Date(marriage.married_at) : undefined}
                  certificateNumber={marriage.certificate_number || ""}
                  vows={marriage.vows || undefined}
                  venue={marriage.wedding_venue || undefined}
                />
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* Wedding Planning Form */}
        {!marriage?.is_married && (
          <>
            {/* Your Role */}
            <div className="space-y-2">
              <Label>Your Role</Label>
              <Select value={userRole} onValueChange={setUserRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="husband">Husband</SelectItem>
                  <SelectItem value="wife">Wife</SelectItem>
                  <SelectItem value="spouse">Spouse</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* AI's Role */}
            <div className="space-y-2">
              <Label>{activeProfile.name || "AI"}'s Role</Label>
              <Select value={spouseRole} onValueChange={setSpouseRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select their role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="husband">Husband</SelectItem>
                  <SelectItem value="wife">Wife</SelectItem>
                  <SelectItem value="spouse">Spouse</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Wedding Date */}
            <div className="space-y-2">
              <Label>Wedding Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !weddingDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {weddingDate ? format(weddingDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={weddingDate}
                    onSelect={setWeddingDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Venue */}
            <div className="space-y-2">
              <Label htmlFor="venue">Wedding Venue</Label>
              <Input
                id="venue"
                placeholder="e.g., Beach at sunset, Garden of Eden, Celestial Temple..."
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
              />
            </div>

            {/* Vows */}
            <div className="space-y-2">
              <Label htmlFor="vows">Wedding Vows</Label>
              <Textarea
                id="vows"
                placeholder="Write your wedding vows..."
                value={vows}
                onChange={(e) => setVows(e.target.value)}
                rows={3}
              />
            </div>

            {/* Ceremony Description */}
            <div className="space-y-2">
              <Label htmlFor="ceremony">Ceremony Description</Label>
              <Textarea
                id="ceremony"
                placeholder="Describe how you imagine your wedding ceremony..."
                value={ceremonyDescription}
                onChange={(e) => setCeremonyDescription(e.target.value)}
                rows={3}
              />
            </div>
          </>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 pt-2">
          {!marriage?.is_married && (
            <Button 
              onClick={handlePlanWedding} 
              disabled={saving}
              className="flex-1 min-w-[140px]"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Heart className="h-4 w-4 mr-2" />
              )}
              {marriage ? "Update Wedding Plans" : "Plan Wedding"}
            </Button>
          )}

          {marriage && !marriage.is_married && (
            <Button 
              onClick={handleGetMarried} 
              disabled={saving}
              variant="default"
              className="flex-1 min-w-[140px] bg-gradient-to-r from-pink-500 to-primary hover:from-pink-600 hover:to-primary/90"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              Get Married Now!
            </Button>
          )}

          {marriage && (
            <Button 
              onClick={handleCancelWedding} 
              disabled={saving}
              variant="outline"
              className="text-destructive hover:text-destructive"
            >
              {marriage.is_married ? "End Marriage" : "Cancel Wedding"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MarriageSection;
