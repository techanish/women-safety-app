import React, { useState, useEffect, useCallback } from 'react';
import { Phone, MapPin, Video, Volume2, VolumeX, CheckCircle, Mic, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSafety } from '@/contexts/SafetyContext';
import { useSiren } from '@/hooks/useSiren';
import { useMediaRecorder } from '@/hooks/useMediaRecorder';
import { cn } from '@/lib/utils';
import { AlertRecording } from '@/types/safety';

export function SOSActiveOverlay() {
  const { 
    isSOSActive, 
    cancelSOS, 
    currentLocation, 
    emergencyContacts, 
    confirmSafe, 
    settings,
    currentAlertId,
    updateAlertRecordings,
    getGoogleMapsUrl
  } = useSafety();
  
  const [elapsedTime, setElapsedTime] = useState(0);
  const [sirenActive, setSirenActive] = useState(true);
  const { startSiren, stopSiren } = useSiren();
  const { 
    isRecording, 
    duration, 
    startRecording, 
    stopRecording,
    audioUrl,
    videoUrl
  } = useMediaRecorder();

  const [recordingType, setRecordingType] = useState<'video' | 'audio'>('video');

  // Start recording when SOS is activated
  useEffect(() => {
    if (isSOSActive && currentAlertId && !isRecording) {
      // Start video recording by default
      startRecording(currentAlertId, true).catch(() => {
        // If video fails, try audio only
        startRecording(currentAlertId, false);
        setRecordingType('audio');
      });
    }
  }, [isSOSActive, currentAlertId, isRecording, startRecording]);

  // Handle siren
  useEffect(() => {
    if (isSOSActive && sirenActive && settings.sirenEnabled) {
      startSiren();
    } else {
      stopSiren();
    }
    
    return () => {
      stopSiren();
    };
  }, [isSOSActive, sirenActive, settings.sirenEnabled, startSiren, stopSiren]);

  useEffect(() => {
    if (isSOSActive) {
      setElapsedTime(0);
      setSirenActive(true);
      const interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isSOSActive]);

  // Save recordings when SOS ends
  const handleStopSOS = useCallback(async (isSafe: boolean) => {
    // Stop recording and save
    stopRecording();
    
    // Create recording entries for alert history
    if (currentAlertId && (audioUrl || videoUrl)) {
      const recordings: AlertRecording[] = [];
      
      if (videoUrl) {
        recordings.push({
          id: crypto.randomUUID(),
          type: 'video',
          url: videoUrl,
          duration: duration,
          timestamp: Date.now() - (duration * 1000),
        });
      }
      
      if (audioUrl) {
        recordings.push({
          id: crypto.randomUUID(),
          type: 'audio',
          url: audioUrl,
          duration: duration,
          timestamp: Date.now() - (duration * 1000),
        });
      }
      
      if (recordings.length > 0) {
        updateAlertRecordings(currentAlertId, recordings);
      }
    }
    
    // Stop siren
    stopSiren();
    
    if (isSafe) {
      confirmSafe();
    } else {
      cancelSOS();
    }
  }, [currentAlertId, audioUrl, videoUrl, duration, stopRecording, stopSiren, updateAlertRecordings, confirmSafe, cancelSOS]);

  if (!isSOSActive) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleSiren = () => {
    if (sirenActive) {
      stopSiren();
    } else {
      startSiren();
    }
    setSirenActive(!sirenActive);
  };

  const primaryContact = emergencyContacts.find(c => c.isPrimary);
  const googleMapsUrl = getGoogleMapsUrl();

  return (
    <div className="fixed inset-0 z-50 bg-primary/10 backdrop-blur-xl flex flex-col">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-background" />
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="absolute inset-0 rounded-full bg-primary/10 sos-ring"
            style={{ animationDelay: `${i * 0.5}s` }}
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-col h-full p-6 safe-area-top safe-area-bottom">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 text-primary font-semibold mb-4">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            SOS ACTIVE
          </div>
          <h1 className="text-4xl font-display font-bold text-foreground mb-2">
            {formatTime(elapsedTime)}
          </h1>
          <p className="text-muted-foreground">Help is on the way</p>
        </div>

        {/* Status cards */}
        <div className="space-y-3 mb-8">
          {/* Location sharing */}
          <div className="glass p-4 rounded-2xl flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent/20">
              <MapPin className="w-5 h-5 text-accent" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">Location Sharing</p>
              <p className="text-sm text-muted-foreground">
                {currentLocation 
                  ? `${currentLocation.latitude.toFixed(4)}, ${currentLocation.longitude.toFixed(4)}`
                  : 'Acquiring location...'}
              </p>
            </div>
            {googleMapsUrl && (
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-accent/20 hover:bg-accent/30 transition-colors"
              >
                <ExternalLink className="w-4 h-4 text-accent" />
              </a>
            )}
            <span className="text-xs px-2 py-1 rounded-full bg-safe/20 text-safe">
              Live
            </span>
          </div>

          {/* Contact notification */}
          <div className="glass p-4 rounded-2xl flex items-center gap-3">
            <div className="p-2 rounded-lg bg-secondary/20">
              <Phone className="w-5 h-5 text-secondary" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">Contacting</p>
              <p className="text-sm text-muted-foreground">
                {primaryContact ? primaryContact.name : 'No primary contact set'}
              </p>
            </div>
            <span className="text-xs px-2 py-1 rounded-full bg-warning/20 text-warning">
              Notified
            </span>
          </div>

          {/* Recording */}
          <div className="glass p-4 rounded-2xl flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg",
              isRecording ? "bg-primary/20" : "bg-muted"
            )}>
              {recordingType === 'video' ? (
                <Video className={cn(
                  "w-5 h-5",
                  isRecording ? "text-primary" : "text-muted-foreground"
                )} />
              ) : (
                <Mic className={cn(
                  "w-5 h-5",
                  isRecording ? "text-primary" : "text-muted-foreground"
                )} />
              )}
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">Recording</p>
              <p className="text-sm text-muted-foreground">
                {recordingType === 'video' ? 'Audio & video evidence' : 'Audio evidence'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isRecording && (
                <span className="text-xs text-muted-foreground">
                  {formatTime(duration)}
                </span>
              )}
              <span className={cn(
                "text-xs px-2 py-1 rounded-full transition-all",
                isRecording ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
              )}>
                {isRecording ? 'Recording' : 'Stopped'}
              </span>
            </div>
          </div>

          {/* Siren */}
          <div className="glass p-4 rounded-2xl flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg",
              sirenActive ? "bg-warning/20" : "bg-muted"
            )}>
              {sirenActive ? (
                <Volume2 className="w-5 h-5 text-warning" />
              ) : (
                <VolumeX className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">Siren</p>
              <p className="text-sm text-muted-foreground">Loud alarm for attention</p>
            </div>
            <button
              onClick={toggleSiren}
              className={cn(
                "text-xs px-3 py-1 rounded-full transition-all",
                sirenActive ? "bg-warning/20 text-warning" : "bg-muted text-muted-foreground"
              )}
            >
              {sirenActive ? 'On' : 'Off'}
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex-1" />
        <div className="space-y-3">
          <Button
            variant="safe"
            size="xl"
            className="w-full"
            onClick={() => handleStopSOS(true)}
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            I'm Safe Now
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={() => handleStopSOS(false)}
          >
            Cancel SOS (False Alarm)
          </Button>
        </div>
      </div>
    </div>
  );
}
