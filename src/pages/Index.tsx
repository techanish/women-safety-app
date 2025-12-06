import React, { useState } from 'react';
import { Bell, Menu, Shield } from 'lucide-react';
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
import { SafetyProvider, useSafety } from '@/contexts/SafetyContext';
import { cn } from '@/lib/utils';

function Dashboard() {
  const { isSafeMode, isSOSActive, emergencyContacts } = useSafety();
  const [activeTab, setActiveTab] = useState('home');
  const [showFakeCall, setShowFakeCall] = useState(false);
  const [fakeCallAnswered, setFakeCallAnswered] = useState(false);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [showContacts, setShowContacts] = useState(false);

  const handleFakeCall = () => {
    setFakeCallAnswered(false);
    setShowFakeCall(true);
  };

  const handleShareLocation = () => {
    // Share location logic
    if (navigator.share) {
      navigator.share({
        title: 'My Location',
        text: 'I am sharing my live location with you.',
        url: window.location.href,
      });
    }
  };

  const handleSafeRoute = () => {
    // Safe route logic
  };

  const handleNearby = () => {
    // Nearby help logic
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
                  {isSafeMode ? 'Protected mode active' : 'Your safety companion'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-accent" />
                </Button>
              </div>
            </header>

            {/* Safe Mode Toggle */}
            <SafeModeToggle />

            {/* SOS Button Section */}
            <div className="flex-1 flex flex-col items-center justify-center py-8">
              <SOSButton size="large" />
              <p className="mt-4 text-sm text-muted-foreground text-center">
                Hold for 2 seconds to activate emergency alert
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
                onFakeCall={handleFakeCall}
                onShareLocation={handleShareLocation}
                onSafeRoute={handleSafeRoute}
                onCheckIn={() => setShowCheckIn(true)}
                onContacts={() => setShowContacts(true)}
                onNearby={handleNearby}
              />
            </div>

            {/* Emergency contacts reminder */}
            {emergencyContacts.length === 0 && (
              <div className="p-4 rounded-2xl bg-warning/10 border border-warning/20 mb-4">
                <p className="text-sm text-warning font-medium">
                  ⚠️ Add emergency contacts for SOS alerts
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 text-warning"
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
    <div className="min-h-screen bg-gradient-hero">
      {renderContent()}
      
      {/* Bottom Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Overlays */}
      <SOSActiveOverlay />

      {/* Fake Call Screen */}
      {showFakeCall && (
        <FakeCallScreen
          callerName="Mom"
          callerNumber="+91 98765 43210"
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
