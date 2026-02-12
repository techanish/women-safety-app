import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin } from 'lucide-react';
import type { CustomPin } from '@/hooks/useCustomPins';

interface AddPinDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pendingLocation: { lat: number; lng: number } | null;
  onAddPin: (title: string, category: CustomPin['category']) => void;
}

export function AddPinDialog({ open, onOpenChange, pendingLocation, onAddPin }: AddPinDialogProps) {
  const [pinTitle, setPinTitle] = useState('');
  const [pinCategory, setPinCategory] = useState<CustomPin['category']>('note');

  const handleAdd = () => {
    if (!pinTitle.trim()) return;
    onAddPin(pinTitle, pinCategory);
    setPinTitle('');
    setPinCategory('note');
    onOpenChange(false);
  };

  const handleCancel = () => {
    setPinTitle('');
    setPinCategory('note');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Custom Pin</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {pendingLocation && (
            <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
              <MapPin className="w-4 h-4 inline mr-1" />
              Location: {pendingLocation.lat.toFixed(6)}, {pendingLocation.lng.toFixed(6)}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Pin Title</label>
            <Input
              placeholder="Enter pin title..."
              value={pinTitle}
              onChange={(e) => setPinTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Category</label>
            <select
              className="w-full p-2 rounded-lg bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-primary"
              value={pinCategory}
              onChange={(e) => setPinCategory(e.target.value as CustomPin['category'])}
              title="Select pin category"
              aria-label="Pin category"
            >
              <option value="note">📝 Note</option>
              <option value="danger">⚠️ Danger Zone</option>
              <option value="safe">✅ Safe Place</option>
              <option value="favorite">⭐ Favorite</option>
              <option value="meeting">📍 Meeting Point</option>
            </select>
          </div>

          <div className="flex gap-2 pt-2">
            <Button 
              variant="accent" 
              onClick={handleAdd} 
              disabled={!pinTitle.trim()} 
              className="flex-1"
            >
              Add Pin
            </Button>
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
