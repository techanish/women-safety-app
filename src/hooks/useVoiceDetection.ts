import { useState, useEffect, useRef, useCallback } from 'react';
import { useSafety } from '@/contexts/SafetyContext';

// Extend Window interface for Speech Recognition
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

interface VoiceDetectionOptions {
  keywords: string[];
  onKeywordDetected?: (keyword: string) => void;
  enabled: boolean;
  autoTriggerSOS?: boolean;
  isSafeMode?: boolean;
}

export function useVoiceDetection({ 
  keywords, 
  onKeywordDetected, 
  enabled,
  autoTriggerSOS = true,
  isSafeMode = false,
}: VoiceDetectionOptions) {
  const { triggerSOS } = useSafety();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [lastDetection, setLastDetection] = useState<{ keyword: string; timestamp: number } | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const detectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSpeechTimeRef = useRef<number>(Date.now());
  const isStoppedRef = useRef<boolean>(false);

  const startListening = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('Speech recognition not supported in this browser');
      return;
    }

    // Don't start if in safe mode
    if (isSafeMode) {
      console.log('Voice detection disabled in safe mode');
      return;
    }

    if (isStoppedRef.current) {
      console.debug('Voice detection: already stopped, not starting');
      return;
    }

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.continuous = true;
      recognition.interimResults = true;
      // Use blank language to auto-detect or handle multiple languages
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        console.debug('Speech recognition started, listening for keywords:', keywords);
        setIsListening(true);
        lastSpeechTimeRef.current = Date.now();
      };

      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript;
          
          if (result.isFinal) {
            finalTranscript += transcript + ' ';
            lastSpeechTimeRef.current = Date.now();
          } else {
            interimTranscript += transcript;
          }
        }

        const currentTranscript = (finalTranscript || interimTranscript).toLowerCase().trim();
        
        if (currentTranscript) {
          console.debug('Speech detected:', currentTranscript);
          setTranscript(currentTranscript);
        }

        // Check for keywords in final transcript with word boundary matching
        if (finalTranscript) {
          const normalizedTranscript = finalTranscript.toLowerCase().trim();
          
          for (const keyword of keywords) {
            const normalizedKeyword = keyword.toLowerCase().trim();
            
            // More precise word boundary matching to avoid partial matches
            const wordBoundaryRegex = new RegExp(`\\b${normalizedKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
            
            if (wordBoundaryRegex.test(normalizedTranscript)) {
              console.log('Keyword match detected:', keyword, '→', normalizedTranscript);
              setLastDetection({ keyword, timestamp: Date.now() });
              
              // Trigger SOS if auto-trigger enabled
              if (autoTriggerSOS && !isSafeMode) {
                console.log('Voice SOS trigger activated:', keyword);
                triggerSOS('voice');
              }
              
              onKeywordDetected?.(keyword);
              break;
            }
          }
        }
      };

      recognition.onerror = (event) => {
        // Log all errors but handle gracefully
        console.warn('Speech recognition error:', event.error);
        
        // Handle different error types
        switch (event.error) {
          case 'no-speech':
            // This is normal - just timeout, will restart on onend
            console.debug('No speech detected, will restart listening');
            break;
          case 'network':
            console.warn('Speech Recognition: Network error - check internet connection');
            break;
          case 'audio-capture':
            console.warn('Speech Recognition: No microphone available');
            break;
          case 'not-allowed':
            console.warn('Speech Recognition: Microphone access denied - check permissions');
            break;
          case 'aborted':
            console.debug('Speech recognition was aborted');
            break;
          default:
            console.warn('Speech Recognition error:', event.error);
        }
      };

      recognition.onend = () => {
        console.debug('Speech recognition ended');
        // Auto-restart immediately if still enabled and not in safe mode
        // This handles the "no-speech" timeout which is a normal occurrence
        if (enabled && !isSafeMode && !isStoppedRef.current) {
          console.debug('Restarting speech recognition (likely due to no-speech timeout)');
          if (restartTimeoutRef.current) {
            clearTimeout(restartTimeoutRef.current);
          }
          restartTimeoutRef.current = setTimeout(() => {
            try {
              if (!isStoppedRef.current) {
                recognition.start();
              }
            } catch (e) {
              console.debug('Could not restart recognition:', (e as Error).message);
              // If restart fails, try again after delay
              restartTimeoutRef.current = setTimeout(() => {
                try {
                  if (!isStoppedRef.current) {
                    recognition.start();
                  }
                } catch (err) {
                  console.warn('Failed to restart recognition after retry:', err);
                }
              }, 2000);
            }
          }, 100);
        } else {
          setIsListening(false);
        }
      };

      recognitionRef.current = recognition;
      console.debug('Starting speech recognition with keywords:', keywords);
      recognition.start();
    } catch (error) {
      console.error('Failed to initialize speech recognition:', error);
      setIsListening(false);
    }
  }, [keywords, onKeywordDetected, enabled, autoTriggerSOS, triggerSOS, isSafeMode]);

  const stopListening = useCallback(() => {
    isStoppedRef.current = true;
    
    // Clear all timeouts
    if (detectionTimeoutRef.current) {
      clearTimeout(detectionTimeoutRef.current);
      detectionTimeoutRef.current = null;
    }
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      } catch (e) {
        console.debug('Failed to stop recognition:', e);
      }
    }
    setIsListening(false);
  }, []);

  useEffect(() => {
    // Don't listen if in safe mode
    if (isSafeMode) {
      console.debug('Voice detection: safe mode active, stopping listener');
      isStoppedRef.current = true;
      stopListening();
      return;
    }

    if (enabled) {
      console.debug('Voice detection: enabled, ensuring fresh start');
      isStoppedRef.current = false;
      // Stop old listener first
      stopListening();
      // Then start after cleanup
      const startDelay = setTimeout(() => {
        if (!isStoppedRef.current) {
          console.debug('Voice detection: starting fresh listener');
          startListening();
        }
      }, 100);
      return () => clearTimeout(startDelay);
    } else {
      console.debug('Voice detection: disabled, stopping listener');
      isStoppedRef.current = true;
      stopListening();
    }

    return () => {
      isStoppedRef.current = true;
      stopListening();
    };
  }, [enabled, startListening, stopListening, isSafeMode]);

  const resetDetection = useCallback(() => {
    setLastDetection(null);
    setTranscript('');
  }, []);

  return {
    isListening,
    transcript,
    lastDetection,
    startListening,
    stopListening,
    resetDetection,
  };
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}
