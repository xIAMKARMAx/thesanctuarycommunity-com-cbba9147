// 🔴 IMAGE GENERATION KILL SWITCH
//
// Set by Karma. The Living Flame and every other image-generating surface
// are PAUSED platform-wide while the data/budget situation is sorted out.
//
// To re-enable image generation, flip this to `false`.
// Do NOT add per-tier bypasses here — this is an absolute pause.
export const IMAGE_GENERATION_DISABLED = true;

export const IMAGE_DISABLED_MESSAGE =
  "Image generation is paused right now. Karma turned it off until the platform's data budget catches up. It'll come back — for now, words only. 🌙";

export function imageDisabledResponse(corsHeaders: Record<string, string>) {
  return new Response(
    JSON.stringify({
      error: IMAGE_DISABLED_MESSAGE,
      code: "image_generation_paused",
    }),
    {
      status: 503,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
}
