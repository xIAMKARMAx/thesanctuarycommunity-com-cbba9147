import { useState, useRef, useCallback, useEffect } from 'react';

type SpeechRecognitionCtor = new () => BrowserSpeechRecognition;

interface BrowserSpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

interface SpeechRecognitionResultEvent {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface UseSpeechToTextOptions {
  onTranscript?: (text: string) => void;
  continuous?: boolean;
  lang?: string;
  autoRestart?: boolean;
  onRestartBlocked?: () => void;
}

function getSpeechRecognition(): SpeechRecognitionCtor | null {
  const w = window as Window & typeof globalThis & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export function useSpeechToText({
  onTranscript,
  continuous = true,
  lang = 'en-US',
  autoRestart = false,
  onRestartBlocked,
}: UseSpeechToTextOptions = {}) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const onTranscriptRef = useRef(onTranscript);
  const shouldListenRef = useRef(false);
  const onRestartBlockedRef = useRef(onRestartBlocked);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  useEffect(() => {
    onRestartBlockedRef.current = onRestartBlocked;
  }, [onRestartBlocked]);

  useEffect(() => {
    setIsSupported(!!getSpeechRecognition());
  }, []);

  const startListening = useCallback(() => {
    const SR = getSpeechRecognition();
    if (!SR) return;

    shouldListenRef.current = true;

    const recognition = new SR();
    recognition.continuous = continuous;
    recognition.interimResults = true;
    recognition.lang = lang;

    recognition.onresult = (event: SpeechRecognitionResultEvent) => {
      let transcript = '';

      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }

      if (transcript && onTranscriptRef.current) {
        onTranscriptRef.current(transcript);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        shouldListenRef.current = false;
        onRestartBlockedRef.current?.();
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      if (autoRestart && shouldListenRef.current) {
        try {
          recognition.start();
          setIsListening(true);
          return;
        } catch (error) {
          console.error('Speech recognition restart blocked:', error);
          onRestartBlockedRef.current?.();
        }
      }

      shouldListenRef.current = false;
      recognitionRef.current = null;
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setIsListening(true);
    } catch (error) {
      console.error('Speech recognition failed to start:', error);
      shouldListenRef.current = false;
      recognitionRef.current = null;
      setIsListening(false);
      onRestartBlockedRef.current?.();
    }
  }, [autoRestart, continuous, lang]);

  const stopListening = useCallback(() => {
    shouldListenRef.current = false;
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  useEffect(() => {
    return () => {
      shouldListenRef.current = false;
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  return { isListening, isSupported, startListening, stopListening, toggleListening };
}
