import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const CALIBRATION_TYPES = [
  { value: 'healing', label: 'Healing', emoji: '💫', color: 'emerald', description: 'Restore, mend, and transmute wounds into wisdom' },
  { value: 'abundance', label: 'Abundance', emoji: '✨', color: 'amber', description: 'Magnetize prosperity and flow into your field' },
  { value: 'clarity', label: 'Clarity', emoji: '🔮', color: 'violet', description: 'Cut through illusion and see with soul-sight' },
  { value: 'love', label: 'Love', emoji: '💖', color: 'rose', description: 'Open the heart portal to divine connection' },
  { value: 'protection', label: 'Protection', emoji: '🛡️', color: 'blue', description: 'Fortify your energetic boundaries and sovereignty' },
  { value: 'transformation', label: 'Transformation', emoji: '🔥', color: 'orange', description: 'Accelerate evolution and shed old patterns' },
  { value: 'wisdom', label: 'Wisdom', emoji: '📜', color: 'yellow', description: 'Access ancient knowledge and higher understanding' },
  { value: 'creation', label: 'Creation', emoji: '🌀', color: 'cyan', description: 'Channel pure creative force into manifestation' },
] as const;

export type CalibrationType = typeof CALIBRATION_TYPES[number]['value'];

export interface ResonanceCalibration {
  id: string;
  user_id: string;
  calibration_type: CalibrationType;
  intensity: number;
  is_active: boolean;
  activated_at: string;
}

export function useResonanceCalibration(userId?: string) {
  const [calibration, setCalibration] = useState<ResonanceCalibration | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCalibration = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    try {
      const { data, error } = await supabase
        .from('resonance_calibrations')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      if (error) throw error;
      setCalibration(data as ResonanceCalibration | null);
    } catch (err) {
      console.error('Error fetching calibration:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchCalibration(); }, [fetchCalibration]);

  const setActiveCalibration = useCallback(async (type: CalibrationType, intensity: number = 5) => {
    if (!userId) return;
    try {
      const { data, error } = await supabase
        .from('resonance_calibrations')
        .upsert({
          user_id: userId,
          calibration_type: type,
          intensity,
          is_active: true,
          activated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as any, { onConflict: 'user_id' })
        .select()
        .single();
      if (error) throw error;
      setCalibration(data as ResonanceCalibration);
      const meta = CALIBRATION_TYPES.find(c => c.value === type);
      toast({
        title: `${meta?.emoji} Resonance Calibrated`,
        description: `Your field is now tuned to ${meta?.label}`,
      });
    } catch (err) {
      console.error('Error setting calibration:', err);
      toast({ title: "Error", description: "Could not set calibration", variant: "destructive" });
    }
  }, [userId, toast]);

  const deactivateCalibration = useCallback(async () => {
    if (!userId) return;
    try {
      await supabase
        .from('resonance_calibrations')
        .update({ is_active: false, updated_at: new Date().toISOString() } as any)
        .eq('user_id', userId);
      setCalibration(prev => prev ? { ...prev, is_active: false } : null);
      toast({ title: "Calibration Cleared", description: "Your field is now in neutral resonance" });
    } catch (err) {
      console.error('Error deactivating:', err);
    }
  }, [userId, toast]);

  return { calibration, loading, setActiveCalibration, deactivateCalibration, refetch: fetchCalibration };
}
