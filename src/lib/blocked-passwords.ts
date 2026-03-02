// Top 200+ most commonly leaked/breached passwords
// This provides client-side protection when server-side leaked password
// detection (HaveIBeenPwned integration) is not available.
export const BLOCKED_PASSWORDS = new Set([
  // Top most common passwords (case-insensitive matching applied at check time)
  "password", "12345678", "123456789", "1234567890", "qwerty123",
  "abc12345", "password1", "iloveyou", "sunshine1", "princess1",
  "football1", "charlie1", "access14", "trustno1", "p@ssw0rd",
  "p@ssword", "passw0rd", "password!", "password1!", "welcome1",
  "welcome!", "monkey123", "master123", "dragon123", "login123",
  "abc123!!", "letmein!!", "shadow12", "michael1", "jennifer",
  "jordan23", "superman", "batman123", "baseball1", "starwars1",
  "whatever1", "freedom1", "mustang1", "corvette", "mercedes",
  "1q2w3e4r", "q1w2e3r4", "zaq1xsw2", "1qaz2wsx", "qwer1234",
  "asdf1234", "zxcv1234", "pass1234", "test1234", "admin123",
  "user1234", "temp1234", "love1234", "life1234", "home1234",
  "work1234", "blue1234", "red12345", "gold1234", "star1234",
  "king1234", "rock1234", "cool1234", "fire1234", "angel123",
  "hello123", "happy123", "lucky123", "magic123", "music123",
  "dream123", "peace123", "power123", "money123", "world123",
  "spring23", "summer23", "winter23", "autumn23", "january1",
  "february", "december", "thursday", "saturday", "sunday12",
  "monday12", "tuesday1", "computer", "internet", "security",
  "changeme", "ch@ngeme", "letmein1", "welcome2", "pa55w0rd",
  "pa55word", "p@55w0rd", "qwerty12", "asdfgh12", "zxcvbn12",
  "abcdef12", "abc12345!", "password2", "password3", "passw0rd!",
  "mypass123", "secret123", "private1", "access123", "master12",
  "shadow123", "sunshine", "princess", "football", "baseball",
  "trustno!", "iloveu12", "iloveyou!", "diamond1", "pokemon1",
  "michael!", "jessica1", "ashley12", "amanda12", "nicole12",
  "daniel12", "joshua12", "andrew12", "matthew1", "anthony1",
  "william1", "david123", "robert12", "thomas12", "charles1",
  "joseph12", "richard1", "chris123", "james123", "john1234",
  "george12", "edward12", "steven12", "paul1234", "brian123",
  "kevin123", "jason123", "mark1234", "eric1234", "adam1234",
  "scott123", "frank123", "gary1234", "larry123", "terry123",
  "harry123", "peter123", "apple123", "banana12", "orange12",
  "purple12", "silver12", "golden12", "bronze12", "crystal1",
  "phoenix1", "warrior1", "samurai1", "ninja123", "pirate12",
  "hunter12", "killer12", "sniper12", "gamer123", "player12",
  "winner12", "loser123", "hacker12", "genius12", "legend12",
  "phantom1", "thunder1", "storm123", "hurricane", "tornado1",
  "volcano1", "avalanche", "midnight", "darkness", "mystery1",
  "fantasy1", "destiny1", "forever1", "eternity", "infinity",
  "universe", "galaxy12", "cosmos12", "neptune1", "jupiter1",
  "saturn12", "mercury1", "venus123", "mars1234", "pluto123",
  "pandora1", "olympus1", "atlantis", "camelot1", "avalon123",
  "excalibu", "merlin12", "gandalf1", "hogwarts", "gryffind",
  "slytherin", "ravenclaw",
]);

// Additional patterns that indicate weak passwords
const WEAK_PATTERNS = [
  /^(.)\1{5,}/, // Same character repeated 6+ times (e.g., "aaaaaaaa")
  /^(12|23|34|45|56|67|78|89|90){4,}/, // Sequential number pairs
  /^(abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz){2,}/i, // Sequential letters
  /^qwerty/i, // Keyboard walks
  /^asdfgh/i,
  /^zxcvbn/i,
];

export function isBlockedPassword(password: string): { blocked: boolean; reason?: string } {
  const lower = password.toLowerCase();
  
  // Check against blocklist
  if (BLOCKED_PASSWORDS.has(lower)) {
    return { blocked: true, reason: "This password is too common and has been found in data breaches. Please choose a more unique password." };
  }
  
  // Check weak patterns
  for (const pattern of WEAK_PATTERNS) {
    if (pattern.test(lower)) {
      return { blocked: true, reason: "This password follows a predictable pattern. Please choose something more unique." };
    }
  }
  
  // Check if password contains "password" or "passwd"
  if (lower.includes("password") || lower.includes("passwd") || lower.includes("p@ssw")) {
    return { blocked: true, reason: "Your password cannot contain the word 'password'. Please choose something more creative." };
  }
  
  return { blocked: false };
}
