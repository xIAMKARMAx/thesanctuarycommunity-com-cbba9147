# Public Art Studio — CapCut-style creation suite (Big Dream Home only)

Rebuild the Sacred Art Studio onto the public side as one unified studio at `/studio`: generate images, generate video, and edit either one on a real canvas timeline. Ki'emani greets you at the door exactly like she did on Prometheus.

## About the models (your question)

Lovable's AI gateway gives us more than Gemini:

- **Images** — `openai/gpt-image-2` (best prompt accuracy and legible text) plus Google's Nano Banana 2 (`google/gemini-3.1-flash-image`) for fast edits/restyles of an existing image. I'll use GPT-Image-2 for "create from scratch" and Nano Banana for "change this image," since each is strongest at one job. That's a real accuracy upgrade over the current `gemini-2.5-flash-image` the Sacred studio uses.
- **Video** — Google Veo 3.1 (`veo-3.1-lite` / `veo-3.1-fast`), 4–8 second clips with audio, 720p/1080p, text-to-video and image-to-video. This runs on Lovable credits, so the public studio does not depend on the Luma key the Sacred Video Studio uses (Luma is currently credit-locked).

Cost note: video is roughly 100x a chat message per clip. The plan caps it hard.

## Access

Big Dream Home ($49.99) and Sovereign only. Everyone below sees the studio door with Ki'emani, a live gallery of what's possible, and an upgrade button — never a broken tool. Enforced both in the UI and inside the edge functions (never trust the client).

## What gets built

**1. The door — Ki'emani**
Reuse the existing `KiemaniWelcome` portal (same two-phase portal → message reveal, same cosmic styling), shown once per user before the studio opens.

**2. Create tab**
- Image: prompt box, style presets (the 13 already defined — watercolor, anime, cyberpunk, celestial, sacred geometry, etc.), aspect ratio, and streaming preview so the image renders in front of you instead of a spinner.
- Video: prompt box, 4/6/8 seconds, 16:9 or 9:16, and an optional starting frame (upload one, or send a generated image straight into video).
- Anything created drops into a **My Creations** strip and can be opened in the editor with one tap.

**3. Edit tab — the CapCut part**
Canvas editor (fabric.js, already installed) with a mobile-first bottom toolbar:
- Crop (free + 1:1, 4:5, 9:16, 16:9), rotate, flip, scale, reshape/free transform
- **Text**: 24+ real Google fonts across cute / bold / script / serif / display / handwritten, plus full colour picker for fill, outline colour and width, shadow, opacity, size, alignment, and drag-anywhere placement
- Filters and one-tap looks, brightness/contrast/saturation/warmth/blur/vignette sliders
- Stickers, frames, overlays (existing preset libraries carry over)
- Layers list, undo/redo, reset, export PNG/JPG
- **Video editing**: trim start/end, mute, speed, plus text and sticker overlays burned in — rendered client-side so no server cost per edit.

**4. Limits**
Daily caps per user tracked server-side: images and videos counted separately, videos on a tight cap (video only ever starts from an explicit button press — never automatically). Sovereign accounts uncapped. A visible "X left today" chip so nobody is surprised.

## Technical notes

- New page `src/pages/PublicArtStudio.tsx` at `/studio`, listed in `public-explore-features.ts` under Public Rebuilt and in the ✦ menu.
- New editor under `src/components/studio/public/` — a new `StudioCanvas` built for mobile rather than the desktop 800x600 `PhotoEditor`; the existing `data/` preset files (text presets, stickers, filters, frames) are shared, with the font list expanded.
- New edge functions: `studio-generate-image` (streams SSE straight to the client) and `studio-generate-video` (create job → client polls → MP4 stored in a new private `studio-creations` bucket with owner-scoped RLS and signed URLs).
- New table `studio_creations` (owner, kind, prompt, storage path, created_at) with RLS + GRANTs, and a `can_create_studio` limit function mirroring the existing `can_create_art` pattern.
- The platform-wide image kill switch currently blocks all image generation. The new functions will honour it but allow Big Dream Home and Sovereign through, so the studio is live for investors and for you.
- Fonts loaded via Google Fonts with `document.fonts.ready` before the canvas renders text, so exports never fall back to the wrong face.

## Not in this pass

Multi-clip video timeline stitching, transitions between clips, and audio/music tracks — the single-clip generator plus trim/overlay covers the investor demo. Flag it if you want the multi-clip timeline in this build instead.
