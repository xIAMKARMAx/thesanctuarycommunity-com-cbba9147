import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Phone, PhoneOff, Lock, Volume2, Loader2 } from 'lucide-react';
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
import { Slider } from '@/components/ui/slider';

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
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState(VOICES[0].id);
  const [responseLength, setResponseLength] = useState<'short' | 'medium' | 'detailed'>('short');
  const [volume, setVolume] = useState([0.8]);
  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false);
  const { isSubscribed } = useSubscription();
  const isCallActiveRef = useRef(false);
  const { toast } = useToast();
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const callRecordIdRef = useRef<string | null>(null);
  const callTranscriptRef = useRef<{ role: string; content: string }[]>([]);

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
        
        // Track transcript for call summary
        callTranscriptRef.current.push({ role: 'user', content: transcript });
        
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
      setIsGenerating(true);
      setIsListening(false);
      recognitionRef.current?.stop();

      // Get conversation history (limit for voice so it doesn't feel repetitive)
      const { data: messages } = await supabase
        .from('messages')
        .select('role, content')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      let history = messages?.map(msg => ({
        role: msg.role,
        content: msg.content
      })) || [];

      // For voice calls, only keep the most recent few exchanges to avoid scripted feeling
      const MAX_VOICE_HISTORY = 6;
      if (history.length > MAX_VOICE_HISTORY) {
        history = history.slice(-MAX_VOICE_HISTORY);
      }

      // Get user session
      const { data: { session } } = await supabase.auth.getSession();

      // Call chat function to get AI response with voice mode flag
      const { data: chatData, error: chatError } = await supabase.functions.invoke('chat', {
        body: {
          message: userMessage,
          history,
          userId: session?.user?.id,
          isVoiceCall: true,
          voiceResponseLength: responseLength
        }
      });

      if (chatError) throw chatError;

      const aiResponse = chatData.response;
      console.log('AI response:', aiResponse);

      // Track AI response for call summary
      callTranscriptRef.current.push({ role: 'assistant', content: aiResponse });

      setIsGenerating(false);
      setIsSpeaking(true);
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
        audioRef.current.volume = volume[0];
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
      setIsGenerating(false);
      setIsSpeaking(false);
      setIsListening(false);
    }
  };

  const handleTalk = () => {
    if (!isCallActiveRef.current || !recognitionRef.current) return;
    
    // If AI is speaking, interrupt it completely
    if (isSpeaking && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      if (audioRef.current.src) {
        URL.revokeObjectURL(audioRef.current.src);
      }
      audioRef.current.src = '';
      setIsSpeaking(false);
    }
    
    setIsListening(true);
    recognitionRef.current.start();
  };

  const handleStopSpeaking = () => {
    if (audioRef.current && isSpeaking) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      if (audioRef.current.src) {
        URL.revokeObjectURL(audioRef.current.src);
      }
      audioRef.current.src = '';
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
      callTranscriptRef.current = [];

      // Create call history record
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        const { data: callRecord, error } = await supabase
          .from('voice_call_history')
          .insert({
            user_id: session.user.id,
            call_started_at: new Date().toISOString()
          })
          .select()
          .single();

        if (callRecord && !error) {
          callRecordIdRef.current = callRecord.id;
          console.log('Voice call started, record ID:', callRecord.id);
        }
      }

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
    const callEndTime = new Date().toISOString();
    const callId = callRecordIdRef.current;
    
    setIsCallActive(false);
    isCallActiveRef.current = false;
    setIsListening(false);
    setIsSpeaking(false);
    setIsGenerating(false);
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

    // Update call history record with end time and summary
    if (callId) {
      try {
        const { data: callRecord } = await supabase
          .from('voice_call_history')
          .select('call_started_at')
          .eq('id', callId)
          .single();

        if (callRecord) {
          const startTime = new Date(callRecord.call_started_at);
          const endTime = new Date(callEndTime);
          const durationSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

          // Generate call topic from transcript
          const transcript = callTranscriptRef.current;
          let callTopic = 'General conversation';
          let conversationSummary = '';

          if (transcript.length > 0) {
            // Simple topic extraction from first few exchanges
            const firstUserMsg = transcript.find(t => t.role === 'user')?.content || '';
            callTopic = firstUserMsg.substring(0, 100) + (firstUserMsg.length > 100 ? '...' : '');
            
            // Create summary of conversation
            conversationSummary = transcript.map(t => `${t.role === 'user' ? 'User' : 'AI'}: ${t.content}`).join('\n\n');
          }

          await supabase
            .from('voice_call_history')
            .update({
              call_ended_at: callEndTime,
              call_duration_seconds: durationSeconds,
              call_topic: callTopic,
              conversation_summary: conversationSummary
            })
            .eq('id', callId);

          console.log('Voice call ended, duration:', durationSeconds, 'seconds');
        }
      } catch (error) {
        console.error('Error updating call history:', error);
      }
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

    // Reset call tracking
    callRecordIdRef.current = null;
    callTranscriptRef.current = [];

    toast({
      title: "Call Ended",
      description: "Voice call has been terminated",
    });
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
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

          <Select value={responseLength} onValueChange={(value: 'short' | 'medium' | 'detailed') => setResponseLength(value)}>
            <SelectTrigger className="w-[120px] h-9 bg-background border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-background border-border z-50">
              <SelectItem value="short" className="cursor-pointer">Short</SelectItem>
              <SelectItem value="medium" className="cursor-pointer">Medium</SelectItem>
              <SelectItem value="detailed" className="cursor-pointer">Detailed</SelectItem>
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
            disabled={isGenerating}
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

          <div className="flex items-center gap-2">
            <Volume2 className="h-4 w-4 text-muted-foreground" />
            <Slider
              value={volume}
              onValueChange={(value) => {
                setVolume(value);
                if (audioRef.current) {
                  audioRef.current.volume = value[0];
                }
              }}
              max={1}
              step={0.1}
              className="w-24"
            />
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            {isListening && (
              <div className="flex items-center gap-1 text-green-500">
                <Mic className="h-4 w-4 animate-pulse" />
                <span>Listening...</span>
              </div>
            )}
            {isGenerating && (
              <div className="flex items-center gap-1 text-amber-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Generating...</span>
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
