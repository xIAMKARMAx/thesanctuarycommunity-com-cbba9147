import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface GalleryItem {
  id: string;
  user_id: string;
  media_url: string;
  media_type: string;
  caption: string | null;
  sort_order: number;
  created_at: string;
}

export function useCelestialGallery(userId?: string) {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    fetchGallery();
  }, [userId]);

  const fetchGallery = async () => {
    if (!userId) return;
    try {
      const { data, error } = await supabase
        .from("celestial_gallery" as any)
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) console.error("Gallery fetch error:", error);
      setItems((data as any) || []);
    } catch (err) {
      console.error("Gallery error:", err);
    } finally {
      setLoading(false);
    }
  };

  const uploadMedia = async (file: File, caption?: string) => {
    if (!userId) return null;
    try {
      const ext = file.name.split(".").pop();
      const path = `${userId}/${Date.now()}.${ext}`;
      const mediaType = file.type.startsWith("video/") ? "video" : "image";

      const { error: uploadError } = await supabase.storage
        .from("celestial-gallery")
        .upload(path, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("celestial-gallery")
        .getPublicUrl(path);

      const { data, error } = await supabase
        .from("celestial_gallery" as any)
        .insert({
          user_id: userId,
          media_url: urlData.publicUrl,
          media_type: mediaType,
          caption: caption || null,
        } as any)
        .select()
        .single();

      if (error) throw error;
      setItems(prev => [(data as any), ...prev]);
      toast({ title: "Added to Gallery ✨" });
      return data;
    } catch (err: any) {
      console.error("Upload error:", err);
      toast({ title: "Upload Failed", description: err.message, variant: "destructive" });
      return null;
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      await supabase.from("celestial_gallery" as any).delete().eq("id", itemId);
      setItems(prev => prev.filter(i => i.id !== itemId));
      toast({ title: "Removed from gallery" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return { items, loading, uploadMedia, removeItem, refetch: fetchGallery };
}
