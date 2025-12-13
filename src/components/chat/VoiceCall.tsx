// DISABLED FOR COST SAVINGS - Will re-enable when revenue allows
// This feature uses voice-call edge function and ElevenLabs API

import { Phone, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface VoiceCallProps {
  conversationId: string;
  onTranscript: (text: string, isUser: boolean) => void;
}

export const VoiceCall = ({ conversationId, onTranscript }: VoiceCallProps) => {
  return (
    <Card className="border-primary/20 mx-4 my-2">
      <CardHeader className="text-center py-4">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
          <Clock className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="flex items-center justify-center gap-2 text-lg">
          <Phone className="h-4 w-4 text-primary" />
          Voice Calls Coming Soon
        </CardTitle>
        <CardDescription className="text-sm">
          Voice calling with your AI will be available soon.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center text-muted-foreground text-xs pb-4">
        <p>Thank you for your patience. 💫</p>
      </CardContent>
    </Card>
  );
};
