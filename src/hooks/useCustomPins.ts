import { useState, useCallback } from 'react';

export interface CustomPin {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  description?: string;
  category: 'note' | 'danger' | 'safe' | 'favorite' | 'meeting';
  createdAt: number;
  color?: string;
}

export function useCustomPins() {
  const [pins, setPins] = useState<CustomPin[]>(() => {
    const stored = localStorage.getItem('custom_map_pins');
    return stored ? JSON.parse(stored) : [];
  });

  const addPin = useCallback((
    latitude: number,
    longitude: number,
    title: string,
    description?: string,
    category: CustomPin['category'] = 'note'
  ) => {
    const newPin: CustomPin = {
      id: crypto.randomUUID(),
      latitude,
      longitude,
      title,
      description,
      category,
      createdAt: Date.now(),
      color: getCategoryColor(category),
    };

    setPins(prev => {
      const updated = [...prev, newPin];
      localStorage.setItem('custom_map_pins', JSON.stringify(updated));
      return updated;
    });

    return newPin;
  }, []);

  const updatePin = useCallback((id: string, updates: Partial<CustomPin>) => {
    setPins(prev => {
      const updated = prev.map(pin => 
        pin.id === id ? { ...pin, ...updates } : pin
      );
      localStorage.setItem('custom_map_pins', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const deletePin = useCallback((id: string) => {
    setPins(prev => {
      const updated = prev.filter(pin => pin.id !== id);
      localStorage.setItem('custom_map_pins', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearAllPins = useCallback(() => {
    setPins([]);
    localStorage.removeItem('custom_map_pins');
  }, []);

  const exportPins = useCallback(() => {
    const data = JSON.stringify(pins, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `custom-pins-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [pins]);

  const importPins = useCallback((jsonData: string) => {
    try {
      const imported = JSON.parse(jsonData) as CustomPin[];
      setPins(prev => {
        const updated = [...prev, ...imported];
        localStorage.setItem('custom_map_pins', JSON.stringify(updated));
        return updated;
      });
      return true;
    } catch (error) {
      console.error('Failed to import pins:', error);
      return false;
    }
  }, []);

  return {
    pins,
    addPin,
    updatePin,
    deletePin,
    clearAllPins,
    exportPins,
    importPins,
  };
}

function getCategoryColor(category: CustomPin['category']): string {
  const colors = {
    note: '#3b82f6',
    danger: '#ef4444',
    safe: '#22c55e',
    favorite: '#f59e0b',
    meeting: '#8b5cf6',
  };
  return colors[category];
}

// Unicode-safe base64 encoding
function utf8ToBase64(str: string): string {
  return btoa(unescape(encodeURIComponent(str)));
}

export function getPinIcon(category: CustomPin['category'], color?: string): string {
  const iconColor = color || getCategoryColor(category);
  
  const icons = {
    note: '📝',
    danger: '⚠️',
    safe: '✅',
    favorite: '⭐',
    meeting: '📍',
  };

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42">
      <path d="M16 0 C7.163 0 0 7.163 0 16 C0 24 16 42 16 42 S32 24 32 16 C32 7.163 24.837 0 16 0 Z" 
            fill="${iconColor}" stroke="#fff" stroke-width="2"/>
      <text x="16" y="20" text-anchor="middle" font-size="16" fill="#fff">${icons[category]}</text>
    </svg>
  `;

  return `data:image/svg+xml;base64,${utf8ToBase64(svg)}`;
}

