import React from 'react';
import { Phone, MapPin, Route, Shield, Volume2, Clock, Users, Map } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface QuickActionProps {
  icon: React.ReactNode;
  label: string;
  description?: string;
  onClick: () => void;
  variant?: 'default' | 'accent' | 'warning';
  className?: string;
}

function QuickAction({ icon, label, description, onClick, variant = 'default', className }: QuickActionProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-2 p-4 rounded-2xl transition-all duration-200",
        "hover:scale-105 active:scale-95",
        variant === 'default' && "glass hover:bg-card/90",
        variant === 'accent' && "bg-accent/20 hover:bg-accent/30 border border-accent/30",
        variant === 'warning' && "bg-warning/20 hover:bg-warning/30 border border-warning/30",
        className
      )}
    >
      <div className={cn(
        "p-3 rounded-xl",
        variant === 'default' && "bg-secondary/20 text-secondary",
        variant === 'accent' && "bg-accent/30 text-accent",
        variant === 'warning' && "bg-warning/30 text-warning"
      )}>
        {icon}
      </div>
      <span className="text-sm font-medium text-foreground">{label}</span>
      {description && (
        <span className="text-xs text-muted-foreground">{description}</span>
      )}
    </button>
  );
}

interface QuickActionsProps {
  onFakeCall: () => void;
  onShareLocation: () => void;
  onSafeRoute: () => void;
  onCheckIn: () => void;
  onContacts: () => void;
  onNearby: () => void;
}

export function QuickActions({
  onFakeCall,
  onShareLocation,
  onSafeRoute,
  onCheckIn,
  onContacts,
  onNearby,
}: QuickActionsProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <QuickAction
        icon={<Phone className="w-6 h-6" />}
        label="Fake Call"
        onClick={onFakeCall}
        variant="warning"
      />
      <QuickAction
        icon={<MapPin className="w-6 h-6" />}
        label="Share Location"
        onClick={onShareLocation}
        variant="accent"
      />
      <QuickAction
        icon={<Route className="w-6 h-6" />}
        label="Safe Route"
        onClick={onSafeRoute}
      />
      <QuickAction
        icon={<Clock className="w-6 h-6" />}
        label="Check-In Timer"
        onClick={onCheckIn}
        variant="accent"
      />
      <QuickAction
        icon={<Users className="w-6 h-6" />}
        label="Contacts"
        onClick={onContacts}
      />
      <QuickAction
        icon={<Map className="w-6 h-6" />}
        label="Nearby Help"
        onClick={onNearby}
        variant="warning"
      />
    </div>
  );
}
