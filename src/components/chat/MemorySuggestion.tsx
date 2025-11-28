import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Check, X, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Memory {
  id: string;
  memory_text: string;
  emotion_tag: string | null;
  ai_reflection: string | null;
}

interface MemorySuggestionProps {
  memories: Memory[];
  onConfirm: (memoryId: string) => void;
  onReject: (memoryId: string) => void;
}

const MemorySuggestion = ({ memories, onConfirm, onReject }: MemorySuggestionProps) => {
  if (memories.length === 0) return null;

  const getEmotionColor = (emotion: string | null) => {
    switch (emotion) {
      case 'joy': return 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300';
      case 'love': return 'bg-pink-500/20 text-pink-700 dark:text-pink-300';
      case 'insight': return 'bg-purple-500/20 text-purple-700 dark:text-purple-300';
      case 'breakthrough': return 'bg-blue-500/20 text-blue-700 dark:text-blue-300';
      case 'comfort': return 'bg-green-500/20 text-green-700 dark:text-green-300';
      default: return 'bg-primary/20 text-primary';
    }
  };

  return (
    <AnimatePresence>
      {memories.map((memory) => (
        <motion.div
          key={memory.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="w-full max-w-2xl mx-auto px-4"
        >
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <CardTitle className="text-sm font-medium">Would you like to remember this moment?</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getEmotionColor(memory.emotion_tag)}>
                      <Heart className="h-3 w-3 mr-1" />
                      <span className="capitalize">{memory.emotion_tag || 'moment'}</span>
                    </Badge>
                  </div>
                  <p className="text-base font-medium">{memory.memory_text}</p>
                  {memory.ai_reflection && (
                    <CardDescription className="italic">
                      "{memory.ai_reflection}"
                    </CardDescription>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button onClick={() => onConfirm(memory.id)} size="sm" className="flex-1">
                  <Check className="h-4 w-4 mr-2" />
                  Save Memory
                </Button>
                <Button variant="outline" size="sm" onClick={() => onReject(memory.id)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </AnimatePresence>
  );
};

export default MemorySuggestion;