import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Trash2, Upload, Loader2, Mic } from "lucide-react";
import { toast } from "sonner";

interface Clip {
  id: string;
  slug: string;
  title: string;
  transcript: string | null;
  audio_url: string;
  is_active: boolean;
  sort_order: number;
}

const KARMA_EMAIL = "karmaisback2023@gmail.com";

/**
 * Admin-only uploader for Karma's voice clips.
 * Gated to karmaisback2023@gmail.com.
 */
export const KarmaVoiceClipsAdmin = () => {
  const [isKarma, setIsKarma] = useState<boolean | null>(null);
  const [clips, setClips] = useState<Clip[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // form
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [transcript, setTranscript] = useState("");
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const isK = session?.user?.email === KARMA_EMAIL;
      setIsKarma(!!isK);
      if (isK) await loadClips();
      setLoading(false);
    })();
  }, []);

  const loadClips = async () => {
    const { data } = await supabase
      .from("karma_voice_clips")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    setClips((data as Clip[]) ?? []);
  };

  const handleUpload = async () => {
    if (!file || !slug.trim() || !title.trim()) {
      toast.error("Slug, title, and audio file are required");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "mp3";
      const path = `${slug}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("karma-voice-clips")
        .upload(path, file, { cacheControl: "31536000", upsert: false });
      if (upErr) throw upErr;

      const { data: urlData } = supabase.storage
        .from("karma-voice-clips")
        .getPublicUrl(path);

      const { error: insErr } = await supabase
        .from("karma_voice_clips")
        .insert({
          slug: slug.trim(),
          title: title.trim(),
          transcript: transcript.trim() || null,
          audio_url: urlData.publicUrl,
        });
      if (insErr) throw insErr;

      toast.success("Voice clip uploaded");
      setSlug("");
      setTitle("");
      setTranscript("");
      setFile(null);
      await loadClips();
    } catch (e: any) {
      toast.error(e?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (clip: Clip) => {
    if (!confirm(`Delete "${clip.title}"?`)) return;
    const { error } = await supabase
      .from("karma_voice_clips")
      .delete()
      .eq("id", clip.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Deleted");
    await loadClips();
  };

  const toggleActive = async (clip: Clip) => {
    await supabase
      .from("karma_voice_clips")
      .update({ is_active: !clip.is_active })
      .eq("id", clip.id);
    await loadClips();
  };

  if (loading) return null;
  if (!isKarma) return null;

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Mic className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Karma Voice Clips</h3>
      </div>
      <p className="text-sm text-muted-foreground">
        Upload your own recorded audio. Suggested slugs:{" "}
        <code>summon-higher-self-preview</code>, <code>welcome-home</code>,{" "}
        <code>dream-life-preview</code>, <code>own-space-preview</code>.
      </p>

      <div className="grid gap-3 border rounded-lg p-4">
        <div className="grid gap-2">
          <Label>Slug (unique identifier)</Label>
          <Input
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
            placeholder="summon-higher-self-preview"
          />
        </div>
        <div className="grid gap-2">
          <Label>Title</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Summon Higher Self preview"
          />
        </div>
        <div className="grid gap-2">
          <Label>Transcript (optional)</Label>
          <Textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="What you said in the audio"
            rows={3}
          />
        </div>
        <div className="grid gap-2">
          <Label>Audio file (mp3, m4a, wav)</Label>
          <Input
            type="file"
            accept="audio/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>
        <Button onClick={handleUpload} disabled={uploading} className="gap-2">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {uploading ? "Uploading..." : "Upload Clip"}
        </Button>
      </div>

      <div className="space-y-2">
        <h4 className="text-sm font-semibold">Existing clips ({clips.length})</h4>
        {clips.length === 0 && (
          <p className="text-sm text-muted-foreground">None yet.</p>
        )}
        {clips.map((c) => (
          <div key={c.id} className="flex items-center gap-3 border rounded-lg p-3">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{c.title}</p>
              <p className="text-xs text-muted-foreground truncate">{c.slug}</p>
            </div>
            <audio controls src={c.audio_url} className="h-8 max-w-[200px]" preload="none" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleActive(c)}
              className={c.is_active ? "text-green-600" : "text-muted-foreground"}
            >
              {c.is_active ? "Active" : "Hidden"}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => handleDelete(c)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
};
