import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Volume2, VolumeX, Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  const speechSynthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const recognitionRef = useRef<any>(null);

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
  }, [isAnswered]);

  // Speak AI message using Web Speech API
  useEffect(() => {
    if (aiMessage && isAnswered && isSpeaker) {
      speakMessage(aiMessage);
    }
  }, [aiMessage, isSpeaker]);

  const speakMessage = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = persona === 'mother' || persona === 'friend' ? 1.2 : 0.9;
      utterance.volume = 1;
      
      // Try to get a voice that matches the persona
      const voices = window.speechSynthesis.getVoices();
      const hindiVoice = voices.find(v => v.lang.includes('hi') || v.lang.includes('en-IN'));
      if (hindiVoice) {
        utterance.voice = hindiVoice;
      }
      
      speechSynthRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }
  };

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
      setAiMessage(fallbacks[persona] || "Hello? Can you hear me?");
    } finally {
      setIsLoading(false);
    }
  };

  const startListening = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-IN';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        getAIResponse(transcript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
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
    window.speechSynthesis.cancel();
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
              onClick={() => setIsSpeaker(!isSpeaker)}
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
          <div className="flex justify-center gap-16">
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
