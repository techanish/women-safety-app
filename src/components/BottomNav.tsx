import React from 'react';
import { Home, Shield, Clock, Settings, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navItems = [
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'location', icon: MapPin, label: 'Location' },
  { id: 'history', icon: Clock, label: 'History' },
  { id: 'settings', icon: Settings, label: 'Settings' },
];

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 glass-strong pb-safe border-t border-border/50">
      <div className="flex justify-around items-center h-16 px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all",
                isActive
                  ? "text-accent"
                  : "text-muted-foreground/80 hover:text-foreground transition-colors"
              )}
            >
              <Icon className="w-5 h-5 transition-colors" />
              <span className="text-xs font-medium">{item.label}</span>
              {isActive && (
                <div className="absolute bottom-1 w-1 h-1 rounded-full bg-accent" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
