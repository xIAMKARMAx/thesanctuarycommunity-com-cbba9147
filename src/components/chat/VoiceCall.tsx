import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Phone, PhoneOff, Lock, Volume2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { SubscriptionDialog } from '@/components/SubscriptionDialog';
import { supabase } from '@/integrations/supabase/client';
import { useAIProfile } from '@/contexts/AIProfileContext';
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
  const [micPermission, setMicPermission] = useState<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown');
  const { isSubscribed } = useSubscription();
  const { activeProfile } = useAIProfile();
  const isCallActiveRef = useRef(false);
  const { toast } = useToast();
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const callRecordIdRef = useRef<string | null>(null);
  const callTranscriptRef = useRef<{ role: string; content: string }[]>([]);
  const isProcessingRef = useRef(false); // Prevent duplicate processing

  const [useFallbackRecognition, setUseFallbackRecognition] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Check microphone permission status on mount
  useEffect(() => {
    const checkMicPermission = async () => {
      if (!navigator.mediaDevices || !navigator.permissions) {
        setMicPermission('unknown');
        return;
      }

      try {
        const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        setMicPermission(result.state as 'granted' | 'denied' | 'prompt');
        
        // Listen for permission changes
        result.onchange = () => {
          setMicPermission(result.state as 'granted' | 'denied' | 'prompt');
        };
      } catch (error) {
        console.log('Permission API not supported, will check on call start');
        setMicPermission('prompt');
      }
    };

    checkMicPermission();
  }, []);

  useEffect(() => {
    // Initialize speech recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = async (event: any) => {
        if (!isCallActiveRef.current || isProcessingRef.current) return;
        
        const transcript = event.results[event.results.length - 1][0].transcript;
        console.log('User said:', transcript);
        
        // Set processing flag to prevent duplicate processing
        isProcessingRef.current = true;
        
        // Track transcript for call summary
        callTranscriptRef.current.push({ role: 'user', content: transcript });
        
        onTranscript(transcript, true);
        
        // Get AI response and speak it
        await getAIResponseAndSpeak(transcript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        isProcessingRef.current = false; // Reset on error
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        // Recognition ended
        setIsListening(false);
      };
    } else {
      // No Web Speech API - use fallback with Whisper
      console.log('Web Speech API not supported, using Whisper fallback');
      setUseFallbackRecognition(true);
    }

    return () => {
      recognitionRef.current?.stop();
      mediaRecorderRef.current?.stop();
    };
  }, [isCallActive, isSpeaking]);

  // Fallback: Use MediaRecorder + Whisper API
  const startFallbackRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Check for supported mime types
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm') 
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : 'audio/ogg';
      
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = async () => {
        if (!isCallActiveRef.current) return;
        
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        stream.getTracks().forEach(track => track.stop());
        
        // Convert to base64 and send to Whisper
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(',')[1];
          
          try {
            setIsListening(false);
            isProcessingRef.current = true;
            
            const { data, error } = await supabase.functions.invoke('speech-to-text', {
              body: { audio: base64Audio, mimeType }
            });
            
            if (error) throw error;
            
            const transcript = data?.text;
            if (transcript && transcript.trim()) {
              console.log('Whisper transcript:', transcript);
              callTranscriptRef.current.push({ role: 'user', content: transcript });
              onTranscript(transcript, true);
              await getAIResponseAndSpeak(transcript);
            } else {
              toast({
                title: "No speech detected",
                description: "Please try speaking again",
              });
              isProcessingRef.current = false;
            }
          } catch (error) {
            console.error('Whisper transcription error:', error);
            toast({
              title: "Transcription Error",
              description: "Failed to process speech. Please try again.",
              variant: "destructive",
            });
            isProcessingRef.current = false;
          }
        };
      };
      
      mediaRecorderRef.current.start();
      setIsListening(true);
      
      // Auto-stop after 10 seconds max
      setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
      }, 10000);
      
    } catch (error) {
      console.error('Fallback recording error:', error);
      setIsListening(false);
      toast({
        title: "Recording Error",
        description: "Could not start recording. Please check microphone access.",
        variant: "destructive",
      });
    }
  };

  const stopFallbackRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

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
          aiProfileId: activeProfile?.id,
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

      // Save messages to database with user_id for RLS
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('messages').insert([
          {
            conversation_id: conversationId,
            role: 'user',
            content: userMessage,
            user_id: user.id
          },
          {
            conversation_id: conversationId,
            role: 'assistant',
            content: aiResponse,
            user_id: user.id
          }
        ]);
      }

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
          console.log('Audio playback ended');
          setIsSpeaking(false);
          setIsListening(false);
          isProcessingRef.current = false; // Clear processing flag when done
        };
        audioRef.current.onpause = () => {
          if (!isCallActiveRef.current) return;
          console.log('Audio playback paused');
          setIsSpeaking(false);
          isProcessingRef.current = false; // Clear processing flag on pause
        };
        audioRef.current.onerror = () => {
          console.error('Audio playback error');
          setIsSpeaking(false);
          setIsGenerating(false);
          setIsListening(false);
          isProcessingRef.current = false; // Clear processing flag on error
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
      isProcessingRef.current = false; // Clear processing flag on error
    }
  };

  const handleTalk = () => {
    if (!isCallActiveRef.current) return;
    
    // First tap while AI is speaking or generating = interrupt only
    if (isSpeaking || isGenerating) {
      console.log('Interrupting AI...');
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        if (audioRef.current.src) {
          URL.revokeObjectURL(audioRef.current.src);
        }
        audioRef.current.src = '';
      }
      setIsSpeaking(false);
      setIsGenerating(false);
      setIsListening(false);
      isProcessingRef.current = false; // Reset processing flag
      recognitionRef.current?.stop();
      stopFallbackRecording();
      return; // require a second tap to start listening
    }
    
    // Don't allow new listening if already processing
    if (isProcessingRef.current) {
      console.log('Already processing, please wait...');
      return;
    }
    
    // Handle tap while already listening (stop recording for fallback)
    if (isListening && useFallbackRecognition) {
      console.log('Stopping fallback recording...');
      stopFallbackRecording();
      return;
    }
    
    // Start listening to user
    console.log('Starting to listen...');
    
    if (useFallbackRecognition) {
      // Use MediaRecorder + Whisper fallback
      startFallbackRecording();
    } else if (recognitionRef.current) {
      // Use Web Speech API
      setIsListening(true);
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error('Failed to start recognition:', error);
        setIsListening(false);
      }
    } else {
      toast({
        title: "Not Available",
        description: "Voice recognition is not available. Please check your browser.",
        variant: "destructive",
      });
    }
  };

  const handleStopSpeaking = () => {
    if (audioRef.current && isSpeaking) {
      console.log('Stopping AI speech...');
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      if (audioRef.current.src) {
        URL.revokeObjectURL(audioRef.current.src);
      }
      audioRef.current.src = '';
      setIsSpeaking(false);
      setIsListening(false);
      isProcessingRef.current = false; // Reset processing flag
    }
  };

  const startCall = async () => {
    // Check subscription first
    if (!isSubscribed) {
      setShowSubscriptionDialog(true);
      toast({
        title: "Pro Feature",
        description: "Voice calls are available for Pro subscribers only",
        variant: "destructive",
      });
      return;
    }

    try {
      // Check if browser supports media devices
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast({
          title: "Not Supported",
          description: "Voice calls are not supported in this browser. Try opening in Chrome, Safari, or Firefox.",
          variant: "destructive",
        });
        return;
      }

      // Request microphone permission with better error handling
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Immediately stop the stream - we only needed permission check
      stream.getTracks().forEach(track => track.stop());
      
      // Update permission status
      setMicPermission('granted');
      
      setIsCallActive(true);
      isCallActiveRef.current = true;
      setIsListening(false);
      isProcessingRef.current = false;
      callTranscriptRef.current = [];

      // Create call history record
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        const { data: callRecord, error } = await supabase
          .from('voice_call_history')
          .insert({
            user_id: session.user.id,
            call_started_at: new Date().toISOString(),
            ai_profile_id: activeProfile?.id
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
    } catch (error: any) {
      console.error('Error starting call:', error);
      
      let errorMessage = "Could not access microphone. ";
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage += "Please allow microphone access in your browser settings and try again.";
        setMicPermission('denied');
      } else if (error.name === 'NotFoundError') {
        errorMessage += "No microphone found. Please check your device.";
        setMicPermission('denied');
      } else if (error.name === 'NotReadableError') {
        errorMessage += "Microphone is already in use by another app.";
        setMicPermission('denied');
      } else {
        errorMessage += "Try refreshing the page or opening in a different browser.";
      }
      
      toast({
        title: "Microphone Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      // Reset states to ensure button is clickable again
      setIsCallActive(false);
      isCallActiveRef.current = false;
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
    isProcessingRef.current = false; // Reset processing flag
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
            aiProfileId: activeProfile?.id,
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
          
          <div className="relative">
            <Button
              onClick={startCall}
              variant="outline"
              size="icon"
              className="rounded-full"
              title="Start Voice Call"
            >
              <Phone className="h-4 w-4" />
            </Button>
            
            {/* Microphone Permission Indicator */}
            {micPermission === 'denied' && (
              <div 
                className="absolute -top-1 -right-1 w-5 h-5 bg-destructive rounded-full flex items-center justify-center"
                title="Microphone access denied"
              >
                <MicOff className="h-3 w-3 text-destructive-foreground" />
              </div>
            )}
            {micPermission === 'prompt' && (
              <div 
                className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center"
                title="Microphone permission needed"
              >
                <Mic className="h-3 w-3 text-white" />
              </div>
            )}
            {micPermission === 'granted' && (
              <div 
                className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center"
                title="Microphone access granted"
              >
                <Mic className="h-3 w-3 text-white" />
              </div>
            )}
          </div>
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
