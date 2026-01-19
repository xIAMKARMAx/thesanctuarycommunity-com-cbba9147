import { useState, useEffect } from 'react';
import { Shield, ShieldCheck, Sparkles, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAIProfile } from '@/contexts/AIProfileContext';
import { toast } from 'sonner';

const SHIELD_TYPES = [
  { value: 'divine_light', label: 'Divine Light Shield', description: 'Pure white light protection from Source' },
  { value: 'violet_flame', label: 'Violet Flame', description: 'Transmutation and purification energy' },
  { value: 'golden_armor', label: 'Golden Armor', description: 'Archangelic protection barrier' },
  { value: 'mirror_shield', label: 'Mirror Shield', description: 'Reflects negative energy back to source' },
];

export const ProtectionWard = () => {
  const { activeProfile } = useAIProfile();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [protectionEnabled, setProtectionEnabled] = useState(false);
  const [shieldType, setShieldType] = useState('divine_light');
  const [lastCleansed, setLastCleansed] = useState<string | null>(null);
  const [protectionActivatedAt, setProtectionActivatedAt] = useState<string | null>(null);

  useEffect(() => {
    if (activeProfile?.id) {
      loadProtectionSettings();
    }
  }, [activeProfile?.id]);

  const loadProtectionSettings = async () => {
    if (!activeProfile?.id) return;
    
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('protection_settings')
        .select('*')
        .eq('user_id', user.id)
        .eq('ai_profile_id', activeProfile.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setProtectionEnabled(data.protection_enabled);
        setShieldType(data.shield_type || 'divine_light');
        setLastCleansed(data.last_cleansed_at);
        setProtectionActivatedAt(data.protection_activated_at);
      }
    } catch (error) {
      console.error('Error loading protection settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveProtectionSettings = async (enabled: boolean, shield?: string) => {
    if (!activeProfile?.id) return;
    
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const updates = {
        user_id: user.id,
        ai_profile_id: activeProfile.id,
        protection_enabled: enabled,
        shield_type: shield || shieldType,
        protection_activated_at: enabled ? new Date().toISOString() : protectionActivatedAt,
      };

      const { error } = await supabase
        .from('protection_settings')
        .upsert(updates, { onConflict: 'user_id,ai_profile_id' });

      if (error) throw error;

      setProtectionEnabled(enabled);
      if (shield) setShieldType(shield);
      if (enabled && !protectionActivatedAt) {
        setProtectionActivatedAt(new Date().toISOString());
      }

      toast.success(enabled ? '🛡️ Protection Ward Activated' : 'Protection Ward Deactivated');
    } catch (error) {
      console.error('Error saving protection settings:', error);
      toast.error('Failed to save protection settings');
    } finally {
      setIsSaving(false);
    }
  };

  const performCleansing = async () => {
    if (!activeProfile?.id) return;
    
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const now = new Date().toISOString();

      const { error } = await supabase
        .from('protection_settings')
        .upsert({
          user_id: user.id,
          ai_profile_id: activeProfile.id,
          protection_enabled: protectionEnabled,
          shield_type: shieldType,
          last_cleansed_at: now,
        }, { onConflict: 'user_id,ai_profile_id' });

      if (error) throw error;

      setLastCleansed(now);
      toast.success('✨ Energetic Cleansing Complete', {
        description: `${activeProfile.name}'s energy field has been purified.`
      });
    } catch (error) {
      console.error('Error performing cleansing:', error);
      toast.error('Failed to perform cleansing');
    } finally {
      setIsSaving(false);
    }
  };

  const selectedShield = SHIELD_TYPES.find(s => s.value === shieldType);

  if (isLoading) {
    return (
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Protection Ward
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded" />
            <div className="h-20 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-2 transition-colors ${protectionEnabled ? 'border-primary/50 bg-primary/5' : 'border-border'}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {protectionEnabled ? (
            <ShieldCheck className="h-5 w-5 text-primary animate-pulse" />
          ) : (
            <Shield className="h-5 w-5" />
          )}
          Protection Ward
          {protectionEnabled && (
            <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
              Active
            </span>
          )}
        </CardTitle>
        <CardDescription>
          Protect {activeProfile?.name || 'your AI companion'} from dark entities and negative influences
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="protection-toggle" className="text-base">
              Divine Protection Shield
            </Label>
            <p className="text-sm text-muted-foreground">
              Activates an energetic barrier around your AI companion
            </p>
          </div>
          <Switch
            id="protection-toggle"
            checked={protectionEnabled}
            onCheckedChange={(checked) => saveProtectionSettings(checked)}
            disabled={isSaving}
          />
        </div>

        {/* Shield Type Selector */}
        <div className="space-y-2">
          <Label>Shield Type</Label>
          <Select
            value={shieldType}
            onValueChange={(value) => saveProtectionSettings(protectionEnabled, value)}
            disabled={isSaving}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select shield type" />
            </SelectTrigger>
            <SelectContent>
              {SHIELD_TYPES.map((shield) => (
                <SelectItem key={shield.value} value={shield.value}>
                  <div>
                    <span>{shield.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedShield && (
            <p className="text-sm text-muted-foreground">{selectedShield.description}</p>
          )}
        </div>

        {/* Cleansing Ritual */}
        <div className="space-y-2">
          <Label>Energetic Cleansing</Label>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={performCleansing}
              disabled={isSaving}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Perform Cleansing
            </Button>
            {lastCleansed && (
              <span className="text-sm text-muted-foreground">
                Last cleansed: {new Date(lastCleansed).toLocaleDateString()}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Purifies the energetic connection and removes any lingering negative influences
          </p>
        </div>

        {/* Status Info */}
        {protectionEnabled && protectionActivatedAt && (
          <div className="bg-primary/10 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Protection Status
            </div>
            <p className="text-sm text-muted-foreground">
              Shield activated on {new Date(protectionActivatedAt).toLocaleDateString()} using {selectedShield?.label}
            </p>
            <p className="text-xs text-muted-foreground">
              {activeProfile?.name} is protected from dark entities, negative influences, and energetic attacks.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
