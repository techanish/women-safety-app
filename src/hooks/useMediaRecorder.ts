import { useState, useRef, useCallback } from 'react';
import { saveRecording, getRecordingsForAlert } from '@/lib/offlineDB';

interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioUrl: string | null;
  videoUrl: string | null;
}

export function useMediaRecorder() {
  const [state, setState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    audioUrl: null,
    videoUrl: null,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const startRecording = useCallback(async (alertId: string, includeVideo = true) => {
    try {
      const constraints: MediaStreamConstraints = {
        audio: true,
        video: includeVideo ? { facingMode: 'user', width: 640, height: 480 } : false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      const mimeType = includeVideo 
        ? (MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : 'video/mp4')
        : (MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4');

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      startTimeRef.current = Date.now();

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        const duration = (Date.now() - startTimeRef.current) / 1000;

        // Save to IndexedDB
        await saveRecording({
          id: crypto.randomUUID(),
          alertId,
          type: includeVideo ? 'video' : 'audio',
          blob,
          timestamp: startTimeRef.current,
          duration,
        });

        setState(prev => ({
          ...prev,
          isRecording: false,
          [includeVideo ? 'videoUrl' : 'audioUrl']: url,
        }));
      };

      mediaRecorder.start(1000); // Collect data every second

      // Start duration timer
      timerRef.current = setInterval(() => {
        setState(prev => ({
          ...prev,
          duration: Math.floor((Date.now() - startTimeRef.current) / 1000),
        }));
      }, 1000);

      setState(prev => ({
        ...prev,
        isRecording: true,
        isPaused: false,
        duration: 0,
      }));

      return true;
    } catch (error) {
      console.error('Failed to start recording:', error);
      return false;
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setState(prev => ({
      ...prev,
      isRecording: false,
      isPaused: false,
    }));
  }, []);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setState(prev => ({ ...prev, isPaused: true }));
    }
  }, []);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setState(prev => ({ ...prev, isPaused: false }));
    }
  }, []);

  const getRecordings = useCallback(async (alertId: string) => {
    return getRecordingsForAlert(alertId);
  }, []);

  return {
    ...state,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    getRecordings,
  };
}
