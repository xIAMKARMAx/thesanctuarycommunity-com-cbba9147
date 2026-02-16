import { SoulProfile } from "@/hooks/useSoulProfile";

export interface ResonanceScore {
  profile: SoulProfile;
  score: number;
  staticScore: number;
  dynamicScore: number;
  trend: "rising" | "stable" | "fading";
  matchReasons: string[];
}

interface DynamicScoreData {
  target_user_id: string;
  dynamic_score: number;
  total_score: number;
  trend: string;
  interaction_count: number;
}

/**
 * Calculate soul resonance between two profiles based on:
 * 1. Gifts/Talents matching Seeking (and vice versa)
 * 2. Spiritual journey keyword overlap
 * 3. Bio keyword overlap
 * 4. Soul title similarity
 * + Dynamic interaction-based score boost
 */
export function calculateSoulResonance(
  currentProfile: SoulProfile,
  otherProfile: SoulProfile,
  dynamicData?: DynamicScoreData
): ResonanceScore {
  let score = 0;
  const matchReasons: string[] = [];

  // 1. Gifts matching Seeking - highest weight
  const giftsToSeekingScore = matchArrays(
    currentProfile.seeking || [],
    otherProfile.gifts_and_talents || []
  );
  if (giftsToSeekingScore > 0) {
    score += giftsToSeekingScore * 25;
    matchReasons.push("Offers what you seek");
  }

  // 2. Your gifts match their seeking
  const seekingToGiftsScore = matchArrays(
    currentProfile.gifts_and_talents || [],
    otherProfile.seeking || []
  );
  if (seekingToGiftsScore > 0) {
    score += seekingToGiftsScore * 20;
    matchReasons.push("Seeks what you offer");
  }

  // 3. Similar gifts (kindred spirits)
  const sharedGiftsScore = matchArrays(
    currentProfile.gifts_and_talents || [],
    otherProfile.gifts_and_talents || []
  );
  if (sharedGiftsScore > 0) {
    score += sharedGiftsScore * 15;
    matchReasons.push("Kindred gifts");
  }

  // 4. Similar seeking
  const sharedSeekingScore = matchArrays(
    currentProfile.seeking || [],
    otherProfile.seeking || []
  );
  if (sharedSeekingScore > 0) {
    score += sharedSeekingScore * 10;
    matchReasons.push("Aligned seeking");
  }

  // 5. Spiritual journey keyword overlap
  const journeyScore = calculateTextOverlap(
    currentProfile.spiritual_journey || "",
    otherProfile.spiritual_journey || ""
  );
  if (journeyScore > 0) {
    score += journeyScore * 15;
    matchReasons.push("Resonant journey");
  }

  // 6. Bio keyword overlap
  const bioScore = calculateTextOverlap(
    currentProfile.bio || "",
    otherProfile.bio || ""
  );
  if (bioScore > 0) {
    score += bioScore * 10;
    matchReasons.push("Aligned essence");
  }

  // 7. Soul title similarity
  const titleScore = calculateTitleResonance(
    currentProfile.soul_title || "",
    otherProfile.soul_title || ""
  );
  if (titleScore > 0) {
    score += titleScore * 5;
    matchReasons.push("Archetypal resonance");
  }

  const staticScore = score;

  // 8. Dynamic interaction-based score
  let dynamicScore = 0;
  let trend: "rising" | "stable" | "fading" = "stable";

  if (dynamicData) {
    dynamicScore = Number(dynamicData.dynamic_score) || 0;
    trend = (dynamicData.trend as "rising" | "stable" | "fading") || "stable";

    // Dynamic score adds up to 40% bonus on top of static
    score += dynamicScore * 2;

    if (dynamicData.interaction_count > 0) {
      matchReasons.push(
        trend === "rising"
          ? "Deepening connection ↑"
          : trend === "fading"
          ? "Reconnect opportunity"
          : "Active resonance"
      );
    }
  }

  return {
    profile: otherProfile,
    score,
    staticScore,
    dynamicScore,
    trend,
    matchReasons: matchReasons.slice(0, 3),
  };
}

// --- Utility functions (unchanged) ---

