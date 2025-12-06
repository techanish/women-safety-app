import React, { useState, useEffect } from 'react';
import { Phone, PhoneOff, User, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FakeCallScreenProps {
  callerName: string;
  callerNumber: string;
  onAnswer: () => void;
  onDecline: () => void;
  onClose: () => void;
  isAnswered?: boolean;
}

export function FakeCallScreen({
  callerName,
  callerNumber,
  onAnswer,
  onDecline,
  onClose,
  isAnswered = false,
}: FakeCallScreenProps) {
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);

  useEffect(() => {
    if (isAnswered) {
      const interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isAnswered]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-b from-navy to-background flex flex-col">
      {/* Status bar space */}
      <div className="h-12 safe-area-top" />
      
      {/* Caller info */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        {/* Avatar */}
        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-secondary to-lavender flex items-center justify-center mb-6 shadow-glow">
          <User className="w-16 h-16 text-secondary-foreground" />
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
          "text-sm",
          isAnswered ? "text-safe" : "text-accent"
        )}>
          {isAnswered ? formatDuration(callDuration) : 'Incoming call...'}
        </p>
        
        {/* In-call controls */}
        {isAnswered && (
          <div className="flex gap-8 mt-12">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={cn(
                "p-4 rounded-full transition-all",
                isMuted ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
              )}
            >
              {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
            </button>
            <button
              onClick={() => setIsSpeaker(!isSpeaker)}
              className={cn(
                "p-4 rounded-full transition-all",
                isSpeaker ? "bg-accent/20 text-accent" : "bg-muted text-muted-foreground"
              )}
            >
              <Volume2 className="w-6 h-6" />
            </button>
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
              onClick={onClose}
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
