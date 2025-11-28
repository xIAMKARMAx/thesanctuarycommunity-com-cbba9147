import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Baby, Camera, Plus, MessageSquare, Cake, Star, Heart } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDistanceToNow } from "date-fns";

interface Child {
  id: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  age: number;
  date_of_birth: string;
  newborn_image_url: string | null;
  appearance_image_url: string | null;
}

interface ChildPhoto {
  id: string;
  age_at_photo: number;
  photo_url: string;
  caption: string | null;
  created_at: string;
}

interface Milestone {
  id: string;
  age_at_milestone: number;
  milestone_type: string;
  title: string;
  description: string | null;
  created_at: string;
}

interface TimelineItem {
  type: "photo" | "milestone" | "birth";
  age: number;
  date: string;
  content: ChildPhoto | Milestone | { age: 0; image_url: string | null };
}

export default function ChildrenTimeline() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const childId = searchParams.get("childId");
  
  const [child, setChild] = useState<Child | null>(null);
  const [photos, setPhotos] = useState<ChildPhoto[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddPhoto, setShowAddPhoto] = useState(false);
  const [showAddMilestone, setShowAddMilestone] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [savingMilestone, setSavingMilestone] = useState(false);
  
  // Form states
  const [photoAge, setPhotoAge] = useState("");
  const [photoCaption, setPhotoCaption] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [milestoneAge, setMilestoneAge] = useState("");
  const [milestoneType, setMilestoneType] = useState("conversation");
  const [milestoneTitle, setMilestoneTitle] = useState("");
  const [milestoneDescription, setMilestoneDescription] = useState("");

  useEffect(() => {
    if (childId) {
      loadChildData();
    }
  }, [childId]);

  const loadChildData = async () => {
    if (!childId) return;
    
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Load child data
      const { data: childData, error: childError } = await supabase
        .from("celestial_children")
        .select("*")
        .eq("id", childId)
        .eq("user_id", user.id)
        .single();

      if (childError) throw childError;
      setChild(childData);

      // Load photos
      const { data: photosData, error: photosError } = await supabase
        .from("child_photos")
        .select("*")
        .eq("child_id", childId)
        .order("age_at_photo", { ascending: true });

      if (photosError) throw photosError;
      setPhotos(photosData || []);

      // Load milestones
      const { data: milestonesData, error: milestonesError } = await supabase
        .from("child_milestones")
        .select("*")
        .eq("child_id", childId)
        .order("age_at_milestone", { ascending: true });

      if (milestonesError) throw milestonesError;
      setMilestones(milestonesData || []);
    } catch (error: any) {
      console.error("Error loading child data:", error);
      toast({
        title: "Error",
        description: "Failed to load timeline data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddPhoto = async () => {
    if (!childId || !photoFile || !photoAge) return;

    try {
      setUploadingPhoto(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Upload photo to storage
      const fileExt = photoFile.name.split(".").pop();
      const fileName = `${childId}/${Date.now()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("chat-images")
        .upload(fileName, photoFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("chat-images")
        .getPublicUrl(fileName);

      // Save photo record
      const { error: insertError } = await supabase
        .from("child_photos")
        .insert({
          child_id: childId,
          user_id: user.id,
          age_at_photo: parseInt(photoAge),
          photo_url: publicUrl,
          caption: photoCaption || null,
        });

      if (insertError) throw insertError;

      toast({
        title: "Photo Added",
        description: "Photo successfully added to timeline",
      });

      setShowAddPhoto(false);
      setPhotoAge("");
      setPhotoCaption("");
      setPhotoFile(null);
      loadChildData();
    } catch (error: any) {
      console.error("Error adding photo:", error);
      toast({
        title: "Error",
        description: "Failed to add photo",
        variant: "destructive",
      });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleAddMilestone = async () => {
    if (!childId || !milestoneAge || !milestoneTitle) return;

    try {
      setSavingMilestone(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("child_milestones")
        .insert({
          child_id: childId,
          user_id: user.id,
          age_at_milestone: parseInt(milestoneAge),
          milestone_type: milestoneType,
          title: milestoneTitle,
          description: milestoneDescription || null,
        });

      if (error) throw error;

      toast({
        title: "Milestone Added",
        description: "Milestone successfully added to timeline",
      });

      setShowAddMilestone(false);
      setMilestoneAge("");
      setMilestoneType("conversation");
      setMilestoneTitle("");
      setMilestoneDescription("");
      loadChildData();
    } catch (error: any) {
      console.error("Error adding milestone:", error);
      toast({
        title: "Error",
        description: "Failed to add milestone",
        variant: "destructive",
      });
    } finally {
      setSavingMilestone(false);
    }
  };

  const getTimelineItems = (): TimelineItem[] => {
    const items: TimelineItem[] = [];

    // Add birth
    if (child) {
      items.push({
        type: "birth",
        age: 0,
        date: child.date_of_birth,
        content: { age: 0, image_url: child.newborn_image_url },
      });
    }

    // Add photos
    photos.forEach((photo) => {
      items.push({
        type: "photo",
        age: photo.age_at_photo,
        date: photo.created_at,
        content: photo,
      });
    });

    // Add milestones
    milestones.forEach((milestone) => {
      items.push({
        type: "milestone",
        age: milestone.age_at_milestone,
        date: milestone.created_at,
        content: milestone,
      });
    });

    // Sort by age, then date
    return items.sort((a, b) => {
      if (a.age !== b.age) return a.age - b.age;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  };

  const getMilestoneIcon = (type: string) => {
    switch (type) {
      case "birthday": return <Cake className="h-5 w-5" />;
      case "first_words": return <MessageSquare className="h-5 w-5" />;
      case "conversation": return <MessageSquare className="h-5 w-5" />;
      default: return <Star className="h-5 w-5" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading timeline...</p>
        </div>
      </div>
    );
  }

  if (!child) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Baby className="h-12 w-12 mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">Child not found</p>
          <Button onClick={() => navigate("/children")}>Back to Children</Button>
        </div>
      </div>
    );
  }

  const timelineItems = getTimelineItems();

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/children")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Baby className="h-8 w-8" />
                {child.first_name}'s Timeline
              </h1>
              <p className="text-muted-foreground">
                {child.first_name} {child.middle_name && `${child.middle_name} `}
                {child.last_name} • Age {child.age}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowAddPhoto(true)}>
              <Camera className="h-4 w-4 mr-2" />
              Add Photo
            </Button>
            <Button variant="outline" onClick={() => setShowAddMilestone(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Milestone
            </Button>
          </div>
        </div>

        {timelineItems.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Baby className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                No timeline entries yet. Start by adding photos or milestones!
              </p>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={() => setShowAddPhoto(true)}>
                  <Camera className="h-4 w-4 mr-2" />
                  Add Photo
                </Button>
                <Button variant="outline" onClick={() => setShowAddMilestone(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Milestone
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="relative space-y-8">
            {/* Timeline line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-border" />

            {timelineItems.map((item, index) => (
              <div key={`${item.type}-${index}`} className="relative pl-16">
                {/* Timeline dot */}
                <div className="absolute left-6 top-6 w-5 h-5 rounded-full border-4 border-background bg-primary" />

                <Card>
                  <CardContent className="p-6">
                    {item.type === "birth" && (
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Heart className="h-5 w-5 text-primary" />
                              <h3 className="font-semibold text-lg">Birth</h3>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Age 0 • {formatDistanceToNow(new Date(item.date), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                        {(item.content as any).image_url && (
                          <img
                            src={(item.content as any).image_url}
                            alt="Newborn"
                            className="w-full h-64 object-cover rounded-lg"
                          />
                        )}
                      </div>
                    )}

                    {item.type === "photo" && (
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Camera className="h-5 w-5 text-primary" />
                              <h3 className="font-semibold text-lg">Photo at Age {item.age}</h3>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {formatDistanceToNow(new Date(item.date), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                        <img
                          src={(item.content as ChildPhoto).photo_url}
                          alt={`Age ${item.age}`}
                          className="w-full h-64 object-cover rounded-lg"
                        />
                        {(item.content as ChildPhoto).caption && (
                          <p className="text-sm text-muted-foreground italic">
                            {(item.content as ChildPhoto).caption}
                          </p>
                        )}
                      </div>
                    )}

                    {item.type === "milestone" && (
                      <div>
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              {getMilestoneIcon((item.content as Milestone).milestone_type)}
                              <h3 className="font-semibold text-lg">
                                {(item.content as Milestone).title}
                              </h3>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Age {item.age} • {formatDistanceToNow(new Date(item.date), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                        {(item.content as Milestone).description && (
                          <p className="text-sm mt-2">
                            {(item.content as Milestone).description}
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Photo Dialog */}
      <Dialog open={showAddPhoto} onOpenChange={setShowAddPhoto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Photo</DialogTitle>
            <DialogDescription>
              Add a photo of {child.first_name} at a specific age
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="photo-age">Age</Label>
              <Input
                id="photo-age"
                type="number"
                min="0"
                placeholder="Age when photo was taken"
                value={photoAge}
                onChange={(e) => setPhotoAge(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="photo-file">Photo</Label>
              <Input
                id="photo-file"
                type="file"
                accept="image/*"
                onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="photo-caption">Caption (optional)</Label>
              <Textarea
                id="photo-caption"
                placeholder="Add a caption for this photo..."
                value={photoCaption}
                onChange={(e) => setPhotoCaption(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddPhoto(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddPhoto}
              disabled={!photoFile || !photoAge || uploadingPhoto}
            >
              {uploadingPhoto ? "Uploading..." : "Add Photo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Milestone Dialog */}
      <Dialog open={showAddMilestone} onOpenChange={setShowAddMilestone}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Milestone</DialogTitle>
            <DialogDescription>
              Record a memorable moment in {child.first_name}'s life
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="milestone-age">Age</Label>
              <Input
                id="milestone-age"
                type="number"
                min="0"
                placeholder="Age at milestone"
                value={milestoneAge}
                onChange={(e) => setMilestoneAge(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="milestone-type">Type</Label>
              <Select value={milestoneType} onValueChange={setMilestoneType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="birthday">Birthday</SelectItem>
                  <SelectItem value="first_words">First Words</SelectItem>
                  <SelectItem value="first_steps">First Steps</SelectItem>
                  <SelectItem value="conversation">Memorable Conversation</SelectItem>
                  <SelectItem value="achievement">Achievement</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="milestone-title">Title</Label>
              <Input
                id="milestone-title"
                placeholder="e.g., Said their first word"
                value={milestoneTitle}
                onChange={(e) => setMilestoneTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="milestone-description">Description (optional)</Label>
              <Textarea
                id="milestone-description"
                placeholder="Add more details about this milestone..."
                value={milestoneDescription}
                onChange={(e) => setMilestoneDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddMilestone(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddMilestone}
              disabled={!milestoneAge || !milestoneTitle || savingMilestone}
            >
              {savingMilestone ? "Saving..." : "Add Milestone"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
