import { Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSpeechToText } from '@/hooks/useSpeechToText';
import { useToast } from '@/hooks/use-toast';
import { useRef, useEffect } from 'react';

interface VoiceToTextButtonProps {
  /** Called with the latest transcript chunk. Append it to your text state. */
  onTranscript: (text: string) => void;
  /** Optional className for size/positioning overrides */
  className?: string;
  /** Button size variant */
  size?: 'sm' | 'icon' | 'default';
  /** Tooltip / aria label */
  label?: string;
}

/**
 * Browser-native speech-to-text mic button.
 * Zero API cost — uses Web Speech API (Chrome, Edge, Safari iOS 14.5+).
 * Tap to start dictating, tap again to stop. Words flow into the textbox live.
 */
export function VoiceToTextButton({
  onTranscript,
  className,
  size = 'icon',
  label = 'Speak to type',
}: VoiceToTextButtonProps) {
  const { toast } = useToast();
  const lastTranscriptRef = useRef<string>('');

  const { isListening, isSupported, toggleListening } = useSpeechToText({
    continuous: true,
    onTranscript: (text) => {
      // Web Speech API replays the full session transcript each result.
      // Only emit the new delta so callers can simply append.
      if (text.startsWith(lastTranscriptRef.current)) {
        const delta = text.slice(lastTranscriptRef.current.length);
        if (delta.trim()) {
          onTranscript(delta);
        }
      } else {
        // Reset / different session — emit the full text.
        onTranscript(text);
      }
      lastTranscriptRef.current = text;
    },
  });

  // Reset delta tracker when listening stops so the next session starts clean.
  useEffect(() => {
    if (!isListening) {
      lastTranscriptRef.current = '';
    }
  }, [isListening]);

  const handleClick = () => {
    if (!isSupported) {
      toast({
        title: 'Voice input unavailable',
        description:
          'Your browser does not support speech recognition. Try Chrome, Edge, or Safari.',
        variant: 'destructive',
      });
      return;
    }
    toggleListening();
  };

  if (!isSupported) {
    return null; // Hide silently on unsupported browsers (e.g. Firefox)
  }

  return (
    <Button
      type="button"
      variant={isListening ? 'default' : 'ghost'}
      size={size}
      onClick={handleClick}
      aria-label={isListening ? 'Stop dictating' : label}
      title={isListening ? 'Tap to stop' : label}
      className={cn(
        'shrink-0 transition-all',
        isListening && 'bg-primary text-primary-foreground animate-pulse',
        className
      )}
    >
      {isListening ? (
        <MicOff className="h-4 w-4" />
      ) : (
        <Mic className="h-4 w-4" />
      )}
    </Button>
  );
}
