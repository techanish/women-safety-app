import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useSafety } from '@/contexts/SafetyContext';
import { cn } from '@/lib/utils';

interface SOSButtonProps {
  size?: 'default' | 'large';
  className?: string;
}

export function SOSButton({ size = 'default', className }: SOSButtonProps) {
  const { triggerSOS, isSOSActive, cancelSOS } = useSafety();
  const [isPressed, setIsPressed] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const holdDuration = 1500; // 1.5 seconds to activate

  const handleMouseDown = () => {
    if (isSOSActive) return;
    setIsPressed(true);
    const startTime = Date.now();
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / holdDuration) * 100, 100);
      setHoldProgress(progress);
      
      if (progress >= 100) {
        clearInterval(interval);
        triggerSOS('button');
        setIsPressed(false);
        setHoldProgress(0);
      }
    }, 16);

    const handleMouseUp = () => {
      clearInterval(interval);
      setIsPressed(false);
      setHoldProgress(0);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchend', handleMouseUp);
    };

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchend', handleMouseUp);
  };

  const isLarge = size === 'large';

  if (isSOSActive) {
    return (
      <div className={cn("relative", className)}>
        {/* Pulsing rings */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={cn(
            "absolute rounded-full bg-primary/30 sos-ring",
            isLarge ? "w-40 h-40" : "w-24 h-24"
          )} />
          <div className={cn(
            "absolute rounded-full bg-primary/20 sos-ring",
            isLarge ? "w-48 h-48" : "w-28 h-28"
          )} style={{ animationDelay: '0.5s' }} />
        </div>
        
        <Button
          variant="sos"
          size={isLarge ? "sos" : "icon-xl"}
          className={cn(
            "relative z-10 sos-pulse",
            isLarge && "h-36 w-36 text-3xl"
          )}
          onClick={cancelSOS}
        >
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold">ACTIVE</span>
            <span className="text-sm opacity-90">Tap to cancel</span>
          </div>
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      {/* Hold progress ring */}
      {isPressed && (
        <svg 
          className={cn(
            "absolute inset-0 -rotate-90 z-20 pointer-events-none",
            isLarge ? "w-36 h-36" : "w-20 h-20"
          )}
          style={{ transform: 'rotate(-90deg)' }}
        >
          <circle
            cx="50%"
            cy="50%"
            r="45%"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            className="text-primary/30"
          />
          <circle
            cx="50%"
            cy="50%"
            r="45%"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            className="text-primary-foreground"
            strokeDasharray={`${holdProgress * 2.83} 283`}
          />
        </svg>
      )}
      
      <Button
        variant="sos"
        size={isLarge ? "sos" : "icon-xl"}
        className={cn(
          "relative z-10 select-none touch-none",
          isLarge && "h-36 w-36 text-3xl",
          isPressed && "scale-95"
        )}
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
      >
        <div className="flex flex-col items-center gap-1">
          <span className={cn(
            "font-bold tracking-wider",
            isLarge ? "text-3xl" : "text-xl"
          )}>
            SOS
          </span>
          {isLarge && (
            <span className="text-xs opacity-80 font-normal">
              Hold to activate
            </span>
          )}
        </div>
      </Button>
    </div>
  );
}
