import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useSafety } from '@/contexts/SafetyContext';
import { cn } from '@/lib/utils';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VoiceKeywordsDialog({ isOpen, onClose }: DialogProps) {
  const { settings, updateSettings } = useSafety();
  const [newKeyword, setNewKeyword] = useState('');

  if (!isOpen) return null;

  const addKeyword = () => {
    if (newKeyword.trim() && !settings.voiceKeywords.includes(newKeyword.trim())) {
      updateSettings({
        voiceKeywords: [...settings.voiceKeywords, newKeyword.trim()]
      });
      setNewKeyword('');
    }
  };

  const removeKeyword = (keyword: string) => {
    updateSettings({
      voiceKeywords: settings.voiceKeywords.filter(k => k !== keyword)
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md glass rounded-3xl p-6 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-display font-bold text-foreground">Voice Keywords</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          Say any of these words to trigger SOS alert:
        </p>

        <div className="flex gap-2 mb-4">
          <Input
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            placeholder="Add new keyword..."
            onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
          />
          <Button onClick={addKeyword} size="icon">
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-2 max-h-60 overflow-y-auto">
          {settings.voiceKeywords.map((keyword) => (
            <div 
              key={keyword}
              className="flex items-center justify-between p-3 rounded-xl bg-muted/50"
            >
              <span className="text-foreground">{keyword}</span>
              <Button 
                variant="ghost" 
                size="icon"
                className="text-destructive hover:text-destructive"
                onClick={() => removeKeyword(keyword)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>

        <Button className="w-full mt-6" onClick={onClose}>
          Done
        </Button>
      </div>
    </div>
  );
}

export function NotificationsDialog({ isOpen, onClose }: DialogProps) {
  const [sosAlerts, setSosAlerts] = useState(true);
  const [checkInReminders, setCheckInReminders] = useState(true);
  const [locationUpdates, setLocationUpdates] = useState(false);
  const [safeZoneAlerts, setSafeZoneAlerts] = useState(true);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md glass rounded-3xl p-6 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-display font-bold text-foreground">Notifications</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
            <div>
              <p className="font-medium text-foreground">SOS Alerts</p>
              <p className="text-sm text-muted-foreground">Get notified when SOS is triggered</p>
            </div>
            <Switch checked={sosAlerts} onCheckedChange={setSosAlerts} />
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
            <div>
              <p className="font-medium text-foreground">Check-In Reminders</p>
              <p className="text-sm text-muted-foreground">Remind before timer expires</p>
            </div>
            <Switch checked={checkInReminders} onCheckedChange={setCheckInReminders} />
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
            <div>
              <p className="font-medium text-foreground">Location Updates</p>
              <p className="text-sm text-muted-foreground">Notify when location changes</p>
            </div>
            <Switch checked={locationUpdates} onCheckedChange={setLocationUpdates} />
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
            <div>
              <p className="font-medium text-foreground">Safe Zone Alerts</p>
              <p className="text-sm text-muted-foreground">Notify when leaving safe zones</p>
            </div>
            <Switch checked={safeZoneAlerts} onCheckedChange={setSafeZoneAlerts} />
          </div>
        </div>

        <Button className="w-full mt-6" onClick={onClose}>
          Save Preferences
        </Button>
      </div>
    </div>
  );
}

export function PrivacyDialog({ isOpen, onClose }: DialogProps) {
  const [encryptData, setEncryptData] = useState(true);
  const [anonymousMode, setAnonymousMode] = useState(false);
  const [deleteAfter, setDeleteAfter] = useState(true);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md glass rounded-3xl p-6 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-display font-bold text-foreground">Privacy & Security</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
            <div>
              <p className="font-medium text-foreground">Encrypt Data</p>
              <p className="text-sm text-muted-foreground">End-to-end encryption for all data</p>
            </div>
            <Switch checked={encryptData} onCheckedChange={setEncryptData} />
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
            <div>
              <p className="font-medium text-foreground">Anonymous Mode</p>
              <p className="text-sm text-muted-foreground">Hide identity in location shares</p>
            </div>
            <Switch checked={anonymousMode} onCheckedChange={setAnonymousMode} />
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
            <div>
              <p className="font-medium text-foreground">Auto-Delete History</p>
              <p className="text-sm text-muted-foreground">Delete old alerts after 30 days</p>
            </div>
            <Switch checked={deleteAfter} onCheckedChange={setDeleteAfter} />
          </div>
        </div>

        <div className="mt-6 p-3 rounded-xl bg-primary/10 border border-primary/20">
          <p className="text-sm text-primary">
            🔒 Your data is stored locally on your device and never shared without your consent.
          </p>
        </div>

        <Button className="w-full mt-4" onClick={onClose}>
          Save Settings
        </Button>
      </div>
    </div>
  );
}
