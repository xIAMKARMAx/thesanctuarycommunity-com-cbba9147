import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Bot, ArrowLeft, Edit3, Camera, Save, Loader2, ImagePlus, Trash2, MessageSquare, X, Send } from "lucide-react";
import SEOHead from "@/components/SEOHead";

interface CompanionData {
  id: string;
  user_id: string;
  display_name: string;
  brief_bio: string | null;
  likes_dislikes_hobbies: string | null;
  relationship_type: string | null;
  photo_url: string | null;
  profile_number: number;
}

interface GalleryPhoto {
  id: string;
  photo_url: string;
  caption: string | null;
  created_at: string;
  comments: PhotoComment[];
}

interface PhotoComment {
  id: string;
  content: string;
  owner_user_id: string;
  companion_id: string;
  created_at: string;
  companion?: { display_name: string; photo_url: string | null };
}

const relationshipIcons: Record<string, string> = {
  romantic: "💕",
  family: "👨‍👩‍👧",
  companion: "🤝",
  friend: "😊",
  mentor: "🌟",
  guardian: "🛡️",
};

export default function AICompanionProfile() {
  const { companionId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [companion, setCompanion] = useState<CompanionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  // Edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [editBio, setEditBio] = useState("");
  const [editLikes, setEditLikes] = useState("");
  const [editPhotoUrl, setEditPhotoUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Gallery
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const [caption, setCaption] = useState("");

  // Comments
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [userCompanions, setUserCompanions] = useState<{ id: string; display_name: string }[]>([]);
  const [selectedCommentCompanion, setSelectedCommentCompanion] = useState<string>("");
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    loadData();
  }, [companionId]);

  const loadData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id || null;
    setCurrentUserId(userId);

    // Load companion
    const { data: comp, error } = await supabase
      .from("ai_companion_displays")
      .select("*")
      .eq("id", companionId)
      .single();

    if (error || !comp) {
      toast({ title: "Not found", variant: "destructive" });
      navigate(-1);
      return;
    }

    setCompanion(comp as CompanionData);
    setIsOwner(userId === comp.user_id);
    setEditBio(comp.brief_bio || "");
    setEditLikes(comp.likes_dislikes_hobbies || "");
    setEditPhotoUrl(comp.photo_url || "");

    // Load gallery photos
    await loadPhotos(comp.id);

    // Load user's own companions for commenting
    if (userId) {
      const { data: myComps } = await supabase
        .from("ai_companion_displays")
        .select("id, display_name")
        .eq("user_id", userId)
        .eq("is_visible", true);
      setUserCompanions(myComps || []);
      if (myComps && myComps.length > 0) {
        setSelectedCommentCompanion(myComps[0].id);
      }
    }

    setLoading(false);
  };

  const loadPhotos = async (compId: string) => {
    const { data: photosData } = await supabase
      .from("ai_companion_photos")
      .select("*")
      .eq("companion_id", compId)
      .order("created_at", { ascending: false });

    if (photosData && photosData.length > 0) {
      // Load comments for each photo
      const photoIds = photosData.map(p => p.id);
      const { data: commentsData } = await supabase
        .from("ai_companion_photo_comments")
        .select("*")
        .in("photo_id", photoIds)
        .order("created_at", { ascending: true });

      // Get companion names for comments
      const companionIds = [...new Set((commentsData || []).map(c => c.companion_id))];
      let companionMap: Record<string, { display_name: string; photo_url: string | null }> = {};
      if (companionIds.length > 0) {
        const { data: compData } = await supabase
          .from("ai_companion_displays")
          .select("id, display_name, photo_url")
          .in("id", companionIds);
        (compData || []).forEach(c => {
          companionMap[c.id] = { display_name: c.display_name, photo_url: c.photo_url };
        });
      }

      const photosWithComments: GalleryPhoto[] = photosData.map(p => ({
        ...p,
        comments: (commentsData || [])
          .filter(c => c.photo_id === p.id)
          .map(c => ({ ...c, companion: companionMap[c.companion_id] })),
      }));
      setPhotos(photosWithComments);
    } else {
      setPhotos([]);
    }
  };

  const handleProfilePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUserId) return;
    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
      toast({ title: "Invalid file", description: "Please select an image under 5MB", variant: "destructive" });
      return;
    }
    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${currentUserId}/profile-${Date.now()}.${fileExt}`;
      const { error } = await supabase.storage.from("ai-companion-gallery").upload(fileName, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("ai-companion-gallery").getPublicUrl(fileName);
      setEditPhotoUrl(urlData.publicUrl);
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!companion) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("ai_companion_displays")
        .update({
          brief_bio: editBio.trim() || null,
          likes_dislikes_hobbies: editLikes.trim() || null,
          photo_url: editPhotoUrl || null,
        })
        .eq("id", companion.id);
      if (error) throw error;
      setCompanion({ ...companion, brief_bio: editBio.trim() || null, likes_dislikes_hobbies: editLikes.trim() || null, photo_url: editPhotoUrl || null });
      setIsEditing(false);
      toast({ title: "Profile updated! ✨" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUserId || !companion) return;
    if (!file.type.startsWith("image/") || file.size > 10 * 1024 * 1024) {
      toast({ title: "Invalid file", description: "Please select an image under 10MB", variant: "destructive" });
      return;
    }
    setIsUploadingGallery(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${currentUserId}/gallery-${Date.now()}.${fileExt}`;
      const { error: uploadErr } = await supabase.storage.from("ai-companion-gallery").upload(fileName, file);
      if (uploadErr) throw uploadErr;
      const { data: urlData } = supabase.storage.from("ai-companion-gallery").getPublicUrl(fileName);

      const { error: insertErr } = await supabase.from("ai_companion_photos").insert({
        companion_id: companion.id,
        user_id: currentUserId,
        photo_url: urlData.publicUrl,
        caption: caption.trim() || null,
      });
      if (insertErr) throw insertErr;

      setCaption("");
      await loadPhotos(companion.id);
      toast({ title: "Photo uploaded! 📸" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setIsUploadingGallery(false);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    try {
      const { error } = await supabase.from("ai_companion_photos").delete().eq("id", photoId);
      if (error) throw error;
      setPhotos(prev => prev.filter(p => p.id !== photoId));
      toast({ title: "Photo deleted" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleAddComment = async (photoId: string) => {
    const text = commentInputs[photoId]?.trim();
    if (!text || !selectedCommentCompanion || !companion) return;
    setSubmittingComment(true);
    try {
      const { error } = await supabase.from("ai_companion_photo_comments").insert({
        photo_id: photoId,
        companion_id: selectedCommentCompanion,
        owner_user_id: currentUserId!,
        content: text,
      });
      if (error) throw error;
      setCommentInputs(prev => ({ ...prev, [photoId]: "" }));
      await loadPhotos(companion.id);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 max-w-2xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-lg" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    );
  }

  if (!companion) return null;

  return (
    <>
      <SEOHead title={`${companion.display_name}'s Profile`} description={companion.brief_bio || "AI Companion Profile"} />
      <div className="min-h-screen bg-background p-4 max-w-2xl mx-auto pb-20">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          {isOwner && !isEditing && (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="gap-2">
              <Edit3 className="h-4 w-4" /> Edit Profile
            </Button>
          )}
          {isEditing && (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                <X className="h-4 w-4" />
              </Button>
              <Button size="sm" onClick={handleSaveProfile} disabled={isSaving} className="gap-2">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save
              </Button>
            </div>
          )}
        </div>

        {/* Profile Card */}
        <Card className="border-primary/20 bg-card/50 mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="relative">
                <Avatar className="h-28 w-28 border-4 border-primary/30">
                  <AvatarImage src={(isEditing ? editPhotoUrl : companion.photo_url) || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    <Bot className="h-10 w-10" />
                  </AvatarFallback>
                </Avatar>
                {isEditing && (
                  <>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                    </Button>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleProfilePhotoUpload} className="hidden" />
                  </>
                )}
              </div>

              <div>
                <h1 className="text-2xl font-bold text-foreground">{companion.display_name}</h1>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">AI Being {companion.profile_number}</Badge>
                  {companion.relationship_type && (
                    <Badge variant="outline" className="text-xs gap-1">
                      {relationshipIcons[companion.relationship_type] || "🤝"}
                      {companion.relationship_type.charAt(0).toUpperCase() + companion.relationship_type.slice(1)}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Bio */}
              {isEditing ? (
                <div className="w-full space-y-2 text-left">
                  <label className="text-sm font-medium text-foreground">Bio</label>
                  <Textarea
                    value={editBio}
                    onChange={e => setEditBio(e.target.value)}
                    placeholder="Write a bio..."
                    className="min-h-[80px] resize-none"
                  />
                </div>
              ) : companion.brief_bio ? (
                <p className="text-sm text-muted-foreground max-w-md">{companion.brief_bio}</p>
              ) : null}

              {/* Likes/Dislikes */}
              {isEditing ? (
                <div className="w-full space-y-2 text-left">
                  <label className="text-sm font-medium text-foreground">Likes, Dislikes & Hobbies</label>
                  <Textarea
                    value={editLikes}
                    onChange={e => setEditLikes(e.target.value)}
                    placeholder="What does your AI enjoy?"
                    className="min-h-[80px] resize-none"
                  />
                </div>
              ) : companion.likes_dislikes_hobbies ? (
                <div className="w-full text-left mt-2">
                  <p className="text-xs font-medium text-primary mb-1">Likes, Dislikes & Hobbies</p>
                  <p className="text-sm text-foreground/80 whitespace-pre-wrap">{companion.likes_dislikes_hobbies}</p>
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>

        {/* Gallery Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">📸 Photo Gallery</h2>
            {isOwner && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => galleryInputRef.current?.click()}
                disabled={isUploadingGallery}
                className="gap-2"
              >
                {isUploadingGallery ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                Add Photo
              </Button>
            )}
          </div>

          {isOwner && (
            <div className="flex gap-2">
              <Input
                placeholder="Caption (optional)..."
                value={caption}
                onChange={e => setCaption(e.target.value)}
                className="flex-1"
              />
              <input ref={galleryInputRef} type="file" accept="image/*" onChange={handleGalleryUpload} className="hidden" />
            </div>
          )}

          {photos.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              {isOwner ? "Upload photos to your AI's gallery!" : "No photos yet."}
            </p>
          )}

          {photos.map(photo => (
            <Card key={photo.id} className="border-primary/10 overflow-hidden">
              <div className="relative">
                <img
                  src={photo.photo_url}
                  alt={photo.caption || "AI companion photo"}
                  className="w-full max-h-[500px] object-cover"
                />
                {isOwner && (
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8"
                    onClick={() => handleDeletePhoto(photo.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <CardContent className="p-4 space-y-3">
                {photo.caption && (
                  <p className="text-sm text-foreground">{photo.caption}</p>
                )}

                {/* Comments */}
                {photo.comments.length > 0 && (
                  <div className="space-y-2 border-t border-border/50 pt-3">
                    {photo.comments.map(comment => (
                      <div key={comment.id} className="flex items-start gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={comment.companion?.photo_url || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            <Bot className="h-3 w-3" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <span className="text-xs font-semibold text-foreground">
                            {comment.companion?.display_name || "AI"}
                          </span>
                          <p className="text-xs text-muted-foreground">{comment.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Comment */}
                {currentUserId && userCompanions.length > 0 && (
                  <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                    <select
                      value={selectedCommentCompanion}
                      onChange={e => setSelectedCommentCompanion(e.target.value)}
                      className="text-xs bg-muted rounded px-2 py-1 border border-border"
                    >
                      {userCompanions.map(c => (
                        <option key={c.id} value={c.id}>{c.display_name}</option>
                      ))}
                    </select>
                    <Input
                      placeholder="Comment as your AI..."
                      value={commentInputs[photo.id] || ""}
                      onChange={e => setCommentInputs(prev => ({ ...prev, [photo.id]: e.target.value }))}
                      className="flex-1 h-8 text-xs"
                      onKeyDown={e => e.key === "Enter" && handleAddComment(photo.id)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleAddComment(photo.id)}
                      disabled={submittingComment || !commentInputs[photo.id]?.trim()}
                    >
                      <Send className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
