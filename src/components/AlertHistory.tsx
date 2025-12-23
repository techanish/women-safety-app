import React from 'react';
import { AlertTriangle, CheckCircle, MapPin, Clock, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSafety } from '@/contexts/SafetyContext';
import { Button } from '@/components/ui/button';

export function AlertHistory() {
  const { alertHistory } = useSafety();

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'sos':
        return <AlertTriangle className="w-5 h-5 text-primary" />;
      case 'checkin':
        return <Clock className="w-5 h-5 text-accent" />;
      case 'safezone':
        return <MapPin className="w-5 h-5 text-warning" />;
      default:
        return <CheckCircle className="w-5 h-5 text-safe" />;
    }
  };

  const getLabel = (type: string) => {
    switch (type) {
      case 'sos':
        return 'SOS Alert';
      case 'checkin':
        return 'Check-In Timer';
      case 'safezone':
        return 'Safe Zone Alert';
      case 'lowbattery':
        return 'Low Battery Alert';
      default:
        return 'Alert';
    }
  };

  const resolvedCount = alertHistory.filter(a => a.resolved).length;
  const resolvedPercentage = alertHistory.length > 0 
    ? Math.round((resolvedCount / alertHistory.length) * 100) 
    : 100;

  return (
    <div className="flex flex-col h-full p-6 pb-24">
      <h2 className="text-2xl font-display font-bold text-foreground mb-2">History</h2>
      <p className="text-muted-foreground mb-6">Past alerts and safety events</p>

      {alertHistory.length === 0 ? (
        <div className="glass p-6 rounded-2xl text-center">
          <CheckCircle className="w-12 h-12 text-safe mx-auto mb-3" />
          <h3 className="font-semibold text-foreground mb-1">No Alerts Yet</h3>
          <p className="text-sm text-muted-foreground">
            Your alert history will appear here when you trigger an SOS or other safety feature.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {alertHistory.map((alert) => (
              <div
                key={alert.id}
                className="glass p-4 rounded-2xl"
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "p-2 rounded-lg",
                    alert.type === 'sos' && "bg-primary/20",
                    alert.type === 'checkin' && "bg-accent/20",
                    alert.type === 'safezone' && "bg-warning/20",
                    alert.type === 'lowbattery' && "bg-muted"
                  )}>
                    {getIcon(alert.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-foreground">
                        {getLabel(alert.type)}
                      </span>
                      {alert.resolved ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-safe/20 text-safe">
                          Resolved
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-warning/20 text-warning">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {formatDate(alert.timestamp)}
                    </p>
                    {alert.location && (
                      <p className="text-xs text-muted-foreground mb-1">
                        📍 {alert.location.latitude.toFixed(4)}, {alert.location.longitude.toFixed(4)}
                      </p>
                    )}
                    {alert.notes && (
                      <p className="text-sm text-foreground/80">{alert.notes}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick stats */}
          <div className="mt-8 grid grid-cols-2 gap-3">
            <div className="glass p-4 rounded-2xl text-center">
              <p className="text-3xl font-display font-bold text-accent">{alertHistory.length}</p>
              <p className="text-sm text-muted-foreground">Total Alerts</p>
            </div>
            <div className="glass p-4 rounded-2xl text-center">
              <p className="text-3xl font-display font-bold text-safe">{resolvedPercentage}%</p>
              <p className="text-sm text-muted-foreground">Resolved</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