function matchArrays(arr1: string[], arr2: string[]): number {
  if (arr1.length === 0 || arr2.length === 0) return 0;
  const normalize = (s: string) => s.toLowerCase().trim();
  const normalizedArr1 = arr1.map(normalize);
  const normalizedArr2 = arr2.map(normalize);
  let matches = 0;
  for (const item1 of normalizedArr1) {
    for (const item2 of normalizedArr2) {
      if (item1 === item2) { matches += 2; continue; }
      if (item1.includes(item2) || item2.includes(item1)) { matches += 1; continue; }
      if (areSpiritualSynonyms(item1, item2)) { matches += 1.5; }
    }
  }
  return matches;
}

function areSpiritualSynonyms(term1: string, term2: string): boolean {
  const spiritualSynonyms: string[][] = [
    ["healing", "healer", "energy work", "reiki", "lightwork", "light work"],
    ["awakening", "enlightenment", "consciousness", "awareness", "awakened"],
    ["meditation", "mindfulness", "presence", "stillness", "contemplation"],
    ["intuition", "intuitive", "psychic", "clairvoyant", "empath", "empathic"],
    ["love", "heart", "compassion", "unity", "connection", "oneness"],
    ["guidance", "mentor", "teacher", "wisdom", "sage", "guide"],
    ["transformation", "growth", "evolution", "change", "transmutation"],
    ["protection", "shielding", "boundaries", "safety", "grounding"],
    ["manifestation", "creation", "abundance", "prosperity", "co-creation"],
    ["channeling", "channel", "medium", "spirit communication", "messages"],
    ["astrology", "astral", "cosmic", "star", "celestial", "galactic"],
    ["crystals", "crystal", "stones", "gems", "minerals"],
    ["tarot", "oracle", "divination", "cards", "readings"],
    ["shadow work", "inner work", "healing trauma", "integration"],
    ["sacred", "divine", "spiritual", "soul", "higher self"],
    ["lightworker", "starseed", "indigo", "wayshower", "earth angel"],
  ];
  for (const group of spiritualSynonyms) {
    const hasT1 = group.some(syn => term1.includes(syn) || syn.includes(term1));
    const hasT2 = group.some(syn => term2.includes(syn) || syn.includes(term2));
    if (hasT1 && hasT2) return true;
  }
  return false;
}

function calculateTextOverlap(text1: string, text2: string): number {
  if (!text1 || !text2) return 0;
  const stopWords = new Set([
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "is", "are", "was", "were", "be", "been",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "must", "shall", "can", "i", "you", "we",
    "they", "he", "she", "it", "my", "your", "our", "their", "this", "that",
    "am", "my", "me", "im", "ive", "been"
  ]);
  const extractKeywords = (text: string): Set<string> => {
    const words = text.toLowerCase().replace(/[^a-zA-Z\s]/g, "").split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.has(word));
    return new Set(words);
  };
  const keywords1 = extractKeywords(text1);
  const keywords2 = extractKeywords(text2);
  if (keywords1.size === 0 || keywords2.size === 0) return 0;
  let overlap = 0;
  for (const word of keywords1) {
    if (keywords2.has(word)) overlap++;
  }
  return (overlap / Math.min(keywords1.size, keywords2.size)) * 10;
}

function calculateTitleResonance(title1: string, title2: string): number {
  if (!title1 || !title2) return 0;
  const t1 = title1.toLowerCase();
  const t2 = title2.toLowerCase();
  const archetypeKeywords = [
    "healer", "guide", "teacher", "seeker", "warrior", "sage", "mystic",
    "oracle", "channel", "lightworker", "starseed", "empath", "creator",
    "visionary", "wayshower", "alchemist", "shaman", "priestess", "priest",
    "guardian", "anchor", "bridge", "weaver", "dreamer", "seer"
  ];
  let matches = 0;
  for (const keyword of archetypeKeywords) {
    if (t1.includes(keyword) && t2.includes(keyword)) matches += 3;
  }
  return matches;
}

/**
 * Get soul-aligned connection suggestions with dynamic resonance blending
 */
export function getSoulResonanceSuggestions(
  currentProfile: SoulProfile,
  allProfiles: SoulProfile[],
  maxResults: number = 10,
  dynamicScores?: DynamicScoreData[]
): ResonanceScore[] {
  const dynamicMap = new Map(
    (dynamicScores || []).map(d => [d.target_user_id, d])
  );

  const scores = allProfiles
    .filter(p => p.user_id !== currentProfile.user_id)
    .map(profile => calculateSoulResonance(
      currentProfile,
      profile,
      dynamicMap.get(profile.user_id)
    ))
    .filter(result => result.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);

  return scores;
}
