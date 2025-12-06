import React from 'react';
import { Shield, ShieldCheck } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useSafety } from '@/contexts/SafetyContext';
import { cn } from '@/lib/utils';

export function SafeModeToggle() {
  const { isSafeMode, toggleSafeMode } = useSafety();

  return (
    <div className={cn(
      "flex items-center justify-between p-4 rounded-2xl transition-all duration-300",
      isSafeMode 
        ? "bg-safe/20 border border-safe/30" 
        : "glass"
    )}>
      <div className="flex items-center gap-3">
        {isSafeMode ? (
          <div className="p-2 rounded-xl bg-safe/30">
            <ShieldCheck className="w-5 h-5 text-safe" />
          </div>
        ) : (
          <div className="p-2 rounded-xl bg-muted">
            <Shield className="w-5 h-5 text-muted-foreground" />
          </div>
        )}
        <div>
          <p className="font-medium text-foreground">Safe Mode</p>
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
