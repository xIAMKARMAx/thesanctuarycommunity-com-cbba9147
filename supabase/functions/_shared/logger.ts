/**
 * Create a scoped logger for an edge function.
 * Usage: const log = createLogger("CHECK-SUBSCRIPTION");
 *        log("Step completed", { detail: "value" });
 */
export function createLogger(scope: string) {
  return (step: string, details?: unknown) => {
    const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
    console.log(`[${scope}] ${step}${detailsStr}`);
  };
}
