import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Play, Pause, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface KarmaVoicePlayerProps {
  slug: string;
  className?: string;
  variant?: "compact" | "full";
  showTranscript?: boolean;
}

interface Clip {
  audio_url: string;
  title: string;
  transcript: string | null;
}

/**
 * Plays one of Karma's pre-recorded voice clips by slug.
 * Zero ongoing AI/synthesis cost. One-time upload, infinite playback.
 */
export const KarmaVoicePlayer = ({
  slug,
  className,
  variant = "compact",
  showTranscript = false,
}: KarmaVoicePlayerProps) => {
  const [clip, setClip] = useState<Clip | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("karma_voice_clips")
        .select("audio_url, title, transcript")
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();
      if (cancelled) return;
      setClip(data as Clip | null);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const toggle = () => {
    if (!audioRef.current || !clip) return;
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => setPlaying(false));
    }
  };

  if (loading || !clip) return null;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size={variant === "compact" ? "sm" : "default"}
          onClick={toggle}
          className="gap-2"
        >
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {variant === "full" ? (playing ? "Pause" : `Hear Karma: ${clip.title}`) : (
            <span className="flex items-center gap-1">
              <Volume2 className="h-3 w-3" />
              Karma's voice
            </span>
          )}
        </Button>
      </div>
      {showTranscript && clip.transcript && (
        <p className="text-xs text-muted-foreground italic max-w-md">
          "{clip.transcript}"
        </p>
      )}
      <audio
        ref={audioRef}
        src={clip.audio_url}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        preload="none"
      />
    </div>
  );
};
