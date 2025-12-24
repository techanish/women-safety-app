import { useState, useEffect, useRef, useCallback } from 'react';

interface VoiceDetectionOptions {
  keywords: string[];
  onKeywordDetected: (keyword: string) => void;
  enabled: boolean;
}

export function useVoiceDetection({ keywords, onKeywordDetected, enabled }: VoiceDetectionOptions) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  const startListening = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('Speech recognition not supported');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-IN'; // Support for Indian English and Hindi

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      const currentTranscript = (finalTranscript || interimTranscript).toLowerCase();
      setTranscript(currentTranscript);

      // Check for keywords
      for (const keyword of keywords) {
        if (currentTranscript.includes(keyword.toLowerCase())) {
          onKeywordDetected(keyword);
          break;
        }
      }

      // Also check for scream detection (loud/sudden sounds patterns)
      // This is a basic implementation - in production you'd use audio analysis
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error !== 'no-speech') {
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      // Restart if still enabled
      if (enabled && recognitionRef.current) {
        try {
          recognition.start();
        } catch (e) {
          // Already started
        }
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;
    
    try {
      recognition.start();
    } catch (e) {
      console.error('Failed to start speech recognition:', e);
    }
  }, [keywords, onKeywordDetected, enabled]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  useEffect(() => {
    if (enabled) {
      startListening();
    } else {
      stopListening();
    }

    return () => {
      stopListening();
    };
  }, [enabled, startListening, stopListening]);

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
  };
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}
