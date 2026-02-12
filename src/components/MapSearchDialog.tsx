import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, MapPin } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface MapSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLocationSelected: (lat: number, lng: number, label: string) => void;
}

export function MapSearchDialog({ open, onOpenChange, onLocationSelected }: MapSearchDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`
      );
      const results = await response.json();
      setSearchResults(results);
      
      if (results.length === 0) {
        toast({ title: "No results found", description: "Try a different search term" });
      }
    } catch (error) {
      console.error('Search failed:', error);
      toast({ title: "Search failed", description: "Please try again", variant: "destructive" });
    } finally {
      setIsSearching(false);
    }
  };

  const selectLocation = (result: any) => {
    onLocationSelected(parseFloat(result.lat), parseFloat(result.lon), result.display_name);
    setSearchResults([]);
    setSearchQuery('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Search Location</DialogTitle>
          <DialogDescription>
            Search for any location on the map
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search for a place..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              disabled={isSearching}
            />
            <Button 
              variant="accent" 
              onClick={handleSearch} 
              disabled={isSearching || !searchQuery.trim()}
            >
              {isSearching ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </Button>
          </div>

          {searchResults.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Results</h4>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {searchResults.map((result) => (
                  <button
                    key={result.place_id}
                    onClick={() => selectLocation(result)}
                    className="w-full text-left p-3 bg-muted/50 hover:bg-muted rounded-lg transition-colors"
                  >
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 mt-1 flex-shrink-0 text-primary" />
                      <div className="flex-1 min-w-0">
                        <div
                          className="text-sm font-medium truncate"
                          title={result.name || result.display_name}
                        >
                          {result.name || result.display_name}
                        </div>
                        <div className="text-xs text-muted-foreground line-clamp-2">{result.display_name}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {!isSearching && searchResults.length === 0 && searchQuery && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <Search className="w-12 h-12 mx-auto mb-2 opacity-20" />
              <p>No results found</p>
              <p className="text-xs mt-1">Try a different search term</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
