import React from 'react';
import { Shield, ShieldCheck } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useSafety } from '@/contexts/SafetyContext';
import { cn } from '@/lib/utils';

export function SafeModeToggle() {
  const { isSafeMode, toggleSafeMode } = useSafety();

  return (
    <div className={cn(
      "flex items-center justify-between p-3 sm:p-4 rounded-2xl transition-all duration-300 w-full max-w-2xl mx-auto",
      isSafeMode
        ? "bg-safe/30 border-2 border-safe"
        : "glass"
    )}>
      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
        {isSafeMode ? (
          <div className="p-1.5 sm:p-2 rounded-xl bg-safe/30">
            <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-safe" />
          </div>
        ) : (
          <div className="p-1.5 sm:p-2 rounded-xl bg-muted">
            <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
          </div>
        )}
        <div className="min-w-0">
          <p className="font-medium text-foreground text-sm sm:text-base">Safe Mode</p>
          <p className="text-xs text-muted-foreground">
            {isSafeMode ? 'All protections active' : 'Tap to enable'}
          </p>
        </div>
      </div>
      <Switch
        checked={isSafeMode}
        onCheckedChange={toggleSafeMode}
        className="data-[state=checked]:bg-safe"
      />
    </div>
  );
}
