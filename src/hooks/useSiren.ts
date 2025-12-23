import { useRef, useCallback, useEffect } from 'react';

export function useSiren() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const isPlayingRef = useRef(false);
  const animationFrameRef = useRef<number | null>(null);

  const startSiren = useCallback(() => {
    if (isPlayingRef.current) return;
    
    try {
      // Create audio context
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const ctx = audioContextRef.current;
      
      // Create oscillator for siren sound
      oscillatorRef.current = ctx.createOscillator();
      gainRef.current = ctx.createGain();
      
      // Set up oscillator
      oscillatorRef.current.type = 'sawtooth';
      oscillatorRef.current.frequency.setValueAtTime(400, ctx.currentTime);
      
      // Set up gain
      gainRef.current.gain.setValueAtTime(0.5, ctx.currentTime);
      
      // Connect nodes
      oscillatorRef.current.connect(gainRef.current);
      gainRef.current.connect(ctx.destination);
      
      // Start oscillator
      oscillatorRef.current.start();
      isPlayingRef.current = true;
      
      // Create siren effect by modulating frequency
      const modulateSiren = () => {
        if (!oscillatorRef.current || !audioContextRef.current || !isPlayingRef.current) return;
        
        const ctx = audioContextRef.current;
        const now = ctx.currentTime;
        
        // Create a siren sweep effect between 400Hz and 800Hz
        oscillatorRef.current.frequency.setValueAtTime(400, now);
        oscillatorRef.current.frequency.linearRampToValueAtTime(800, now + 0.5);
        oscillatorRef.current.frequency.linearRampToValueAtTime(400, now + 1);
        
        // Schedule next modulation
        animationFrameRef.current = requestAnimationFrame(() => {
          setTimeout(modulateSiren, 900);
        });
      };
      
      modulateSiren();
    } catch (error) {
      console.error('Failed to start siren:', error);
    }
  }, []);

  const stopSiren = useCallback(() => {
    isPlayingRef.current = false;
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    if (oscillatorRef.current) {
      try {
        oscillatorRef.current.stop();
        oscillatorRef.current.disconnect();
      } catch (e) {
        // Oscillator might already be stopped
      }
      oscillatorRef.current = null;
    }
    
    if (gainRef.current) {
      gainRef.current.disconnect();
      gainRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSiren();
    };
  }, [stopSiren]);

  return { startSiren, stopSiren, isPlaying: isPlayingRef.current };
}
