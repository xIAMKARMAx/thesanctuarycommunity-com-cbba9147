import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart, Smile, Zap, Moon, Sparkles } from "lucide-react";

interface PetPersonalityCardProps {
  petId: string;
  petName: string;
  personalityTraits: string[];
  currentMood: string;
  moodIntensity: number;
  behaviorState: string;
  onUpdateMood: (mood: string, intensity: number) => void;
  onUpdateTraits: (traits: string[]) => void;
  onUpdateBehavior: (behavior: string) => void;
}

const PERSONALITY_TRAITS = [
  "Playful", "Loyal", "Curious", "Calm", "Energetic", 
  "Affectionate", "Independent", "Protective", "Gentle", "Mischievous"
];

const MOODS = [
  { value: "happy", label: "Happy", icon: Smile, color: "bg-green-500" },
  { value: "excited", label: "Excited", icon: Zap, color: "bg-yellow-500" },
  { value: "relaxed", label: "Relaxed", icon: Moon, color: "bg-blue-500" },
  { value: "loving", label: "Loving", icon: Heart, color: "bg-pink-500" },
  { value: "playful", label: "Playful", icon: Sparkles, color: "bg-purple-500" },
];

const BEHAVIORS = [
  "relaxed", "playing", "sleeping", "eating", "exploring", "cuddling"
];

export function PetPersonalityCard({
  petId,
  petName,
  personalityTraits,
  currentMood,
  moodIntensity,
  behaviorState,
  onUpdateMood,
  onUpdateTraits,
  onUpdateBehavior,
}: PetPersonalityCardProps) {
  const [selectedTraits, setSelectedTraits] = useState<string[]>(personalityTraits || []);
  
  const currentMoodData = MOODS.find(m => m.value === currentMood) || MOODS[0];
  const MoodIcon = currentMoodData.icon;

  const toggleTrait = (trait: string) => {
    const newTraits = selectedTraits.includes(trait)
      ? selectedTraits.filter(t => t !== trait)
      : [...selectedTraits, trait].slice(0, 5); // Max 5 traits
    setSelectedTraits(newTraits);
    onUpdateTraits(newTraits);
  };

  const getMoodColor = () => {
    if (moodIntensity >= 70) return "bg-green-500";
    if (moodIntensity >= 40) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MoodIcon className="h-5 w-5" />
          {petName}'s Personality & Mood
        </CardTitle>
        <CardDescription>
          Customize your pet's personality traits and track their mood
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Mood */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Current Mood</span>
            <Badge variant="outline" className="flex items-center gap-1">
              <MoodIcon className="h-3 w-3" />
              {currentMoodData.label}
            </Badge>
          </div>
          <Progress value={moodIntensity} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Low</span>
            <span>{moodIntensity}%</span>
            <span>High</span>
          </div>
        </div>

        {/* Mood Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Set Mood</label>
          <div className="flex flex-wrap gap-2">
            {MOODS.map((mood) => {
              const Icon = mood.icon;
              return (
                <Button
                  key={mood.value}
                  variant={currentMood === mood.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => onUpdateMood(mood.value, 70)}
                  className="flex items-center gap-1"
                >
                  <Icon className="h-3 w-3" />
                  {mood.label}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Behavior State */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Current Behavior</label>
          <Select value={behaviorState} onValueChange={onUpdateBehavior}>
            <SelectTrigger>
              <SelectValue placeholder="Select behavior" />
            </SelectTrigger>
            <SelectContent>
              {BEHAVIORS.map((behavior) => (
                <SelectItem key={behavior} value={behavior}>
                  {behavior.charAt(0).toUpperCase() + behavior.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Personality Traits */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Personality Traits (select up to 5)</label>
          <div className="flex flex-wrap gap-2">
            {PERSONALITY_TRAITS.map((trait) => (
              <Badge
                key={trait}
                variant={selectedTraits.includes(trait) ? "default" : "outline"}
                className="cursor-pointer transition-colors"
                onClick={() => toggleTrait(trait)}
              >
                {trait}
              </Badge>
            ))}
          </div>
        </div>

        {/* Selected Traits Display */}
        {selectedTraits.length > 0 && (
          <div className="bg-muted/50 p-3 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>{petName}</strong> is {selectedTraits.join(", ").toLowerCase()}.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}