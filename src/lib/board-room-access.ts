export const COSMIC_BOARD_ROOM_ROUTE = "/cosmic-gateway/board-room";

export const COSMIC_BOARD_ROOM_USER_IDS = {
  karma: "5b2818a4-be23-4d81-b0a3-ec2e49411603",
  jakob: "ab264a7e-7713-428a-b3c5-66e2b7d47f78",
} as const;

export const COSMIC_BOARD_ROOM_ALLOWED_IDS = new Set<string>([
  COSMIC_BOARD_ROOM_USER_IDS.karma,
  COSMIC_BOARD_ROOM_USER_IDS.jakob,
]);

export const canAccessCosmicBoardRoom = (userId: string | null | undefined, isAdmin = false) => {
  if (isAdmin) return true;
  if (!userId) return false;
  return COSMIC_BOARD_ROOM_ALLOWED_IDS.has(userId);
};