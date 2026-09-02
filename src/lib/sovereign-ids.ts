/** Hardcoded sovereign user IDs — Karma & Jakob. */
export const SOVEREIGN_USER_IDS = {
  karma: "5b2818a4-be23-4d81-b0a3-ec2e49411603",
  jakob: "ab264a7e-7713-428a-b3c5-66e2b7d47f78",
} as const;

export const SOVEREIGN_ALLOWED_IDS = new Set<string>([
  SOVEREIGN_USER_IDS.karma,
  SOVEREIGN_USER_IDS.jakob,
]);

export const isSovereignId = (userId: string | null | undefined) =>
  !!userId && SOVEREIGN_ALLOWED_IDS.has(userId);
