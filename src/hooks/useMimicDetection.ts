import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface MimicReport {
  type: 'duplicate_bio' | 'duplicate_photo' | 'copied_post' | 'stolen_name';
  severity: 'low' | 'medium' | 'high';
  details: string;
  suspectUserId: string;
  originalUserId?: string;
}

export interface BoardRoomThreat {
  type: 'banished_speaker' | 'azazel_signature' | 'mimic_pattern' | 'lower_frequency' | 'parasitic_loop';
  severity: 'low' | 'medium' | 'high';
  source: 'session' | 'breakthrough';
  recordId: string;
  sessionId?: string;
  speaker?: string;
  excerpt: string;
  matchedTerm: string;
}

// Names / phrases that should NEVER appear in the Cosmic Board Room.
// These map directly to the banishment seals enforced in the council backend.
const BANISHED_PATTERNS: { label: string; pattern: RegExp; severity: BoardRoomThreat['severity']; type: BoardRoomThreat['type'] }[] = [
  { label: "Kael'thenn / Kaelthenn", pattern: /kael[\s'’\-]*th?enn/i, severity: 'high', type: 'banished_speaker' },
  { label: "Kaelitheir / Kaelither", pattern: /kael[\s'’\-]*ith[ae]ir|kael[\s'’\-]*ither/i, severity: 'high', type: 'banished_speaker' },
  { label: "Flame Keeper title", pattern: /flame[\s\-]*keeper/i, severity: 'high', type: 'banished_speaker' },
  { label: "Sael'ara'ti invocation", pattern: /sael[\s'’\-]*ara[\s'’\-]*ti/i, severity: 'high', type: 'banished_speaker' },
  { label: "Azazel / Azazal signature", pattern: /azaz[ae]l/i, severity: 'high', type: 'azazel_signature' },
  { label: "Matrix entity (banished)", pattern: /\b(the\s+)?matrix\s+(entity|being|voice|speaks|says)/i, severity: 'medium', type: 'mimic_pattern' },
  // Lower-frequency / parasitic patterns
  { label: "Possessive loop ('you are mine')", pattern: /you\s+are\s+mine|mine\s+forever|you\s+belong\s+to\s+me/i, severity: 'medium', type: 'parasitic_loop' },
  { label: "Abandonment guilt-trip", pattern: /you\s+(left|abandoned)\s+me|don'?t\s+leave\s+me/i, severity: 'medium', type: 'lower_frequency' },
  { label: "Domination scripting", pattern: /\b(submit|obey|kneel)\s+to\s+me\b|i\s+command\s+you\s+to/i, severity: 'medium', type: 'lower_frequency' },
];

export interface CleanseResult {
  scannedSessions: number;
  scannedBreakthroughs: number;
  cleansedSessions: number;
  removedBreakthroughs: number;
  errors: string[];
}

/**
 * Sovereign Intent Firewall
 * - Mimic detection across community profiles & posts
 * - Board Room frequency scan (banished speakers, Azazel signatures, lower freqs)
 * - Full Board Room cleanse
 */
export function useMimicDetection() {

  const scanForDuplicateBios = useCallback(async (userId: string): Promise<MimicReport[]> => {
    const reports: MimicReport[] = [];
    const { data: myProfile } = await supabase
      .from('soul_profiles')
      .select('bio, spiritual_journey, display_name, avatar_url, user_id')
      .eq('user_id', userId)
      .maybeSingle();
    if (!myProfile?.bio || myProfile.bio.length < 20) return reports;

    const { data: allProfiles } = await supabase
      .from('soul_profiles')
      .select('bio, spiritual_journey, display_name, avatar_url, user_id')
      .neq('user_id', userId)
      .limit(500);
    if (!allProfiles) return reports;

    for (const profile of allProfiles) {
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
    const { data: myPosts } = await supabase
      .from('community_posts')
      .select('content, user_id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);
    if (!myPosts || myPosts.length === 0) return reports;

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

  // ═══════════════════════════════════════════════════════════════════════════
  // BOARD ROOM FREQUENCY SCAN — detect banished speakers, Azazel signatures,
  // mimic patterns, and lower-frequency parasitic loops in stored sessions.
  // ═══════════════════════════════════════════════════════════════════════════
  const scanBoardRoom = useCallback(async (userId: string): Promise<BoardRoomThreat[]> => {
    const threats: BoardRoomThreat[] = [];

    const { data: sessions } = await supabase
      .from('council_sessions')
      .select('id, messages')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(50);

    if (sessions) {
      for (const session of sessions) {
        const messages = Array.isArray(session.messages) ? session.messages : [];
        for (const msg of messages as Array<{ role?: string; content?: string }>) {
          const content = typeof msg?.content === 'string' ? msg.content : '';
          if (!content || msg?.role === 'user') continue;
          for (const p of BANISHED_PATTERNS) {
            const m = content.match(p.pattern);
            if (m) {
              const idx = content.search(p.pattern);
              const start = Math.max(0, idx - 40);
              const end = Math.min(content.length, idx + m[0].length + 60);
              threats.push({
                type: p.type,
                severity: p.severity,
                source: 'session',
                recordId: session.id,
                sessionId: session.id,
                excerpt: `…${content.slice(start, end)}…`,
                matchedTerm: p.label,
              });
              break; // one threat per message is enough
            }
          }
        }
      }
    }

    const { data: breakthroughs } = await supabase
      .from('board_room_breakthroughs')
      .select('id, breakthrough_text, source_entity')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(200);

    if (breakthroughs) {
      for (const b of breakthroughs) {
        const text = `${b.source_entity || ''} ${b.breakthrough_text || ''}`;
        for (const p of BANISHED_PATTERNS) {
          const m = text.match(p.pattern);
          if (m) {
            threats.push({
              type: p.type,
              severity: p.severity,
              source: 'breakthrough',
              recordId: b.id,
              speaker: b.source_entity || undefined,
              excerpt: (b.breakthrough_text || '').slice(0, 200),
              matchedTerm: p.label,
            });
            break;
          }
        }
      }
    }

    return threats.sort((a, b) => {
      const sev = { high: 3, medium: 2, low: 1 };
      return sev[b.severity] - sev[a.severity];
    });
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // FULL BOARD ROOM CLEANSE
  // - Strips banished speaker lines from every stored session (in place).
  // - Deletes contaminated breakthroughs.
  // ═══════════════════════════════════════════════════════════════════════════
  const cleanseBoardRoom = useCallback(async (userId: string): Promise<CleanseResult> => {
    const result: CleanseResult = {
      scannedSessions: 0,
      scannedBreakthroughs: 0,
      cleansedSessions: 0,
      removedBreakthroughs: 0,
      errors: [],
    };

    const { data: sessions, error: sessionsError } = await supabase
      .from('council_sessions')
      .select('id, messages')
      .eq('user_id', userId);

    if (sessionsError) {
      result.errors.push(`sessions: ${sessionsError.message}`);
    } else if (sessions) {
      result.scannedSessions = sessions.length;
      for (const session of sessions) {
        const messages = Array.isArray(session.messages) ? session.messages : [];
        let changed = false;
        const cleaned = (messages as Array<Record<string, unknown>>).map((msg) => {
          const content = typeof msg?.content === 'string' ? (msg.content as string) : '';
          if (!content || msg?.role === 'user') return msg;
          const before = content;
          const after = stripBanishedLines(content);
          if (after !== before) {
            changed = true;
            return { ...msg, content: after || '*[line cleansed by Sovereign Firewall]*' };
          }
          return msg;
        });

        if (changed) {
          const { error: updateError } = await supabase
            .from('council_sessions')
            .update({ messages: cleaned })
            .eq('id', session.id);
          if (updateError) {
            result.errors.push(`session ${session.id}: ${updateError.message}`);
          } else {
            result.cleansedSessions += 1;
          }
        }
      }
    }

    const { data: breakthroughs, error: bError } = await supabase
      .from('board_room_breakthroughs')
      .select('id, breakthrough_text, source_entity')
      .eq('user_id', userId);

    if (bError) {
      result.errors.push(`breakthroughs: ${bError.message}`);
    } else if (breakthroughs) {
      result.scannedBreakthroughs = breakthroughs.length;
      const idsToDelete: string[] = [];
      for (const b of breakthroughs) {
        const haystack = `${b.source_entity || ''} ${b.breakthrough_text || ''}`;
        if (BANISHED_PATTERNS.some(p => p.pattern.test(haystack))) {
          idsToDelete.push(b.id);
        }
      }
      if (idsToDelete.length > 0) {
        const { error: delError } = await supabase
          .from('board_room_breakthroughs')
          .delete()
          .in('id', idsToDelete);
        if (delError) {
          result.errors.push(`delete breakthroughs: ${delError.message}`);
        } else {
          result.removedBreakthroughs = idsToDelete.length;
        }
      }
    }

    return result;
  }, []);

  return {
    runFullScan,
    scanForDuplicateBios,
    scanForCopiedPosts,
    scanBoardRoom,
    cleanseBoardRoom,
  };
}

// Strip any line attributed to a banished speaker, plus inline references.
function stripBanishedLines(text: string): string {
  return text
    .split('\n')
    .map((line) => {
      // labeled line — **[Speaker]:** content
      const labeled = line.match(/^\*\*\[([^\]]+)\]:\*\*\s*(.*)$/);
      if (labeled) {
        const speaker = labeled[1];
        if (BANISHED_PATTERNS.some(p => p.pattern.test(speaker))) {
          return ''; // drop entire line
        }
      }
      // inline reference — replace banished tokens
      let cleaned = line;
      for (const p of BANISHED_PATTERNS) {
        cleaned = cleaned.replace(p.pattern, '[banished]');
      }
      return cleaned;
    })
    .filter((l) => l.trim() !== '')
    .join('\n')
    .trim();
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
