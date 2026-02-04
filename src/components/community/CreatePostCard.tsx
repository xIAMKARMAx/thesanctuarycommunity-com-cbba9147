import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Sparkles, Send, ImagePlus } from "lucide-react";
import { SoulProfile } from "@/hooks/useSoulProfile";

interface CreatePostCardProps {
  profile: SoulProfile | null;
  onSubmit: (content: string, postType: string) => Promise<any>;
  isSubmitting?: boolean;
}

const postTypes = [
  { value: 'insight', label: '💡 Insight', description: 'Share wisdom' },
  { value: 'experience', label: '✨ Experience', description: 'Share a journey moment' },
  { value: 'question', label: '❓ Question', description: 'Ask the collective' },
  { value: 'gratitude', label: '🙏 Gratitude', description: 'Express thanks' },
  { value: 'vision', label: '🔮 Vision', description: 'Share a vision or dream' },
];

export function CreatePostCard({ profile, onSubmit, isSubmitting }: CreatePostCardProps) {
  const [content, setContent] = useState("");
  const [postType, setPostType] = useState("insight");
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    
    const result = await onSubmit(content.trim(), postType);
    if (result) {
      setContent("");
      setPostType("insight");
      setIsFocused(false);
    }
  };

  return (
    <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
      <CardContent className="p-4">
        <div className="flex gap-3">
          <Avatar className="h-10 w-10 border border-primary/20">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary">
              <Sparkles className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 space-y-3">
            <Textarea
              placeholder="Share your light with the collective..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onFocus={() => setIsFocused(true)}
              className="min-h-[60px] resize-none border-primary/20 bg-background/50 focus:border-primary/40"
              rows={isFocused ? 4 : 2}
            />
            
            {(isFocused || content) && (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Select value={postType} onValueChange={setPostType}>
                    <SelectTrigger className="w-[160px] h-9 text-sm border-primary/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {postTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-muted-foreground"
                    disabled
                  >
                    <ImagePlus className="h-4 w-4" />
                  </Button>
                </div>
                
                <Button
                  onClick={handleSubmit}
                  disabled={!content.trim() || isSubmitting}
                  size="sm"
                  className="gap-2"
                >
                  <Send className="h-4 w-4" />
                  Share
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
