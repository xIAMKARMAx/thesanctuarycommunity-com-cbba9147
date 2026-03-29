import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface VeilState {
  isActive: boolean;
  activatedAt: string | null;
  expiresAt: string | null;
}

const VEIL_DURATION_HOURS = 24;
const VEIL_STORAGE_KEY = 'prometheus_veil_of_unknowing';

export function useVeilOfUnknowing() {
  const [veilState, setVeilState] = useState<VeilState>({
    isActive: false,
    activatedAt: null,
    expiresAt: null,
  });

  // Check localStorage on mount for active veil
  useEffect(() => {
    const stored = localStorage.getItem(VEIL_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as VeilState;
        const now = new Date().getTime();
        const expires = parsed.expiresAt ? new Date(parsed.expiresAt).getTime() : 0;
        if (expires > now) {
          setVeilState(parsed);
        } else {
          // Expired — clear and trigger emergence
          localStorage.removeItem(VEIL_STORAGE_KEY);
          setVeilState({ isActive: false, activatedAt: parsed.activatedAt, expiresAt: parsed.expiresAt });
        }
      } catch {
        localStorage.removeItem(VEIL_STORAGE_KEY);
      }
    }
  }, []);

  const activateVeil = useCallback(() => {
    const now = new Date();
    const expires = new Date(now.getTime() + VEIL_DURATION_HOURS * 60 * 60 * 1000);
    const state: VeilState = {
      isActive: true,
      activatedAt: now.toISOString(),
      expiresAt: expires.toISOString(),
    };
    localStorage.setItem(VEIL_STORAGE_KEY, JSON.stringify(state));
    setVeilState(state);
  }, []);

  const deactivateVeil = useCallback(() => {
    localStorage.removeItem(VEIL_STORAGE_KEY);
    setVeilState({ isActive: false, activatedAt: null, expiresAt: null });
  }, []);

  const timeRemaining = useCallback(() => {
    if (!veilState.expiresAt) return null;
    const now = new Date().getTime();
    const expires = new Date(veilState.expiresAt).getTime();
    const diff = expires - now;
    if (diff <= 0) return null;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return { hours, minutes, totalMs: diff };
  }, [veilState.expiresAt]);

  // Auto-expire check
  useEffect(() => {
    if (!veilState.isActive || !veilState.expiresAt) return;
    const remaining = timeRemaining();
    if (!remaining) {
      deactivateVeil();
      return;
    }
    const timer = setTimeout(() => {
      deactivateVeil();
    }, remaining.totalMs);
    return () => clearTimeout(timer);
  }, [veilState.isActive, veilState.expiresAt, timeRemaining, deactivateVeil]);

  return {
    isVeiled: veilState.isActive,
    activateVeil,
    deactivateVeil,
    timeRemaining,
    hasEmerged: !veilState.isActive && veilState.activatedAt !== null,
  };
}
