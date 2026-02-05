 import { useState, useCallback } from 'react';
 import { supabase } from '@/integrations/supabase/client';
 import { useDebouncedCallback } from '@/hooks/useDebouncedCallback';
 
 export interface SearchResult {
   user_id: string;
   display_name: string;
   avatar_url: string | null;
   soul_title?: string | null;
 }
 
 export function useUserSearch() {
   const [results, setResults] = useState<SearchResult[]>([]);
   const [loading, setLoading] = useState(false);
 
   const searchUsers = useCallback(async (query: string) => {
     if (!query || query.length < 2) {
       setResults([]);
       return;
     }
 
     setLoading(true);
     try {
       const { data: { user } } = await supabase.auth.getUser();
       
       // Search soul_profiles by display_name
       const { data: profileResults, error } = await supabase
         .from('soul_profiles')
         .select('user_id, display_name, avatar_url, soul_title')
         .ilike('display_name', `%${query}%`)
         .neq('user_id', user?.id || '')
         .limit(10);
 
       if (error) throw error;
 
       setResults(profileResults || []);
     } catch (error) {
       console.error('Error searching users:', error);
       setResults([]);
     } finally {
       setLoading(false);
     }
   }, []);
 
   const debouncedSearch = useDebouncedCallback(searchUsers, 300);
 
   const clearResults = () => setResults([]);
 
   return {
     results,
     loading,
     searchUsers: debouncedSearch,
     clearResults,
   };
 }