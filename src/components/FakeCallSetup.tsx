import React, { useState } from 'react';
import { X, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface FakeCallSetupProps {
  onClose: () => void;
  onStartCall: (config: { name: string; number: string; persona: 'father' | 'mother' | 'friend' | 'brother' }) => void;
}

const personas = [
  { id: 'father', label: 'Papa', emoji: '👨', name: 'Papa', number: '+91 98765 43210' },
  { id: 'mother', label: 'Mummy', emoji: '👩', name: 'Mummy', number: '+91 98765 43211' },
  { id: 'friend', label: 'Friend', emoji: '👧', name: 'Priya', number: '+91 98765 43212' },
  { id: 'brother', label: 'Bhaiya', emoji: '👦', name: 'Bhaiya', number: '+91 98765 43213' },
] as const;

export function FakeCallSetup({ onClose, onStartCall }: FakeCallSetupProps) {
  const [selectedPersona, setSelectedPersona] = useState<typeof personas[number]>(personas[0]);
  const [customName, setCustomName] = useState('');
  const [customNumber, setCustomNumber] = useState('');
  const [delay, setDelay] = useState(3);

  const handleStartCall = () => {
    setTimeout(() => {
      onStartCall({
        name: customName || selectedPersona.name,
        number: customNumber || selectedPersona.number,
        persona: selectedPersona.id,
      });
    }, delay * 1000);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl flex flex-col p-6 safe-area-top safe-area-bottom">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-display font-bold text-foreground">Fake Call</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-6 h-6" />
        </Button>
      </div>

      <p className="text-muted-foreground mb-6">
        Choose who should "call" you. An AI will speak as this person when you answer.
      </p>

      {/* Persona Selection */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {personas.map((persona) => (
          <button
            key={persona.id}
            onClick={() => setSelectedPersona(persona)}
            className={cn(
              "p-4 rounded-2xl flex flex-col items-center gap-2 transition-all",
              selectedPersona.id === persona.id
                ? "bg-primary/20 border-2 border-primary"
                : "glass hover:bg-card/90"
            )}
          >
            <span className="text-4xl">{persona.emoji}</span>
            <span className="font-medium text-foreground">{persona.label}</span>
          </button>
        ))}
      </div>

      {/* Custom Name/Number */}
      <div className="space-y-3 mb-6">
        <Input
          placeholder={`Caller name (default: ${selectedPersona.name})`}
          value={customName}
          onChange={(e) => setCustomName(e.target.value)}
          className="bg-muted/50"
        />
        <Input
          placeholder={`Phone number (default: ${selectedPersona.number})`}
          value={customNumber}
          onChange={(e) => setCustomNumber(e.target.value)}
          className="bg-muted/50"
        />
      </div>

      {/* Delay Selection */}
      <div className="mb-6">
        <p className="text-sm text-muted-foreground mb-3">Call in:</p>
        <div className="flex gap-2">
          {[3, 5, 10, 30].map((sec) => (
            <button
              key={sec}
              onClick={() => setDelay(sec)}
              className={cn(
                "px-4 py-2 rounded-xl font-medium transition-all flex-1",
                delay === sec
                  ? "bg-primary text-primary-foreground"
                  : "glass hover:bg-card/90"
              )}
            >
              {sec}s
            </button>
          ))}
        </div>
      </div>

      {/* Start Button */}
      <div className="flex-1" />
      <Button
        variant="default"
        size="xl"
        onClick={handleStartCall}
        className="w-full bg-gradient-to-r from-primary to-primary/80"
      >
        <Phone className="w-5 h-5 mr-2" />
        Schedule Call in {delay} seconds
      </Button>
    </div>
  );
}
