import React from 'react';
import { Button } from '@/components/ui/button';
import { useSafety } from '@/contexts/SafetyContext';
import { cn } from '@/lib/utils';

interface SOSButtonProps {
  size?: 'default' | 'large';
  className?: string;
}

export function SOSButton({ size = 'default', className }: SOSButtonProps) {
  const { triggerSOS, isSOSActive, cancelSOS } = useSafety();

  const isLarge = size === 'large';

  const handleSOSClick = () => {
    if (isSOSActive) {
      cancelSOS();
    } else {
      triggerSOS('button');
    }
  };

  if (isSOSActive) {
    return (
      <div className={cn("relative", className)}>
        {/* Pulsing rings */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={cn(
            "absolute rounded-full bg-primary/30 sos-ring",
            isLarge ? "w-44 h-44" : "w-24 h-24"
          )} />
          <div className={cn(
            "absolute rounded-full bg-primary/20 sos-ring",
            isLarge ? "w-52 h-52" : "w-28 h-28"
          )} style={{ animationDelay: '0.5s' }} />
          <div className={cn(
            "absolute rounded-full bg-primary/10 sos-ring",
            isLarge ? "w-60 h-60" : "w-32 h-32"
          )} style={{ animationDelay: '1s' }} />
        </div>
        
        <Button
          variant="sos"
          size={isLarge ? "sos" : "icon-xl"}
          className={cn(
            "relative z-10 sos-pulse danger-glow",
            isLarge && "h-40 w-40 text-3xl"
          )}
          onClick={handleSOSClick}
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
      {/* Subtle glow behind button */}
      <div className={cn(
        "absolute rounded-full bg-primary/20 blur-xl",
        isLarge ? "inset-4" : "inset-2"
      )} />
      
      <Button
        variant="sos"
        size={isLarge ? "sos" : "icon-xl"}
        className={cn(
          "relative z-10 select-none touch-none danger-glow hover:scale-105 active:scale-95 transition-transform",
          isLarge && "h-40 w-40 text-3xl"
        )}
        onClick={handleSOSClick}
      >
        <div className="flex flex-col items-center gap-1">
          <span className={cn(
            "font-bold tracking-wider",
            isLarge ? "text-4xl" : "text-xl"
          )}>
            SOS
          </span>
          {isLarge && (
            <span className="text-xs opacity-80 font-normal">
              Tap to activate
            </span>
          )}
        </div>
      </Button>
    </div>
  );
}
