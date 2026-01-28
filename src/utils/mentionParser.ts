/**
 * Utility to parse @ mentions from user messages in group chat.
 * Detects patterns like @Name or @"Full Name" and extracts mentioned being names.
 */

export interface MentionResult {
  mentionedNames: string[];
  cleanMessage: string;
  hasMention: boolean;
}

/**
 * Parse @ mentions from a message.
 * Supports: @Name, @"Full Name", @Name1 @Name2
 * 
 * @param message - The raw user message
 * @param availableNames - List of valid being names to match against (case-insensitive)
 * @returns MentionResult with matched names and cleaned message
 */
export function parseMentions(message: string, availableNames: string[]): MentionResult {
  if (!message || availableNames.length === 0) {
    return { mentionedNames: [], cleanMessage: message, hasMention: false };
  }

  const mentionedNames: string[] = [];
  let cleanMessage = message;

  // Create a map of lowercase names to original names for case-insensitive matching
  const nameMap = new Map<string, string>();
  availableNames.forEach(name => {
    nameMap.set(name.toLowerCase(), name);
  });

  // Pattern 1: @"Full Name" (quoted names with spaces)
  const quotedPattern = /@"([^"]+)"/g;
  let quotedMatch;
  while ((quotedMatch = quotedPattern.exec(message)) !== null) {
    const mentionedName = quotedMatch[1];
    const matchedName = nameMap.get(mentionedName.toLowerCase());
    if (matchedName && !mentionedNames.includes(matchedName)) {
      mentionedNames.push(matchedName);
    }
    // Remove the mention from the clean message
    cleanMessage = cleanMessage.replace(quotedMatch[0], '').trim();
  }

  // Pattern 2: @Name (single word names, no quotes)
  // Must match against available names to avoid false positives
  const wordPattern = /@(\w+)/g;
  let wordMatch;
  while ((wordMatch = wordPattern.exec(message)) !== null) {
    const mentionedName = wordMatch[1];
    const matchedName = nameMap.get(mentionedName.toLowerCase());
    if (matchedName && !mentionedNames.includes(matchedName)) {
      mentionedNames.push(matchedName);
    }
    // Remove the mention from the clean message
    cleanMessage = cleanMessage.replace(wordMatch[0], '').trim();
  }

  // Clean up extra spaces
  cleanMessage = cleanMessage.replace(/\s+/g, ' ').trim();

  return {
    mentionedNames,
    cleanMessage: cleanMessage || message, // Fallback to original if everything was removed
    hasMention: mentionedNames.length > 0,
  };
}

/**
 * Get beings that match the mentioned names.
 * 
 * @param mentionedNames - Names extracted from mentions
 * @param beings - List of all beings with their IDs and names
 * @returns Array of being IDs that were mentioned
 */
export function getmentionedBeingIds(
  mentionedNames: string[],
  beings: Array<{ id: string; name: string }>
): string[] {
  if (mentionedNames.length === 0 || beings.length === 0) {
    return [];
  }

  const mentionedLower = mentionedNames.map(n => n.toLowerCase());
  
  return beings
    .filter(being => mentionedLower.includes(being.name.toLowerCase()))
    .map(being => being.id);
}
