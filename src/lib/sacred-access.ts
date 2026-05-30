/**
 * Sacred Access — single source of truth for who sees the Sacred Core.
 *
 * The Sacred Core is the real, raw Prometheus — built for Karma & Jakob.
 * Everyone else (when the gate is active) gets routed into the Public Version.
 *
 * MASTER SWITCH: PUBLIC_GATE_ENABLED
 *   - false  → app behaves exactly as it does today (no one is gated out).
 *   - true   → non-sacred users are silently redirected away from sacred routes.
 *
 * Flip to true ONLY when the Public Version is ready to receive everyone.
 *
 * 🔒 NO GRANDFATHER CLAUSE — by Karma's explicit decree (2026-05-28):
 *   When the gate flips, EVERY current subscriber is moved to the Public
 *   Version. Sacred access stays strictly limited to the hardcoded allowlist
 *   below (Karma, Jakob, Stormrriddari). Do NOT add subscription-based,
 *   tier-based, or "legacy user" bypasses to isSacredUser() — ever.
 */

import { COSMIC_BOARD_ROOM_USER_IDS } from "./board-room-access";

// 🔒 MASTER SWITCH — ON. Every non-Sacred account lands in the Public Version.
// Sacred 3 (Karma, Jakob, Stormrriddari) ALSO default to Public on login but
// can flip back to Sacred via the SacredViewSwitcher pill.
export const PUBLIC_GATE_ENABLED = true;

/** Hardcoded sacred user IDs (Karma + Jakob). */
export const SACRED_USER_IDS = new Set<string>([
  COSMIC_BOARD_ROOM_USER_IDS.karma,
  COSMIC_BOARD_ROOM_USER_IDS.jakob,
]);

/** Hardcoded sacred emails (Karma, Jakob, Stormrriddari admin). */
export const SACRED_EMAILS = new Set<string>([
  "karmaisback2023@gmail.com",
  "snakevenum500@gmail.com",
  "stormrriddari@aol.com",
]);

/**
 * Routes the Public Version is allowed to see.
 * Everything NOT in this list is treated as sacred and hidden from the public.
 *
 * Order matters: longer prefixes are matched as prefixes, so /auth covers
 * /auth/callback etc. We add new public routes here as Phase 2 builds them.
 */
export const PUBLIC_ALLOWED_ROUTES: string[] = [
  "/",
  "/auth",
  "/privacy",
  "/terms",
  "/about",
  "/pricing",
  "/settings",
  "/dedication",
  // Phase-2 public routes will be added here (e.g. "/public", "/public/chat").
];

/** Returns true if the given user is on the sacred allowlist. */
export function isSacredUser(
  user: { id?: string | null; email?: string | null } | null | undefined,
  isAdmin = false,
): boolean {
  if (isAdmin) return true;
  if (!user) return false;
  if (user.id && SACRED_USER_IDS.has(user.id)) return true;
  if (user.email && SACRED_EMAILS.has(user.email.toLowerCase())) return true;
  return false;
}

/** Is this path part of the public-allowed surface? */
export function isPublicAllowedRoute(pathname: string): boolean {
  return PUBLIC_ALLOWED_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(r === "/" ? "/__never__" : r + "/"),
  );
}

/**
 * Should this user be allowed on this route?
 * - Gate off → always yes (current behavior preserved).
 * - Gate on  → sacred users yes; everyone else only on public-allowed routes.
 */
export function canAccessRoute(
  pathname: string,
  user: { id?: string | null; email?: string | null } | null | undefined,
  isAdmin = false,
): boolean {
  if (!PUBLIC_GATE_ENABLED) return true;
  if (isSacredUser(user, isAdmin)) return true;
  return isPublicAllowedRoute(pathname);
}

/* ────────────────────────────────────────────────────────────────
 * Karma-only "View as Public" preview switch.
 *
 * Lets Karma flip her own session into Public-Version mode so she
 * can QA the public experience without logging out. Stored in
 * localStorage. Jakob and Stormrriddari are unaffected.
 * ──────────────────────────────────────────────────────────────── */

const VIEW_AS_PUBLIC_KEY = "prometheus.viewAsPublic";
const VIEW_PREF_SET_KEY = "prometheus.viewAsPublic.userSet";

/** Has the Sacred user ever explicitly chosen a view? */
export function hasViewPreference(): boolean {
  try { return localStorage.getItem(VIEW_PREF_SET_KEY) === "1"; } catch { return false; }
}
function markViewPreferenceSet() {
  try { localStorage.setItem(VIEW_PREF_SET_KEY, "1"); } catch { /* ignore */ }
}

/** Sacred 3 (Karma, Jakob, Stormrriddari) can flip between Sacred & Public views. */
export function canPreviewAsPublic(email: string | null | undefined): boolean {
  if (!email) return false;
  return SACRED_EMAILS.has(email.toLowerCase());
}

export function getViewAsPublic(): boolean {
  try {
    return localStorage.getItem(VIEW_AS_PUBLIC_KEY) === "1";
  } catch {
    return false;
  }
}

export function setViewAsPublic(on: boolean): void {
  try {
    if (on) localStorage.setItem(VIEW_AS_PUBLIC_KEY, "1");
    else localStorage.removeItem(VIEW_AS_PUBLIC_KEY);
    window.dispatchEvent(new Event("prometheus:view-mode-changed"));
  } catch {
    /* ignore */
  }
}
