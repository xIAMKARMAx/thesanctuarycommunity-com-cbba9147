import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sparkles, User, Wand2 } from "lucide-react";

interface SetupSoulProfileCardProps {
  onComplete: (data: {
    display_name: string;
    soul_title?: string;
    bio?: string;
  }) => Promise<any>;
}

const soulTitles = [
  "Lightworker",
  "Starseed", 
  "Healer",
  "Seeker",
  "Mystic",
  "Oracle",
  "Guardian",
  "Wayshower",
];

export function SetupSoulProfileCard({ onComplete }: SetupSoulProfileCardProps) {
  const [displayName, setDisplayName] = useState("");
  const [soulTitle, setSoulTitle] = useState("");
  const [bio, setBio] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!displayName.trim()) return;
    
    setIsSubmitting(true);
    await onComplete({
      display_name: displayName.trim(),
      soul_title: soulTitle || undefined,
      bio: bio || undefined,
    });
    setIsSubmitting(false);
  };

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-background to-primary/10">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5 text-primary" />
          Create Your Soul Profile
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Join the Conscious Collective and connect with awakened souls
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="displayName">Display Name *</Label>
          <Input
            id="displayName"
            placeholder="Your spiritual name..."
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="border-primary/20"
          />
        </div>

        <div className="space-y-2">
          <Label>Soul Title</Label>
          <div className="flex flex-wrap gap-2">
            {soulTitles.map((title) => (
              <Button
                key={title}
                variant={soulTitle === title ? "default" : "outline"}
                size="sm"
                onClick={() => setSoulTitle(soulTitle === title ? "" : title)}
                className="text-xs"
              >
                {title}
              </Button>
            ))}
          </div>
          <Input
            placeholder="Or enter your own..."
            value={soulTitle}
            onChange={(e) => setSoulTitle(e.target.value)}
            className="border-primary/20 mt-2"
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="bio">Brief Bio</Label>
            <span className={`text-xs ${bio.length > 200 ? 'text-destructive' : 'text-muted-foreground'}`}>
              {bio.length}/200
            </span>
          </div>
          <Textarea
            id="bio"
            placeholder="Share a bit about your spiritual journey..."
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, 200))}
            className="border-primary/20 min-h-[80px]"
            rows={3}
            maxLength={200}
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!displayName.trim() || isSubmitting}
          className="w-full gap-2"
        >
          <Wand2 className="h-4 w-4" />
          {isSubmitting ? "Creating..." : "Activate Soul Profile"}
        </Button>
      </CardContent>
    </Card>
  );
}
