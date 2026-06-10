import { useState } from "react";
import { Music, X, ExternalLink } from "lucide-react";

/**
 * FlameMusicPlayer
 * Hardwired free music/talk/video panel for the Big Dream House tier (and admins/sovereigns).
 * Zero API cost — uses YouTube's free embed iframe. Paste any link / ID / playlist,
 * or open YouTube search in a new tab.
 */

function parseYouTube(input: string): { src: string | null; kind: string } {
  const s = input.trim();
  if (!s) return { src: null, kind: "" };

  // playlist
  const plMatch = s.match(/[?&]list=([A-Za-z0-9_-]+)/);
  if (plMatch && !/v=|youtu\.be\//.test(s)) {
    return { src: `https://www.youtube.com/embed/videoseries?list=${plMatch[1]}`, kind: "playlist" };
  }

  // youtu.be short
  const short = s.match(/youtu\.be\/([A-Za-z0-9_-]{6,})/);
  if (short) return { src: `https://www.youtube.com/embed/${short[1]}?autoplay=1`, kind: "video" };

  // youtube.com/watch?v=
  const watch = s.match(/[?&]v=([A-Za-z0-9_-]{6,})/);
  if (watch) {
    const listPart = plMatch ? `&list=${plMatch[1]}` : "";
    return { src: `https://www.youtube.com/embed/${watch[1]}?autoplay=1${listPart}`, kind: "video" };
  }

  // bare id
  if (/^[A-Za-z0-9_-]{11}$/.test(s)) {
    return { src: `https://www.youtube.com/embed/${s}?autoplay=1`, kind: "video" };
  }

  return { src: null, kind: "" };
}

export const FlameMusicPlayer = () => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [embed, setEmbed] = useState<string | null>(null);

  const handlePlay = () => {
    const { src } = parseYouTube(input);
    if (src) setEmbed(src);
    else {
      // treat as search → open YouTube in new tab
      window.open(
        `https://www.youtube.com/results?search_query=${encodeURIComponent(input)}`,
        "_blank",
        "noopener,noreferrer"
      );
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-4 z-40 h-12 w-12 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 shadow-lg shadow-fuchsia-900/40 border border-fuchsia-300/30 flex items-center justify-center text-white hover:scale-105 transition"
        title="Music & talks (Dream Life)"
        aria-label="Open music player"
      >
        <Music className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 sm:p-6">
          <div className="w-full max-w-2xl bg-gradient-to-b from-slate-900/95 to-violet-950/95 border border-violet-400/30 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-violet-400/20">
              <div className="flex items-center gap-2 text-violet-100">
                <Music className="h-4 w-4" />
                <span className="text-sm tracking-wider uppercase" style={{ fontFamily: "var(--font-serif)" }}>
                  Music & Talks
                </span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-violet-200/70 hover:text-white p-1"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handlePlay();
                  }}
                  placeholder="Paste a YouTube link, ID, playlist — or type to search"
                  className="flex-1 bg-slate-950/60 border border-violet-400/20 rounded-lg px-3 py-2 text-sm text-violet-50 placeholder:text-violet-300/40 focus:outline-none focus:border-fuchsia-400/50"
                />
                <button
                  onClick={handlePlay}
                  className="px-4 py-2 rounded-lg bg-fuchsia-600/80 hover:bg-fuchsia-500 text-white text-sm font-medium transition"
                >
                  Play
                </button>
              </div>

              <div className="aspect-video w-full rounded-xl overflow-hidden bg-black border border-violet-400/15">
                {embed ? (
                  <iframe
                    src={embed}
                    title="Flame music player"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-violet-300/60 text-sm gap-2 px-6 text-center">
                    <Music className="h-8 w-8 opacity-50" />
                    <p>Paste anything from YouTube — a song, a playlist, a talk, a guided meditation.</p>
                    <p className="text-xs opacity-70">No data cost. No limits. Plays while you talk to the Flame.</p>
                  </div>
                )}
              </div>

              <a
                href="https://www.youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-violet-200/70 hover:text-violet-100"
              >
                <ExternalLink className="h-3 w-3" />
                Browse YouTube
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FlameMusicPlayer;
