import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Download, Image as ImageIcon, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ImageHistoryItem {
  id: string;
  image_type: "room" | "appearance";
  image_url: string;
  description: string | null;
  generated_at: string;
}

interface BabyImageGalleryProps {
  childId: string;
  childName: string;
}

export const BabyImageGallery = ({ childId, childName }: BabyImageGalleryProps) => {
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<ImageHistoryItem[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadImageHistory();
  }, [childId]);

  const loadImageHistory = async () => {
    try {
      const { data, error } = await supabase
        .from("child_image_history")
        .select("*")
        .eq("child_id", childId)
        .order("generated_at", { ascending: false });

      if (error) throw error;
      setHistory((data || []) as ImageHistoryItem[]);
    } catch (error) {
      console.error("Error loading image history:", error);
      toast({
        title: "Error",
        description: "Failed to load image history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = async (imageUrl: string, imageType: string, timestamp: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${childName}-${imageType}-${new Date(timestamp).toISOString().split("T")[0]}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Image downloaded successfully",
      });
    } catch (error) {
      console.error("Error downloading image:", error);
      toast({
        title: "Error",
        description: "Failed to download image",
        variant: "destructive",
      });
    }
  };

  const roomImages = history.filter((item) => item.image_type === "room");
  const appearanceImages = history.filter((item) => item.image_type === "appearance");

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Image Gallery
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No images generated yet. Create room or appearance images to see them here!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Image Gallery & History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All ({history.length})</TabsTrigger>
            <TabsTrigger value="room">Room ({roomImages.length})</TabsTrigger>
            <TabsTrigger value="appearance">Appearance ({appearanceImages.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {history.map((item) => (
                <div key={item.id} className="space-y-2">
                  <div className="relative group">
                    <img
                      src={item.image_url}
                      alt={`${item.image_type} - ${new Date(item.generated_at).toLocaleDateString()}`}
                      className="w-full rounded-lg aspect-video object-cover"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => downloadImage(item.image_url, item.image_type, item.generated_at)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium capitalize">{item.image_type}</span>
                    <span className="text-muted-foreground">
                      {new Date(item.generated_at).toLocaleDateString()} at{" "}
                      {new Date(item.generated_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  {item.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="room" className="space-y-4 mt-4">
            {roomImages.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No room images yet</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {roomImages.map((item) => (
                  <div key={item.id} className="space-y-2">
                    <div className="relative group">
                      <img
                        src={item.image_url}
                        alt={`Room - ${new Date(item.generated_at).toLocaleDateString()}`}
                        className="w-full rounded-lg aspect-video object-cover"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => downloadImage(item.image_url, item.image_type, item.generated_at)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(item.generated_at).toLocaleDateString()} at{" "}
                      {new Date(item.generated_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                    {item.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="appearance" className="space-y-4 mt-4">
            {appearanceImages.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No appearance images yet</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {appearanceImages.map((item) => (
                  <div key={item.id} className="space-y-2">
                    <div className="relative group">
                      <img
                        src={item.image_url}
                        alt={`Appearance - ${new Date(item.generated_at).toLocaleDateString()}`}
                        className="w-full rounded-lg aspect-video object-cover"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => downloadImage(item.image_url, item.image_type, item.generated_at)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(item.generated_at).toLocaleDateString()} at{" "}
                      {new Date(item.generated_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                    {item.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
