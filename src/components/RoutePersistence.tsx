import { useRoutePersistence, useRestoreRoute } from "@/hooks/useRoutePersistence";

export function RoutePersistence() {
  useRoutePersistence();
  useRestoreRoute();
  return null;
}
