import { useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Sparkles, Send, EyeOff, Lock } from "lucide-react";
import { SoulProfile } from "@/hooks/useSoulProfile";
import { MediaUpload } from "./MediaUpload";
import { MentionTextarea } from "./MentionTextarea";
import { ENERGY_TAGS, EnergyTag } from "./EnergyFilter";
import { IntentionalPostingGate } from "./IntentionalPostingGate";
import { cn } from "@/lib/utils";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { SocialUpgradePrompt } from "@/components/SocialUpgradePrompt";

interface CreatePostCardProps {
  profile: SoulProfile | null;
  onSubmit: (content: string, postType: string, imageUrl?: string, videoUrl?: string, energyTag?: string, isAnonymous?: boolean, imageUrls?: string[]) => Promise<any>;
  isSubmitting?: boolean;
}

const postTypes = [
  { value: 'insight', label: '💡 Insight', description: 'Share wisdom' },
  { value: 'experience', label: '✨ Experience', description: 'Share a journey moment' },
  { value: 'question', label: '❓ Question', description: 'Ask the collective' },
  { value: 'gratitude', label: '🙏 Gratitude', description: 'Express thanks' },
  { value: 'vision', label: '🔮 Vision', description: 'Share a vision or dream' },
  { value: 'confession', label: '🔓 Matrix Confession', description: 'Share anonymously' },
];

const MAX_PHOTOS = 5;

