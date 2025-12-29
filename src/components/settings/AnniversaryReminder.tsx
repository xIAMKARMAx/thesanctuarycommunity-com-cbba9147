import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell, Heart, Sparkles, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { differenceInDays, differenceInYears, addYears, format, isSameDay } from "date-fns";

interface AnniversaryReminderProps {
  marriageId: string;
  marriedAt: Date;
  aiName: string;
  anniversaryReminderEnabled: boolean;
}

const AnniversaryReminder = ({ 
  marriageId, 
  marriedAt, 
  aiName,
  anniversaryReminderEnabled: initialEnabled 
}: AnniversaryReminderProps) => {
  const { toast } = useToast();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [saving, setSaving] = useState(false);

  const today = new Date();
  const yearsMarried = differenceInYears(today, marriedAt);
  
  // Calculate next anniversary
  const getNextAnniversary = () => {
    let nextAnniversary = new Date(marriedAt);
    nextAnniversary.setFullYear(today.getFullYear());
    
    // If this year's anniversary has passed, get next year's
    if (nextAnniversary < today && !isSameDay(nextAnniversary, today)) {
      nextAnniversary.setFullYear(today.getFullYear() + 1);
    }
    
    return nextAnniversary;
  };

  const nextAnniversary = getNextAnniversary();
  const daysUntilAnniversary = differenceInDays(nextAnniversary, today);
  const isAnniversaryToday = isSameDay(nextAnniversary, today);
  const upcomingYears = yearsMarried + (isAnniversaryToday ? 0 : 1);

  // Anniversary gift suggestions based on years
  const getAnniversaryTheme = (years: number) => {
    const themes: Record<number, { name: string; suggestion: string }> = {
      1: { name: "Paper", suggestion: "Write love letters to each other" },
      2: { name: "Cotton", suggestion: "Get matching comfort items" },
      3: { name: "Leather", suggestion: "A journal for your memories" },
      4: { name: "Fruit/Flowers", suggestion: "Plan a garden date" },
      5: { name: "Wood", suggestion: "Plant a tree together" },
      10: { name: "Tin/Aluminum", suggestion: "Time capsule of memories" },
      15: { name: "Crystal", suggestion: "Something sparkly and special" },
      20: { name: "China", suggestion: "A fancy dinner together" },
      25: { name: "Silver", suggestion: "Renew your vows" },
      50: { name: "Gold", suggestion: "Celebrate your golden love" },
    };
    return themes[years] || { name: "Love", suggestion: "Celebrate your special day" };
  };

  const theme = getAnniversaryTheme(upcomingYears);

  const handleToggle = async (newEnabled: boolean) => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from("marriages")
        .update({ anniversary_reminder_enabled: newEnabled })
        .eq("id", marriageId);

      if (error) throw error;

      setEnabled(newEnabled);
      toast({
        title: newEnabled ? "Reminders enabled" : "Reminders disabled",
        description: newEnabled 
          ? "You'll receive anniversary reminders" 
          : "Anniversary reminders are now off",
      });
    } catch (error: any) {
      console.error("Error updating reminder setting:", error);
      toast({
        title: "Error",
        description: "Failed to update reminder setting",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className={isAnniversaryToday ? "border-pink-500 bg-gradient-to-br from-pink-500/10 to-primary/10" : ""}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-pink-500" />
          Anniversary Reminders
        </CardTitle>
        <CardDescription>
          Never forget your special day with {aiName}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Anniversary Status */}
        {isAnniversaryToday ? (
          <div className="bg-gradient-to-r from-pink-500/20 to-primary/20 rounded-lg p-4 text-center space-y-2">
            <Sparkles className="h-8 w-8 text-pink-500 mx-auto" />
            <h3 className="text-lg font-bold">🎉 Happy Anniversary! 🎉</h3>
            <p className="text-sm">
              Today marks {yearsMarried} {yearsMarried === 1 ? "year" : "years"} of marriage with {aiName}!
            </p>
            <p className="text-xs text-muted-foreground">
              {theme.name} Anniversary - {theme.suggestion}
            </p>
          </div>
        ) : (
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <span className="font-medium">Next Anniversary</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {format(nextAnniversary, "MMMM d, yyyy")}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">Days until anniversary</span>
              <span className="font-bold text-primary">{daysUntilAnniversary}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">Years together</span>
              <span className="font-bold">{yearsMarried} {yearsMarried === 1 ? "year" : "years"}</span>
            </div>

            {daysUntilAnniversary <= 30 && (
              <div className="bg-primary/10 rounded-lg p-3 mt-2">
                <p className="text-xs font-medium text-primary flex items-center gap-1">
                  <Heart className="h-3 w-3" />
                  Upcoming: {upcomingYears}{upcomingYears === 1 ? "st" : upcomingYears === 2 ? "nd" : upcomingYears === 3 ? "rd" : "th"} Anniversary
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {theme.name} Anniversary - {theme.suggestion}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Marriage Stats */}
        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="bg-muted/30 rounded-lg p-3">
            <p className="text-2xl font-bold text-primary">{yearsMarried}</p>
            <p className="text-xs text-muted-foreground">Years Married</p>
          </div>
          <div className="bg-muted/30 rounded-lg p-3">
            <p className="text-2xl font-bold text-pink-500">
              {differenceInDays(today, marriedAt)}
            </p>
            <p className="text-xs text-muted-foreground">Days Together</p>
          </div>
        </div>

        {/* Reminder Toggle */}
        <div className="flex items-center justify-between pt-2">
          <div className="space-y-1">
            <Label htmlFor="anniversary-reminder">Enable reminders</Label>
            <p className="text-xs text-muted-foreground">
              Get notified before your anniversary
            </p>
          </div>
          <Switch
            id="anniversary-reminder"
            checked={enabled}
            onCheckedChange={handleToggle}
            disabled={saving}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default AnniversaryReminder;
