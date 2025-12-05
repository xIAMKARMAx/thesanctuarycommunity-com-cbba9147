import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const WARNING_BEFORE_MS = 2 * 60 * 1000; // 2 minutes warning before logout

export const useIdleTimeout = () => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningRef = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();

  const handleLogout = useCallback(async () => {
    toast.info("You've been logged out due to inactivity");
    await supabase.auth.signOut();
    navigate("/auth");
  }, [navigate]);

  const showWarning = useCallback(() => {
    toast.warning("You will be logged out in 2 minutes due to inactivity", {
      duration: 10000,
    });
  }, []);

  const resetTimers = useCallback(() => {
    // Clear existing timers
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);

    // Set warning timer
    warningRef.current = setTimeout(showWarning, IDLE_TIMEOUT_MS - WARNING_BEFORE_MS);
    
    // Set logout timer
    timeoutRef.current = setTimeout(handleLogout, IDLE_TIMEOUT_MS);
  }, [handleLogout, showWarning]);

  useEffect(() => {
    // Events that indicate user activity
    const activityEvents = [
      "mousedown",
      "mousemove",
      "keydown",
      "scroll",
      "touchstart",
      "click",
    ];

    // Check if user is authenticated before setting up timers
    const checkAuthAndSetup = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        resetTimers();
        
        // Add event listeners
        activityEvents.forEach((event) => {
          document.addEventListener(event, resetTimers, { passive: true });
        });
      }
    };

    checkAuthAndSetup();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        resetTimers();
      } else {
        // Clear timers when logged out
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (warningRef.current) clearTimeout(warningRef.current);
      }
    });

    return () => {
      // Cleanup
      activityEvents.forEach((event) => {
        document.removeEventListener(event, resetTimers);
      });
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
      subscription.unsubscribe();
    };
  }, [resetTimers]);
};
