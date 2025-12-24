import React, { useState, useEffect, useCallback } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SOSButton } from '@/components/SOSButton';
import { QuickActions } from '@/components/QuickActions';
import { LocationMap } from '@/components/LocationMap';
import { SafeModeToggle } from '@/components/SafeModeToggle';
import { BottomNav } from '@/components/BottomNav';
import { FakeCallScreen } from '@/components/FakeCallScreen';
import { CheckInTimer } from '@/components/CheckInTimer';
import { EmergencyContacts } from '@/components/EmergencyContacts';
import { SettingsPanel } from '@/components/SettingsPanel';
import { AlertHistory } from '@/components/AlertHistory';
import { LocationPanel } from '@/components/LocationPanel';
import { SOSActiveOverlay } from '@/components/SOSActiveOverlay';
import { FakeCallSetup } from '@/components/FakeCallSetup';
import { SafeRoutePanel } from '@/components/SafeRoutePanel';
import { SafetyProvider, useSafety } from '@/contexts/SafetyContext';
import { useVoiceDetection } from '@/hooks/useVoiceDetection';
import { toast } from 'sonner';

function Dashboard() {
  const { 
    isSafeMode, 
    emergencyContacts, 
    shareLocation, 
    isSendingSMS, 
    voiceDetectionEnabled, 
    settings, 
    triggerSOS,
    isInSafeZone,
    currentSafeZone 
  } = useSafety();
  
  const [activeTab, setActiveTab] = useState('home');
  const [showFakeCallSetup, setShowFakeCallSetup] = useState(false);
  const [showFakeCall, setShowFakeCall] = useState(false);
  const [fakeCallAnswered, setFakeCallAnswered] = useState(false);
  const [fakeCallConfig, setFakeCallConfig] = useState<{
    name: string;
    number: string;
    persona: 'father' | 'mother' | 'friend' | 'brother';
  }>({
    name: 'Papa',
    number: '+91 98765 43210',
    persona: 'father'
  });
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [showContacts, setShowContacts] = useState(false);
  const [showSafeRoute, setShowSafeRoute] = useState(false);

  // Voice detection for SOS trigger words
  const handleKeywordDetected = useCallback((keyword: string) => {
    toast.error(`SOS keyword detected: "${keyword}"`);
    triggerSOS('voice');
  }, [triggerSOS]);

  useVoiceDetection({
    keywords: settings.voiceKeywords,
    onKeywordDetected: handleKeywordDetected,
    enabled: voiceDetectionEnabled && !isSafeMode,
  });

  const handleFakeCallSetup = () => {
    setShowFakeCallSetup(true);
  };

  const handleStartFakeCall = (config: { name: string; number: string; persona: 'father' | 'mother' | 'friend' | 'brother' }) => {
    setFakeCallConfig(config);
    setShowFakeCallSetup(false);
    setFakeCallAnswered(false);
    setShowFakeCall(true);
  };

  const handleShareLocation = async () => {
    await shareLocation();
  };

  const handleSafeRoute = () => {
    setShowSafeRoute(true);
  };

  const handleNearby = () => {
    // Open Google Maps search for nearby police stations, hospitals
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        window.open(`https://www.google.com/maps/search/police+station+OR+hospital/@${latitude},${longitude},14z`, '_blank');
      });
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'location':
        return <LocationPanel />;
      case 'history':
        return <AlertHistory />;
      case 'settings':
        return <SettingsPanel />;
      default:
        return (
          <div className="flex flex-col h-full p-6 pb-24">
            {/* Header */}
            <header className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-display font-bold text-foreground">
                  SafeHer
                </h1>
                <p className="text-sm text-muted-foreground">
                  {isSafeMode ? 'Protected mode active' : isInSafeZone ? `In safe zone: ${currentSafeZone?.name}` : 'Your safety companion'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {voiceDetectionEnabled && !isSafeMode && (
                  <span className="text-xs px-2 py-1 rounded-full bg-accent/20 text-accent">
                    🎤 Listening
                  </span>
                )}
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary" />
                </Button>
              </div>
            </header>

            {/* Safe Mode Toggle */}
            <SafeModeToggle />

            {/* SOS Button Section */}
            <div className="flex-1 flex flex-col items-center justify-center py-8">
              <SOSButton size="large" />
              <p className="mt-4 text-sm text-muted-foreground text-center">
                Tap to instantly trigger emergency alert
              </p>
            </div>

            {/* Location Map */}
            <div className="mb-6">
              <LocationMap />
            </div>

            {/* Quick Actions */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Quick Actions
              </h3>
              <QuickActions
                onFakeCall={handleFakeCallSetup}
                onShareLocation={handleShareLocation}
                onSafeRoute={handleSafeRoute}
                onCheckIn={() => setShowCheckIn(true)}
                onContacts={() => setShowContacts(true)}
                onNearby={handleNearby}
              />
            </div>

            {/* Emergency contacts reminder */}
            {emergencyContacts.length === 0 && (
              <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
                <p className="text-sm text-primary font-medium">
                  ⚠️ Add emergency contacts for SOS alerts
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 text-primary"
                  onClick={() => setShowContacts(true)}
                >
                  Add contacts →
                </Button>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {renderContent()}
      
      {/* Bottom Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Overlays */}
      <SOSActiveOverlay />

      {/* Fake Call Setup */}
      {showFakeCallSetup && (
        <FakeCallSetup
          onClose={() => setShowFakeCallSetup(false)}
          onStartCall={handleStartFakeCall}
        />
      )}

      {/* Fake Call Screen */}
      {showFakeCall && (
        <FakeCallScreen
          callerName={fakeCallConfig.name}
          callerNumber={fakeCallConfig.number}
          persona={fakeCallConfig.persona}
          isAnswered={fakeCallAnswered}
          onAnswer={() => setFakeCallAnswered(true)}
          onDecline={() => setShowFakeCall(false)}
          onClose={() => setShowFakeCall(false)}
        />
      )}

      {/* Check-In Timer */}
      {showCheckIn && (
        <CheckInTimer onClose={() => setShowCheckIn(false)} />
      )}

      {/* Emergency Contacts */}
      {showContacts && (
        <EmergencyContacts onClose={() => setShowContacts(false)} />
      )}

      {/* Safe Route Panel */}
      {showSafeRoute && (
        <SafeRoutePanel onClose={() => setShowSafeRoute(false)} />
      )}
    </div>
  );
}

const Index = () => {
  return (
    <SafetyProvider>
      <Dashboard />
    </SafetyProvider>
  );
};

export default Index;