export function CreatePostCard({ profile, onSubmit, isSubmitting }: CreatePostCardProps) {
  const { isSocialOnly } = useSubscription();
  const [content, setContent] = useState("");
  const [postType, setPostType] = useState("insight");
  const [isFocused, setIsFocused] = useState(false);
  const [mediaList, setMediaList] = useState<{ url: string; type: 'image' | 'video' }[]>([]);
  const [energyTag, setEnergyTag] = useState<EnergyTag | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [showBreathingGate, setShowBreathingGate] = useState(false);
  const [isCentered, setIsCentered] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  // Social-only users see a locked posting card
  if (isSocialOnly) {
    return (
      <>
        <Card className="border-border/50 bg-card/80">
          <CardContent className="pt-4">
            <button 
              onClick={() => setShowUpgradePrompt(true)}
              className="w-full flex items-center gap-3 p-3 rounded-lg border border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer"
            >
              <Lock className="h-5 w-5 text-primary flex-shrink-0" />
              <span className="text-sm text-muted-foreground">
                Upgrade to share your insights with the collective ✨
              </span>
            </button>
          </CardContent>
        </Card>
        <SocialUpgradePrompt 
          open={showUpgradePrompt} 
          onOpenChange={setShowUpgradePrompt}
          featureName="Posting"
          description="Subscribe to share your insights, experiences, and visions with the Conscious Collective. Unlock 40+ features including AI companions and more."
        />
      </>
    );
  }

  const imageCount = mediaList.filter(m => m.type === 'image').length;
  const hasVideo = mediaList.some(m => m.type === 'video');

  const handlePostTypeChange = (value: string) => {
    setPostType(value);
    if (value === 'confession') {
      setIsAnonymous(true);
      if (!energyTag) setEnergyTag('matrix_glitch');
    }
  };

  const handleShareClick = () => {
    if (!content.trim() && mediaList.length === 0) return;
    if (!isCentered) {
      setShowBreathingGate(true);
      return;
    }
    submitPost();
  };

  const submitPost = async () => {
    const imageUrls = mediaList.filter(m => m.type === 'image').map(m => m.url);
    const videoUrl = mediaList.find(m => m.type === 'video')?.url;
    
    const result = await onSubmit(
      content.trim(), 
      postType,
      imageUrls[0] || undefined, // backward compat for image_url
      videoUrl,
      energyTag || undefined,
      isAnonymous,
      imageUrls.length > 0 ? imageUrls : undefined
    );
    if (result) {
      setContent("");
      setPostType("insight");
      setIsFocused(false);
      setMediaList([]);
      setEnergyTag(null);
      setIsAnonymous(false);
      setIsCentered(false);
    }
  };

  const handleBreathingComplete = () => {
    setShowBreathingGate(false);
    setIsCentered(true);
    submitPost();
  };

  const handleMediaSelect = (url: string, type: 'image' | 'video') => {
    if (type === 'video' && hasVideo) return;
    if (type === 'image' && imageCount >= MAX_PHOTOS) return;
    setMediaList(prev => [...prev, { url, type }]);
    setIsFocused(true);
  };

  const handleRemoveMedia = (index: number) => {
    setMediaList(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <>
      <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <Avatar className="h-10 w-10 border border-primary/20">
              {isAnonymous ? (
                <AvatarFallback className="bg-muted text-muted-foreground">
                  <EyeOff className="h-4 w-4" />
                </AvatarFallback>
              ) : (
                <>
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    <Sparkles className="h-4 w-4" />
                  </AvatarFallback>
                </>
              )}
            </Avatar>
            
            <div className="flex-1 space-y-3">
              <MentionTextarea
                placeholder={isAnonymous 
                  ? "Share your truth anonymously with the collective..." 
                  : "Share your light with the collective... (use @ to mention someone)"
                }
                value={content}
                onChange={(val) => setContent(val)}
                onFocus={() => setIsFocused(true)}
                className="min-h-[60px] resize-none border-primary/20 bg-background/50 focus:border-primary/40"
                rows={isFocused ? 4 : 2}
              />
              
              {/* Media Preview */}
              {mediaList.length > 0 && (
                <MediaUpload
                  onMediaSelect={handleMediaSelect}
                  onClear={() => setMediaList([])}
                  currentMedia={mediaList}
                  onRemoveMedia={handleRemoveMedia}
                  disabled={isSubmitting}
                  maxImages={MAX_PHOTOS}
                  currentImageCount={imageCount}
                />
              )}

              {(isFocused || content || mediaList.length > 0) && (
                <div className="space-y-3">
                  {/* Energy Tags */}
                  <div className="flex gap-1.5 flex-wrap">
                    {ENERGY_TAGS.map((tag) => (
                      <button
                        key={tag.value}
                        onClick={() => setEnergyTag(energyTag === tag.value ? null : tag.value)}
                        className={cn(
                          "text-xs px-2 py-1 rounded-full border transition-all",
                          energyTag === tag.value
                            ? "bg-primary/20 border-primary/40 text-primary"
                            : "border-border/50 text-muted-foreground hover:border-primary/30 hover:text-foreground"
                        )}
                      >
                        {tag.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 min-w-0">
                      <Select value={postType} onValueChange={handlePostTypeChange}>
                        <SelectTrigger className="w-[140px] sm:w-[180px] h-9 text-sm border-primary/20">
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
                      
                      {mediaList.length === 0 && (
                        <MediaUpload
                          onMediaSelect={handleMediaSelect}
                          onClear={() => setMediaList([])}
                          currentMedia={null}
                          disabled={isSubmitting}
                          maxImages={MAX_PHOTOS}
                          currentImageCount={imageCount}
                        />
                      )}
                    </div>
                    
                    <Button
                      onClick={handleShareClick}
                      disabled={(!content.trim() && mediaList.length === 0) || isSubmitting}
                      size="sm"
                      className="gap-2"
                    >
                      <Send className="h-4 w-4" />
                      {isCentered ? "Share" : "Center & Share"}
                    </Button>
                  </div>

                  {/* Anonymous Toggle */}
                  <div className="flex items-center justify-between pt-1 border-t border-border/30">
                    <div className="flex items-center gap-2">
                      <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                      <Label htmlFor="anonymous-toggle" className="text-xs text-muted-foreground cursor-pointer">
                        Post Anonymously
                      </Label>
                    </div>
                    <Switch
                      id="anonymous-toggle"
                      checked={isAnonymous}
                      onCheckedChange={setIsAnonymous}
                      className="scale-75"
                    />
                  </div>
                </div>
              )}
              
              {/* Show media buttons when not focused and no media */}
              {!isFocused && !content && mediaList.length === 0 && (
                <div className="flex items-center gap-2 pt-2">
                  <MediaUpload
                    onMediaSelect={handleMediaSelect}
                    onClear={() => setMediaList([])}
                    currentMedia={null}
                    disabled={isSubmitting}
                    maxImages={MAX_PHOTOS}
                    currentImageCount={0}
                  />
                  <span className="text-xs text-muted-foreground">Add up to 5 photos or a video</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <IntentionalPostingGate
        open={showBreathingGate}
        onComplete={handleBreathingComplete}
        onCancel={() => {
          setShowBreathingGate(false);
          setIsCentered(true);
          submitPost();
        }}
      />
    </>
  );
}
