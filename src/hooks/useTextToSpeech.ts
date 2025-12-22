import { useState, useRef, useCallback } from 'react';

interface TTSOptions {
  voiceName?: string;
  languageCode?: string;
}

// Voice options for Indian accents
export const INDIAN_VOICES = {
  male: {
    name: 'en-IN-Wavenet-D',
    language: 'en-IN',
    label: 'Male (English - India)',
  },
  female: {
    name: 'en-IN-Wavenet-A',
    language: 'en-IN',
    label: 'Female (English - India)',
  },
  hindiMale: {
    name: 'hi-IN-Wavenet-B',
    language: 'hi-IN',
    label: 'Male (Hindi)',
  },
  hindiFemale: {
    name: 'hi-IN-Wavenet-A',
    language: 'hi-IN',
    label: 'Female (Hindi)',
  },
};

export function useTextToSpeech() {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const speak = useCallback(async (text: string, options?: TTSOptions) => {
    if (!text) return;

    setIsLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/text-to-speech`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            text,
            voiceName: options?.voiceName || INDIAN_VOICES.male.name,
            languageCode: options?.languageCode || INDIAN_VOICES.male.language,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`TTS request failed: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success || !data.audioContent) {
        throw new Error(data.error || 'Failed to generate speech');
      }

      // Play audio using data URI
      const audioUrl = `data:audio/mpeg;base64,${data.audioContent}`;
      
      if (audioRef.current) {
        audioRef.current.pause();
      }

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onplay = () => setIsPlaying(true);
      audio.onended = () => setIsPlaying(false);
      audio.onerror = () => setIsPlaying(false);

      await audio.play();
    } catch (error) {
      console.error('TTS error:', error);
      // Fallback to browser TTS if available
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = options?.languageCode || 'en-IN';
        speechSynthesis.speak(utterance);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
    setIsPlaying(false);
  }, []);

  return {
    speak,
    stop,
    isLoading,
    isPlaying,
  };
}
