import React, { useState } from 'react';
import { 
  Mic, 
  Vibrate, 
  Volume2, 
  MapPin, 
  Battery, 
  Bell,
  Languages,
  Shield,
  ChevronRight
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useSafety } from '@/contexts/SafetyContext';
import { cn } from '@/lib/utils';
import { VoiceKeywordsDialog, NotificationsDialog, PrivacyDialog } from './SettingsDialogs';

interface SettingItemProps {
  icon: React.ReactNode;
  label: string;
  description?: string;
  action?: React.ReactNode;
  onClick?: () => void;
}

function SettingItem({ icon, label, description, action, onClick }: SettingItemProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center gap-4 p-4 rounded-xl transition-all",
        onClick && "cursor-pointer hover:bg-muted/50"
      )}
    >
      <div className="p-2 rounded-lg bg-muted/50 text-muted-foreground">
        {icon}
      </div>
      <div className="flex-1">
        <p className="font-medium text-foreground">{label}</p>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action || (onClick && <ChevronRight className="w-5 h-5 text-muted-foreground" />)}
    </div>
  );
}

export function SettingsPanel() {
  const { settings, updateSettings } = useSafety();
  const [showVoiceKeywords, setShowVoiceKeywords] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  return (
    <div className="flex flex-col h-full p-6 pb-24">
      <h2 className="text-2xl font-display font-bold text-foreground mb-6">Settings</h2>

      {/* Trigger Settings */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          SOS Triggers
        </h3>
        <div className="glass rounded-2xl overflow-hidden divide-y divide-border/50">
          <SettingItem
            icon={<Mic className="w-5 h-5" />}
            label="Voice Commands"
            description="Say 'Help me' or 'बचाओ' to trigger SOS"
            action={
              <Switch
                checked={settings.voiceCommandEnabled}
                onCheckedChange={(checked) => 
                  updateSettings({ voiceCommandEnabled: checked })
                }
              />
            }
          />
          <SettingItem
            icon={<Vibrate className="w-5 h-5" />}
            label="Shake Detection"
            description="Shake phone vigorously to trigger SOS"
            action={
              <Switch
                checked={settings.shakeDetectionEnabled}
                onCheckedChange={(checked) => 
                  updateSettings({ shakeDetectionEnabled: checked })
                }
              />
            }
          />
          <SettingItem
            icon={<Volume2 className="w-5 h-5" />}
            label="Loud Siren"
            description="Play siren when SOS is triggered"
            action={
              <Switch
                checked={settings.sirenEnabled}
                onCheckedChange={(checked) => 
                  updateSettings({ sirenEnabled: checked })
                }
              />
            }
          />
        </div>
      </div>

      {/* Location Settings */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Location & Tracking
        </h3>
        <div className="glass rounded-2xl overflow-hidden divide-y divide-border/50">
          <SettingItem
            icon={<MapPin className="w-5 h-5" />}
            label="Background Tracking"
            description="Continue tracking when app is closed"
            action={
              <Switch
                checked={settings.backgroundTrackingEnabled}
                onCheckedChange={(checked) => 
                  updateSettings({ backgroundTrackingEnabled: checked })
                }
              />
            }
          />
          <SettingItem
            icon={<Battery className="w-5 h-5" />}
            label="Low Battery Alert"
            description="Send last location when battery is low"
            action={
              <Switch
                checked={settings.lowBatteryAlertEnabled}
                onCheckedChange={(checked) => 
                  updateSettings({ lowBatteryAlertEnabled: checked })
                }
              />
            }
          />
        </div>
      </div>

      {/* Customization */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Customization
        </h3>
        <div className="glass rounded-2xl overflow-hidden divide-y divide-border/50">
          <SettingItem
            icon={<Languages className="w-5 h-5" />}
            label="Voice Keywords"
            description="Customize trigger words"
            onClick={() => setShowVoiceKeywords(true)}
          />
          <SettingItem
            icon={<Bell className="w-5 h-5" />}
            label="Notifications"
            description="Manage alert preferences"
            onClick={() => setShowNotifications(true)}
          />
          <SettingItem
            icon={<Shield className="w-5 h-5" />}
            label="Privacy & Security"
            description="Data encryption settings"
            onClick={() => setShowPrivacy(true)}
          />
        </div>
      </div>

      {/* Dialogs */}
      <VoiceKeywordsDialog 
        isOpen={showVoiceKeywords} 
        onClose={() => setShowVoiceKeywords(false)} 
      />
      <NotificationsDialog 
        isOpen={showNotifications} 
        onClose={() => setShowNotifications(false)} 
      />
      <PrivacyDialog 
        isOpen={showPrivacy} 
        onClose={() => setShowPrivacy(false)} 
      />
    </div>
  );
}
