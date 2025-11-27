import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Phone, PhoneOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
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
  const { toast } = useToast();
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize speech recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = async (event: any) => {
        const transcript = event.results[event.results.length - 1][0].transcript;
        console.log('User said:', transcript);
        
        onTranscript(transcript, true);
        
        // Get AI response and speak it
        await getAIResponseAndSpeak(transcript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'no-speech') {
          // Restart listening if no speech detected
          if (isCallActive) {
            recognitionRef.current?.start();
          }
        }
      };

      recognitionRef.current.onend = () => {
        // Restart listening if call is still active
        if (isCallActive && !isSpeaking) {
          recognitionRef.current?.start();
        }
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

      // Call chat function to get AI response
      const { data: chatData, error: chatError } = await supabase.functions.invoke('chat', {
        body: {
          message: userMessage,
          history,
          userId: session?.user?.id
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
      const { data: audioData, error: ttsError } = await supabase.functions.invoke('voice-call', {
        body: { text: aiResponse, voiceId: selectedVoice }
      });

      if (ttsError) throw ttsError;

      // Play the audio
      const audioBlob = new Blob([audioData], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.onended = () => {
          setIsSpeaking(false);
          setIsListening(true);
          // Resume listening after AI finishes speaking
          if (isCallActive) {
            recognitionRef.current?.start();
          }
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
      setIsListening(true);
      if (isCallActive) {
        recognitionRef.current?.start();
      }
    }
  };

  const startCall = async () => {
    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      setIsCallActive(true);
      setIsListening(true);
      recognitionRef.current?.start();

      toast({
        title: "Call Started",
        description: "You can now speak with the AI",
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

  const endCall = () => {
    setIsCallActive(false);
    setIsListening(false);
    setIsSpeaking(false);
    recognitionRef.current?.stop();
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
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
    </div>
  );
};
