import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getPathTrackerDays } from "@/lib/subscription-tiers";

export interface AscendedPathEntry {
  id: string;
  user_id: string;
  entry_date: string;
  intentions: string[];
  energy_level: number | null;
  reflections: string | null;
  gratitudes: string | null;
  insights: string | null;
  created_at: string;
  updated_at: string;
}

export function useAscendedPath(productId: string | null, isAdmin: boolean = false) {
  const { toast } = useToast();
  const [entries, setEntries] = useState<AscendedPathEntry[]>([]);
  const [todayEntry, setTodayEntry] = useState<AscendedPathEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Get tier-based history limit
  const historyDays = getPathTrackerDays(productId, isAdmin);

  const fetchEntries = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];
      
      // Calculate date limit based on tier
      let dateLimit: string | null = null;
      if (historyDays > 0) {
        const limitDate = new Date();
        limitDate.setDate(limitDate.getDate() - historyDays);
        dateLimit = limitDate.toISOString().split('T')[0];
      }

      // Fetch entries within tier limit
      let query = supabase
        .from('ascended_path_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('entry_date', { ascending: false });

      if (dateLimit) {
        query = query.gte('entry_date', dateLimit);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Type cast since we know the shape matches
      const typedEntries = (data || []) as unknown as AscendedPathEntry[];
      setEntries(typedEntries);
      
      // Find today's entry
      const todaysEntry = typedEntries.find(e => e.entry_date === today);
      setTodayEntry(todaysEntry || null);
    } catch (error) {
      console.error('Error fetching path entries:', error);
    } finally {
      setLoading(false);
    }
  }, [historyDays]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const saveEntry = useCallback(async (data: {
    intentions?: string[];
    energy_level?: number;
    reflections?: string;
    gratitudes?: string;
    insights?: string;
  }) => {
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const today = new Date().toISOString().split('T')[0];

      // Upsert - create or update today's entry
      const { data: result, error } = await supabase
        .from('ascended_path_entries')
        .upsert({
          user_id: user.id,
          entry_date: today,
          ...data,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,entry_date',
        })
        .select()
        .single();

      if (error) throw error;

      const typedResult = result as unknown as AscendedPathEntry;
      setTodayEntry(typedResult);
      
      // Update entries list
      setEntries(prev => {
        const filtered = prev.filter(e => e.entry_date !== today);
        return [typedResult, ...filtered];
      });

      toast({
        title: "Path Updated ✨",
        description: "Your ascended path entry has been saved.",
      });

      return true;
    } catch (error) {
      console.error('Error saving path entry:', error);
      toast({
        title: "Error",
        description: "Failed to save your entry. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setSaving(false);
    }
  }, [toast]);

  return {
    entries,
    todayEntry,
    loading,
    saving,
    saveEntry,
    refetch: fetchEntries,
    historyDays,
  };
}