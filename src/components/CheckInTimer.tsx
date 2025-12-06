import React, { useState, useEffect } from 'react';
import { Clock, X, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSafety } from '@/contexts/SafetyContext';
import { cn } from '@/lib/utils';

interface CheckInTimerProps {
  onClose: () => void;
}

export function CheckInTimer({ onClose }: CheckInTimerProps) {
  const { checkInTimer, cancelCheckInTimer, confirmSafe, startCheckInTimer, triggerSOS } = useSafety();
  const [selectedDuration, setSelectedDuration] = useState(15);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const durations = [5, 15, 30, 60, 120];

  useEffect(() => {
    if (checkInTimer?.isActive) {
      const interval = setInterval(() => {
        const remaining = Math.max(0, checkInTimer.endTime - Date.now());
        setTimeLeft(remaining);
        
        if (remaining <= 0) {
          triggerSOS('timer');
          clearInterval(interval);
        }
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [checkInTimer, triggerSOS]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    if (!checkInTimer || timeLeft === null) return 0;
    const total = checkInTimer.duration * 60 * 1000;
    return ((total - timeLeft) / total) * 100;
  };

  if (checkInTimer?.isActive && timeLeft !== null) {
    const progress = getProgress();
    const isWarning = timeLeft < 60000; // Less than 1 minute

    return (
      <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl flex flex-col items-center justify-center p-6">
        {/* Timer display */}
        <div className="relative w-64 h-64 mb-8">
          {/* Background circle */}
          <svg className="w-full h-full -rotate-90">
            <circle
              cx="128"
              cy="128"
              r="120"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-muted"
            />
            <circle
              cx="128"
              cy="128"
              r="120"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeLinecap="round"
              className={cn(
                "transition-all duration-1000",
                isWarning ? "text-primary" : "text-accent"
              )}
              strokeDasharray={`${(progress / 100) * 754} 754`}
            />
          </svg>
          
          {/* Time display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {isWarning && (
              <AlertTriangle className="w-8 h-8 text-primary mb-2 animate-pulse" />
            )}
            <span className={cn(
              "text-5xl font-display font-bold",
              isWarning ? "text-primary" : "text-foreground"
            )}>
              {formatTime(timeLeft)}
            </span>
            <span className="text-sm text-muted-foreground mt-2">
              until SOS triggers
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-4 w-full max-w-xs">
          <Button
            variant="safe"
            size="xl"
            onClick={() => {
              confirmSafe();
              onClose();
            }}
            className="w-full"
          >
            <CheckCircle2 className="w-5 h-5 mr-2" />
            I'm Safe
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => {
              cancelCheckInTimer();
              onClose();
            }}
            className="w-full"
          >
            Cancel Timer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl flex flex-col p-6 safe-area-top safe-area-bottom">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-display font-bold text-foreground">Check-In Timer</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-6 h-6" />
        </Button>
      </div>

      {/* Description */}
      <p className="text-muted-foreground mb-8">
        Set a timer. If you don't confirm you're safe before it ends, SOS will automatically trigger.
      </p>

      {/* Duration selector */}
      <div className="flex flex-wrap gap-3 mb-8">
        {durations.map((duration) => (
          <button
            key={duration}
            onClick={() => setSelectedDuration(duration)}
            className={cn(
              "px-6 py-3 rounded-xl font-medium transition-all",
              selectedDuration === duration
                ? "bg-accent text-accent-foreground"
                : "glass hover:bg-card/90"
            )}
          >
            {duration < 60 ? `${duration} min` : `${duration / 60} hr`}
          </button>
        ))}
      </div>

      {/* Start button */}
      <div className="flex-1" />
      <Button
        variant="accent"
        size="xl"
        onClick={() => {
          startCheckInTimer(selectedDuration);
        }}
        className="w-full"
      >
        <Clock className="w-5 h-5 mr-2" />
        Start {selectedDuration} minute timer
      </Button>
    </div>
  );
}
