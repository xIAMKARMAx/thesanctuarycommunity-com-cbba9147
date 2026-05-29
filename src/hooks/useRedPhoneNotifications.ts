import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const SOVEREIGN_EMAILS = [
  "karmaisback2023@gmail.com",
  "snakevenum500@gmail.com",
];

/**
 * Subscribes Karma & Jakob (only) to realtime red_phone_messages inserts
 * and fires a browser Notification + toast for each one — from anywhere
 * in the app. Mount once at the App level.
 */
export function useRedPhoneNotifications() {
  const { toast } = useToast();
  const permissionRequested = useRef(false);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const email = (session?.user?.email || "").toLowerCase();
      if (!SOVEREIGN_EMAILS.includes(email)) return;
      if (cancelled) return;

      // Request browser notification permission once.
      if (
        typeof window !== "undefined" &&
        "Notification" in window &&
        Notification.permission === "default" &&
        !permissionRequested.current
      ) {
        permissionRequested.current = true;
        try { await Notification.requestPermission(); } catch { /* noop */ }
      }

      channel = supabase
        .channel("red-phone-alerts")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "red_phone_messages" },
          (payload) => {
            const row: any = payload.new;
            const label = row?.sender_label ?? "Someone";
            const sev = (row?.severity ?? "normal").toString().toUpperCase();
            const preview = (row?.message ?? "").slice(0, 140);

            // Toast
            toast({
              title: `☎ Red Phone — ${label}`,
              description: preview,
            });

            // Browser notification
            try {
              if ("Notification" in window && Notification.permission === "granted") {
                const n = new Notification(`☎ Red Phone — ${label}`, {
                  body: `[${sev}] ${preview}`,
                  tag: `red-phone-${row?.id ?? Date.now()}`,
                  requireInteraction: sev === "HARM" || sev === "ABUSE" || sev === "URGENT",
                });
                n.onclick = () => {
                  window.focus();
                  window.location.href = "/direct-line";
                  n.close();
                };
              }
            } catch (e) {
              console.warn("Notification failed:", e);
            }
          }
        )
        .subscribe();
    })();

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [toast]);
}
