import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, HardDrive } from 'lucide-react';
import { useOfflineMaps } from '@/hooks/useOfflineMaps';
import { useSafety } from '@/contexts/SafetyContext';
import { toast } from '@/hooks/use-toast';

interface OfflineMapDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OfflineMapDialog({ open, onOpenChange }: OfflineMapDialogProps) {
  const { currentLocation } = useSafety();
  const offlineMaps = useOfflineMaps();
  const [downloadName, setDownloadName] = useState('');
  const [downloadRadius, setDownloadRadius] = useState('1000');

  const handleDownloadCurrentArea = async () => {
    if (!currentLocation) {
      toast({ title: "Location unavailable", description: "Please enable location services", variant: "destructive" });
      return;
    }
    const name = downloadName.trim() || 'Current Location';
    const radius = parseInt(downloadRadius) || 1000;
    await offlineMaps.downloadArea(name, currentLocation.latitude, currentLocation.longitude, radius, 15);
    setDownloadName('');
    toast({ title: "Download started", description: `Downloading ${name} area...` });
  };

  const handleClearCache = async () => {
    await offlineMaps.clearCache();
    toast({ title: "Cache cleared", description: "All offline maps have been removed" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Offline Maps</DialogTitle>
          <DialogDescription>
            Download map areas for offline access
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Storage Info */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4" />
                <span>Storage Used</span>
              </div>
              <span className="font-medium">{offlineMaps.cacheSize}/{offlineMaps.maxCacheSize} tiles</span>
            </div>
            <div className="w-full bg-background rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all" 
                role="progressbar"
                aria-valuenow={Math.min(offlineMaps.getCacheUsagePercent(), 100)}
                aria-valuemin={0}
                aria-valuemax={100}
                data-width={Math.min(offlineMaps.getCacheUsagePercent(), 100)}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {offlineMaps.getCacheUsagePercent().toFixed(0)}% used
            </p>
          </div>

          {/* Download Current Area */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <h4 className="font-medium text-sm">Download Current Area</h4>
            <Input 
              placeholder="Area name (e.g., Home, Work)" 
              value={downloadName} 
              onChange={(e) => setDownloadName(e.target.value)} 
            />
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Radius: {downloadRadius}m ({(parseInt(downloadRadius)/1000).toFixed(1)}km)</label>
              <input 
                type="range" 
                min="500" 
                max="5000" 
                step="500" 
                value={downloadRadius} 
                onChange={(e) => setDownloadRadius(e.target.value)} 
                className="w-full" 
                aria-label="Download radius" 
              />
            </div>
            <Button 
              variant="accent" 
              onClick={handleDownloadCurrentArea} 
              disabled={offlineMaps.isDownloading || !currentLocation} 
              className="w-full"
            >
              {offlineMaps.isDownloading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Download Area
                </>
              )}
            </Button>
          </div>

          {/* Downloaded Areas */}
          {offlineMaps.offlineAreas.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Downloaded Areas</h4>
              <div className="space-y-2">
                {offlineMaps.offlineAreas.map((area) => (
                  <div key={area.id} className="bg-muted/50 rounded-lg p-3 text-sm">
                    <div className="font-medium">{area.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {area.radius}m radius • Downloaded {new Date(area.downloadedAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Settings */}
          <div className="space-y-3 pt-3 border-t">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Low Data Mode</div>
                <div className="text-xs text-muted-foreground">Reduce tile quality</div>
              </div>
              <Button 
                variant={offlineMaps.lowDataMode ? "accent" : "outline"} 
                size="sm"
                onClick={() => offlineMaps.setLowDataMode(!offlineMaps.lowDataMode)}
              >
                {offlineMaps.lowDataMode ? "On" : "Off"}
              </Button>
            </div>
            
            {offlineMaps.cacheSize > 0 && (
              <Button 
                variant="destructive" 
                onClick={handleClearCache}
                className="w-full"
              >
                Clear All Cached Maps
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
