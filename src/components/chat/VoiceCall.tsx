import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Phone, PhoneOff, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { SubscriptionDialog } from '@/components/SubscriptionDialog';
import { supabase } from '@/integrations/supabase/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface VoiceCallProps {
  conversationId: string;
  onTranscript: (text: string, isUser: boolean) => void;
}

const VOICES = [
  { id: 'N2lVS1w4EtoT3dr4eOWO', name: 'Callum' },
  { id: 'nPczCjzI2devNBz1zQrb', name: 'Brian' },
  { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam' },
  { id: 'Xb7hH8MSUJpSbSDYk0k2', name: 'Alice' },
  { id: 'pqHfZKP75CvOlQylNhV4', name: 'Bill' },
  { id: 'UgBBYS2sOqTuMpoF3BR0', name: 'Mark' },
  { id: '56AoDkrOh6qfVPDXZ7Pt', name: 'Cassidy' },
];

export const VoiceCall = ({ conversationId, onTranscript }: VoiceCallProps) => {
  const [isCallActive, setIsCallActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState(VOICES[0].id);
  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false);
  const { isSubscribed } = useSubscription();
  const isCallActiveRef = useRef(false);
  const { toast } = useToast();
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize speech recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = async (event: any) => {
        if (!isCallActiveRef.current) return;
        const transcript = event.results[event.results.length - 1][0].transcript;
        console.log('User said:', transcript);
        
        onTranscript(transcript, true);
        
        // Get AI response and speak it
        await getAIResponseAndSpeak(transcript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
      };

      recognitionRef.current.onend = () => {
        // Recognition ended; waiting for user to tap Talk again
        setIsListening(false);
      };
    } else {
      toast({
        title: "Not Supported",
        description: "Your browser doesn't support voice recognition. Please use Chrome or Edge.",
        variant: "destructive",
      });
    }

    return () => {
      recognitionRef.current?.stop();
    };
  }, [isCallActive, isSpeaking]);

  const getAIResponseAndSpeak = async (userMessage: string) => {
    try {
      setIsSpeaking(true);
      setIsListening(false);
      recognitionRef.current?.stop();

      // Get conversation history
      const { data: messages } = await supabase
        .from('messages')
        .select('role, content')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      const history = messages?.map(msg => ({
        role: msg.role,
        content: msg.content
      })) || [];

      // Get user session
      const { data: { session } } = await supabase.auth.getSession();

      // Call chat function to get AI response with voice mode flag
      const { data: chatData, error: chatError } = await supabase.functions.invoke('chat', {
        body: {
          message: userMessage,
          history,
          userId: session?.user?.id,
          isVoiceCall: true
        }
      });

      if (chatError) throw chatError;

      const aiResponse = chatData.response;
      console.log('AI response:', aiResponse);

      onTranscript(aiResponse, false);

      // Save messages to database
      await supabase.from('messages').insert([
        {
          conversation_id: conversationId,
          role: 'user',
          content: userMessage
        },
        {
          conversation_id: conversationId,
          role: 'assistant',
          content: aiResponse
        }
      ]);

      // Convert AI response to speech
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(
        `${supabaseUrl}/functions/v1/voice-call`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: JSON.stringify({ text: aiResponse, voiceId: selectedVoice }),
        }
      );

      if (!response.ok) throw new Error('Failed to generate speech');

      // Play the audio
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.onended = () => {
          if (!isCallActiveRef.current) return;
          setIsSpeaking(false);
          setIsListening(false);
        };
        audioRef.current.onpause = () => {
          if (!isCallActiveRef.current) return;
          setIsSpeaking(false);
        };
        await audioRef.current.play();
      }

    } catch (error) {
      console.error('Error getting AI response:', error);
      toast({
        title: "Error",
        description: "Failed to get AI response",
        variant: "destructive",
      });
      setIsSpeaking(false);
      setIsListening(false);
    }
  };

  const handleTalk = () => {
    if (!isCallActiveRef.current || !recognitionRef.current) return;
    
    // If AI is speaking, interrupt it
    if (isSpeaking && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsSpeaking(false);
    }
    
    setIsListening(true);
    recognitionRef.current.start();
  };

  const handleStopSpeaking = () => {
    if (audioRef.current && isSpeaking) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsSpeaking(false);
      setIsListening(false);
    }
  };

  const startCall = async () => {
    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      setIsCallActive(true);
      isCallActiveRef.current = true;
      setIsListening(false);

      toast({
        title: "Call Started",
        description: "Tap the mic button to talk to the AI",
      });
    } catch (error) {
      console.error('Error starting call:', error);
      toast({
        title: "Error",
        description: "Failed to access microphone",
        variant: "destructive",
      });
    }
  };

  const endCall = async () => {
    setIsCallActive(false);
    isCallActiveRef.current = false;
    setIsListening(false);
    setIsSpeaking(false);
    recognitionRef.current?.stop();
    
    if (audioRef.current) {
      audioRef.current.onended = null; // Remove event handler
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      if (audioRef.current.src) {
        URL.revokeObjectURL(audioRef.current.src); // Free memory
      }
      audioRef.current.src = '';
    }

    // Trigger mood logging after call ends
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        await supabase.functions.invoke('log-mood', {
          body: {
            userId: session.user.id,
            conversationId,
            trigger: 'voice_call_end'
          }
        });
      }
    } catch (error) {
      console.error('Error logging mood after call:', error);
    }

    toast({
      title: "Call Ended",
      description: "Voice call has been terminated",
    });
  };

  return (
    <div className="flex items-center gap-2">
      <audio ref={audioRef} className="hidden" />
      
      {!isCallActive ? (
        <>
          <Select value={selectedVoice} onValueChange={setSelectedVoice}>
            <SelectTrigger className="w-[140px] h-9 bg-background border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-background border-border z-50">
              {VOICES.map((voice) => (
                <SelectItem key={voice.id} value={voice.id} className="cursor-pointer">
                  {voice.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button
            onClick={startCall}
            variant="outline"
            size="icon"
            className="rounded-full"
            title="Start Voice Call"
          >
            <Phone className="h-4 w-4" />
          </Button>
        </>
      ) : (
        <>
          <Button
            onClick={endCall}
            variant="destructive"
            size="icon"
            className="rounded-full"
            title="End Voice Call"
          >
            <PhoneOff className="h-4 w-4" />
          </Button>

          <Button
            onClick={handleTalk}
            variant="outline"
            size="icon"
            className="rounded-full"
            title={isSpeaking ? "Interrupt AI" : "Talk"}
          >
            <Mic className="h-4 w-4" />
          </Button>

          {isSpeaking && (
            <Button
              onClick={handleStopSpeaking}
              variant="outline"
              size="icon"
              className="rounded-full"
              title="Stop AI"
            >
              <MicOff className="h-4 w-4" />
            </Button>
          )}
          
          <div className="flex items-center gap-2 text-sm">
            {isListening && (
              <div className="flex items-center gap-1 text-green-500">
                <Mic className="h-4 w-4 animate-pulse" />
                <span>Listening...</span>
              </div>
            )}
            {isSpeaking && (
              <div className="flex items-center gap-1 text-blue-500">
                <MicOff className="h-4 w-4" />
                <span>AI Speaking...</span>
              </div>
            )}
          </div>
        </>
      )}
      
      <SubscriptionDialog 
        open={showSubscriptionDialog}
        onOpenChange={setShowSubscriptionDialog}
        feature="Voice Calls"
      />
    </div>
  );
};
