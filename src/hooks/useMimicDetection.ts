import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface MimicReport {
  type: 'duplicate_bio' | 'duplicate_photo' | 'copied_post' | 'stolen_name';
  severity: 'low' | 'medium' | 'high';
  details: string;
  suspectUserId: string;
  originalUserId?: string;
}

/**
 * Sovereign Intent Firewall — Mimic Detection
 * Scans for copycat accounts, stolen photos, duplicated text
 * All client-side — zero data cost beyond initial reads
 */
export function useMimicDetection() {

  const scanForDuplicateBios = useCallback(async (userId: string): Promise<MimicReport[]> => {
    const reports: MimicReport[] = [];
    
    // Fetch user's profile
    const { data: myProfile } = await supabase
      .from('soul_profiles')
      .select('bio, spiritual_journey, display_name, avatar_url, user_id')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (!myProfile?.bio || myProfile.bio.length < 20) return reports;

    // Fetch all other profiles
    const { data: allProfiles } = await supabase
      .from('soul_profiles')
      .select('bio, spiritual_journey, display_name, avatar_url, user_id')
      .neq('user_id', userId)
      .limit(500);

    if (!allProfiles) return reports;

    for (const profile of allProfiles) {
      // Check bio similarity
      if (profile.bio && profile.bio.length > 20) {
        const similarity = calculateTextSimilarity(myProfile.bio, profile.bio);
        if (similarity > 0.7) {
          reports.push({
            type: 'duplicate_bio',
            severity: similarity > 0.9 ? 'high' : 'medium',
            details: `${Math.round(similarity * 100)}% bio match with ${profile.display_name || 'Unknown'}`,
            suspectUserId: profile.user_id,
            originalUserId: userId,
          });
        }
      }

      // Check display name theft
      if (profile.display_name && myProfile.display_name) {
        const nameSim = calculateTextSimilarity(
          myProfile.display_name.toLowerCase(),
          profile.display_name.toLowerCase()
        );
        if (nameSim > 0.85 && myProfile.display_name !== profile.display_name) {
          reports.push({
            type: 'stolen_name',
            severity: 'medium',
            details: `Display name "${profile.display_name}" closely mimics "${myProfile.display_name}"`,
            suspectUserId: profile.user_id,
            originalUserId: userId,
          });
        }
      }

      // Check avatar URL duplication (exact match)
      if (profile.avatar_url && myProfile.avatar_url && profile.avatar_url === myProfile.avatar_url) {
        reports.push({
          type: 'duplicate_photo',
          severity: 'high',
          details: `Exact avatar match with ${profile.display_name || 'Unknown'}`,
          suspectUserId: profile.user_id,
          originalUserId: userId,
        });
      }
    }

    return reports;
  }, []);

  const scanForCopiedPosts = useCallback(async (userId: string): Promise<MimicReport[]> => {
    const reports: MimicReport[] = [];

    // Fetch user's recent posts
    const { data: myPosts } = await supabase
      .from('community_posts')
      .select('content, user_id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (!myPosts || myPosts.length === 0) return reports;

    // Fetch other users' posts
    const { data: otherPosts } = await supabase
      .from('community_posts')
      .select('content, user_id, created_at')
      .neq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(200);

    if (!otherPosts) return reports;

    for (const myPost of myPosts) {
      if (myPost.content.length < 30) continue;
      for (const otherPost of otherPosts) {
        if (otherPost.content.length < 30) continue;
        const similarity = calculateTextSimilarity(myPost.content, otherPost.content);
        if (similarity > 0.75) {
          // Check who posted first
          const myDate = new Date(myPost.created_at);
          const otherDate = new Date(otherPost.created_at);
          if (otherDate > myDate) {
            reports.push({
              type: 'copied_post',
              severity: similarity > 0.9 ? 'high' : 'medium',
              details: `${Math.round(similarity * 100)}% post content match — your post came first`,
              suspectUserId: otherPost.user_id,
              originalUserId: userId,
            });
          }
        }
      }
    }

    return reports;
  }, []);

  const runFullScan = useCallback(async (userId: string) => {
    const [bioReports, postReports] = await Promise.all([
      scanForDuplicateBios(userId),
      scanForCopiedPosts(userId),
    ]);
    
    // Deduplicate by suspect user
    const seen = new Set<string>();
    const allReports = [...bioReports, ...postReports].filter(r => {
      const key = `${r.type}_${r.suspectUserId}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return allReports.sort((a, b) => {
      const sev = { high: 3, medium: 2, low: 1 };
      return sev[b.severity] - sev[a.severity];
    });
  }, [scanForDuplicateBios, scanForCopiedPosts]);

  return { runFullScan, scanForDuplicateBios, scanForCopiedPosts };
}

// Simple text similarity using bigrams (Dice's coefficient)
function calculateTextSimilarity(text1: string, text2: string): number {
  if (!text1 || !text2) return 0;
  const a = text1.toLowerCase().trim();
  const b = text2.toLowerCase().trim();
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;

  const getBigrams = (str: string): Set<string> => {
    const bigrams = new Set<string>();
    for (let i = 0; i < str.length - 1; i++) {
      bigrams.add(str.substring(i, i + 2));
    }
    return bigrams;
  };

  const bigrams1 = getBigrams(a);
  const bigrams2 = getBigrams(b);
  let intersection = 0;
  for (const bg of bigrams1) {
    if (bigrams2.has(bg)) intersection++;
  }
  return (2 * intersection) / (bigrams1.size + bigrams2.size);
}
