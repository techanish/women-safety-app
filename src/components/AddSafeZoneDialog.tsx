import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Home, Briefcase, GraduationCap, Building2 } from 'lucide-react';
import { useSafety } from '@/contexts/SafetyContext';
import { toast } from '@/lib/toast';

interface AddSafeZoneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const zoneTypes = [
  { value: 'home', label: 'Home', icon: Home },
  { value: 'work', label: 'Work', icon: Briefcase },
  { value: 'school', label: 'School/College', icon: GraduationCap },
  { value: 'other', label: 'Other', icon: Building2 },
];

export function AddSafeZoneDialog({ open, onOpenChange }: AddSafeZoneDialogProps) {
  const { currentLocation, addSafeZone } = useSafety();
  const [name, setName] = useState('');
  const [type, setType] = useState('home');
  const [radius, setRadius] = useState('200');
  const [useCurrentLocation, setUseCurrentLocation] = useState(true);
  const [customLat, setCustomLat] = useState('');
  const [customLng, setCustomLng] = useState('');

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error('Please enter a name for the safe zone');
      return;
    }

    let latitude: number;
    let longitude: number;

    if (useCurrentLocation) {
      if (!currentLocation) {
        toast.error('Current location not available. Please enter coordinates manually.');
        return;
      }
      latitude = currentLocation.latitude;
      longitude = currentLocation.longitude;
    } else {
      if (!customLat || !customLng) {
        toast.error('Please enter valid coordinates');
        return;
      }
      latitude = parseFloat(customLat);
      longitude = parseFloat(customLng);
      
      if (isNaN(latitude) || isNaN(longitude)) {
        toast.error('Invalid coordinates');
        return;
      }
    }

    addSafeZone({
      name: name.trim(),
      latitude,
      longitude,
      radius: parseInt(radius) || 200,
      isActive: true,
    });

    toast.success(`Safe zone "${name}" added successfully`);
    
    // Reset form
    setName('');
    setType('home');
    setRadius('200');
    setUseCurrentLocation(true);
    setCustomLat('');
    setCustomLng('');
    onOpenChange(false);
  };

  const selectedType = zoneTypes.find(z => z.value === type);
  const TypeIcon = selectedType?.icon || MapPin;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Add Safe Zone
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="zone-name">Zone Name</Label>
            <Input
              id="zone-name"
              placeholder="e.g., My Home, Office"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Zone Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {zoneTypes.map((zoneType) => (
                  <SelectItem key={zoneType.value} value={zoneType.value}>
                    <div className="flex items-center gap-2">
                      <zoneType.icon className="w-4 h-4" />
                      {zoneType.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Location</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={useCurrentLocation ? "default" : "outline"}
                size="sm"
                onClick={() => setUseCurrentLocation(true)}
                className="flex-1"
              >
                Use Current
              </Button>
              <Button
                type="button"
                variant={!useCurrentLocation ? "default" : "outline"}
                size="sm"
                onClick={() => setUseCurrentLocation(false)}
                className="flex-1"
              >
                Enter Manually
              </Button>
            </div>
            
            {useCurrentLocation ? (
              <p className="text-sm text-muted-foreground">
                {currentLocation 
                  ? `📍 ${currentLocation.latitude.toFixed(6)}, ${currentLocation.longitude.toFixed(6)}`
                  : 'Acquiring location...'}
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Latitude"
                  value={customLat}
                  onChange={(e) => setCustomLat(e.target.value)}
                  type="number"
                  step="any"
                />
                <Input
                  placeholder="Longitude"
                  value={customLng}
                  onChange={(e) => setCustomLng(e.target.value)}
                  type="number"
                  step="any"
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="radius">Radius (meters)</Label>
            <Select value={radius} onValueChange={setRadius}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="100">100m - Small</SelectItem>
                <SelectItem value="200">200m - Medium</SelectItem>
                <SelectItem value="500">500m - Large</SelectItem>
                <SelectItem value="1000">1km - Very Large</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            Add Safe Zone
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
