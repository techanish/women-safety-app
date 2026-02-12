import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Volume2, VolumeX, Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast';
import { useTextToSpeech, INDIAN_VOICES } from '@/hooks/useTextToSpeech';

// Extend Window interface for Speech Recognition
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

interface FakeCallScreenProps {
  callerName: string;
  callerNumber: string;
  persona: 'father' | 'mother' | 'friend' | 'brother';
  onAnswer: () => void;
  onDecline: () => void;
  onClose: () => void;
  isAnswered?: boolean;
}

export function FakeCallScreen({
  callerName,
  callerNumber,
  persona,
  onAnswer,
  onDecline,
  onClose,
  isAnswered = false,
}: FakeCallScreenProps) {
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(true);
  const [aiMessage, setAiMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<{role: string, content: string}[]>([]);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { speak, stop, isPlaying } = useTextToSpeech();

  // Get voice based on persona
  const getVoiceForPersona = () => {
    switch (persona) {
      case 'mother':
      case 'friend':
        return { 
          voiceName: INDIAN_VOICES.female.name, 
          languageCode: INDIAN_VOICES.female.language 
        };
      case 'father':
      case 'brother':
      default:
        return { 
          voiceName: INDIAN_VOICES.male.name, 
          languageCode: INDIAN_VOICES.male.language 
        };
    }
  };

  // Timer for call duration
  useEffect(() => {
    if (isAnswered) {
      const interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isAnswered]);

  // Get AI response when call is answered
  useEffect(() => {
    if (isAnswered && conversationHistory.length === 0) {
      getAIResponse();
    }
    // getAIResponse defined below, this is intentionally not in deps to avoid loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAnswered, conversationHistory.length]);

  // Speak AI message using Google Cloud TTS
  useEffect(() => {
    if (aiMessage && isAnswered && isSpeaker && !isPlaying) {
      const voice = getVoiceForPersona();
      speak(aiMessage, voice);
    }
    // getVoiceForPersona, speak, and isPlaying are stable references
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiMessage, isSpeaker, isAnswered]);

  const getAIResponse = async (userMessage?: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('fake-call-ai', {
        body: { 
          persona, 
          userMessage,
          conversationHistory 
        }
      });

      if (error) throw error;

      const response = data.message;
      setAiMessage(response);
      
      // Update conversation history
      if (userMessage) {
        setConversationHistory(prev => [
          ...prev,
          { role: 'user', content: userMessage },
          { role: 'assistant', content: response }
        ]);
      } else {
        setConversationHistory([{ role: 'assistant', content: response }]);
      }

    } catch (error) {
      console.error('Error getting AI response:', error);
      // Fallback messages
      const fallbacks: Record<string, string> = {
        father: "Hello beta, how are you? Everything okay?",
        mother: "Hello beta! Khana khaya? I was worried about you.",
        friend: "Hey! What's up? I was just thinking about you!",
        brother: "Hey, what's going on? You okay?"
      };
      const fallbackMessage = fallbacks[persona] || "Hello? Can you hear me?";
      setAiMessage(fallbackMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const startListening = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-IN';

      recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript;
        getAIResponse(transcript);
      };

      recognitionRef.current.onerror = (event: Event) => {
        console.error('Speech recognition error:', event);
      };

      recognitionRef.current.start();
    } else {
      toast.error('Speech recognition not supported');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const handleEndCall = () => {
    stop();
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    onClose();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getPersonaAvatar = () => {
    switch (persona) {
      case 'father': return '👨';
      case 'mother': return '👩';
      case 'friend': return '👧';
      case 'brother': return '👦';
      default: return '👤';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-b from-background to-card flex flex-col">
      {/* Status bar space */}
      <div className="h-12 safe-area-top" />
      
      {/* Caller info */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        {/* Avatar */}
        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center mb-6 shadow-lg border border-primary/20">
          <span className="text-6xl">{getPersonaAvatar()}</span>
        </div>
        
        {/* Name and number */}
        <h1 className="text-3xl font-display font-bold text-foreground mb-2">
          {callerName}
        </h1>
        <p className="text-lg text-muted-foreground mb-4">
          {callerNumber}
        </p>
        
        {/* Call status */}
        <p className={cn(
          "text-sm mb-4",
          isAnswered ? "text-safe" : "text-primary"
        )}>
          {isAnswered ? formatDuration(callDuration) : 'Incoming call...'}
        </p>

        {/* AI Message Display */}
        {isAnswered && (
          <div className="w-full max-w-sm p-4 rounded-2xl bg-card/50 border border-border/50 mb-6">
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            ) : (
              <p className="text-sm text-foreground text-center italic">
                "{aiMessage}"
              </p>
            )}
          </div>
        )}
        
        {/* In-call controls */}
        {isAnswered && (
          <div className="flex gap-6 mt-4">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={cn(
                "p-4 rounded-full transition-all",
                isMuted ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
              )}
            >
              {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>
            <button
              onClick={() => {
                setIsSpeaker(!isSpeaker);
                if (isSpeaker) stop();
              }}
              className={cn(
                "p-4 rounded-full transition-all",
                isSpeaker ? "bg-accent/20 text-accent" : "bg-muted text-muted-foreground"
              )}
            >
              {isSpeaker ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
            </button>
          </div>
        )}

        {/* Speak to respond */}
        {isAnswered && (
          <div className="mt-6">
            <Button
              variant="outline"
              size="lg"
              onMouseDown={startListening}
              onMouseUp={stopListening}
              onTouchStart={startListening}
              onTouchEnd={stopListening}
              className="gap-2"
            >
              <Mic className="w-4 h-4" />
              Hold to speak
            </Button>
          </div>
        )}
      </div>
      
      {/* Action buttons */}
      <div className="p-8 pb-12 safe-area-bottom">
        {isAnswered ? (
          <div className="flex justify-center">
            <Button
              variant="destructive"
              size="icon-xl"
              className="rounded-full h-16 w-16"
              onClick={handleEndCall}
            >
              <PhoneOff className="w-8 h-8" />
            </Button>
          </div>
        ) : (
          <div className="flex justify-center gap-6">
            <Button
              variant="destructive"
              size="icon-xl"
              className="rounded-full h-16 w-16"
              onClick={onDecline}
            >
              <PhoneOff className="w-8 h-8" />
            </Button>
            <Button
              variant="safe"
              size="icon-xl"
              className="rounded-full h-16 w-16"
              onClick={onAnswer}
            >
              <Phone className="w-8 h-8" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
