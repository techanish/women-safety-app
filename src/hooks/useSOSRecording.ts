import { useCallback, useRef, useEffect, useState } from 'react';
import { useSafety } from '@/contexts/SafetyContext';
import { useMediaRecorder } from './useMediaRecorder';
import { getRecordingsForAlert } from '@/lib/offlineDB';
import { AlertRecording } from '@/types/safety';

export interface SOSRecordingState {
  isRecordingAudio: boolean;
  isRecordingVideo: boolean;
  recordingDuration: number;
  audioUrl: string | null;
  videoUrl: string | null;
  recordings: AlertRecording[];
}

interface UseSOSRecordingOptions {
  includeVideo?: boolean;
  includeAudio?: boolean;
}

export function useSOSRecording(options: UseSOSRecordingOptions = {}) {
  const {
    includeVideo = true,
    includeAudio = true,
  } = options;

  const { isSOSActive, currentAlertId, updateAlertRecordings } = useSafety();
  const mediaRecorder = useMediaRecorder();
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRecorderRef = useRef<MediaRecorder | null>(null);
  const videoRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<{ audio: MediaStream; video: MediaStream } | null>(null);
  const chunksRef = useRef<{ audio: Blob[]; video: Blob[] }>({ audio: [], video: [] });
  const startTimeRef = useRef<number>(0);

  const [recordingState, setRecordingState] = useState<SOSRecordingState>({
    isRecordingAudio: false,
    isRecordingVideo: false,
    recordingDuration: 0,
    audioUrl: null,
    videoUrl: null,
    recordings: [],
  });

  // Auto-start recording when SOS is triggered
  useEffect(() => {
    if (isSOSActive && currentAlertId) {
      startSOSRecording();
    }
  }, [isSOSActive, currentAlertId]);

  const startSOSRecording = useCallback(async () => {
    if (!currentAlertId) return;

    try {
      // Record audio
      if (includeAudio) {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const audioMimeType = MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : 'audio/mp4';
        
        const audioRecorder = new MediaRecorder(audioStream, { mimeType: audioMimeType });
        audioRecorderRef.current = audioRecorder;
        chunksRef.current.audio = [];
        
        audioRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunksRef.current.audio.push(e.data);
          }
        };
        
        audioRecorder.onstop = async () => {
          const blob = new Blob(chunksRef.current.audio, { type: audioMimeType });
          const url = URL.createObjectURL(blob);
          const duration = (Date.now() - startTimeRef.current) / 1000;
          
          const recording: AlertRecording = {
            id: crypto.randomUUID(),
            type: 'audio',
            url,
            duration,
            timestamp: startTimeRef.current,
          };

          setRecordingState(prev => ({
            ...prev,
            audioUrl: url,
            recordings: [...prev.recordings, recording],
          }));

          updateAlertRecordings(currentAlertId, [
            ...recordingState.recordings,
            recording,
          ]);
        };

        audioRecorder.start(1000);
        setRecordingState(prev => ({ ...prev, isRecordingAudio: true }));
      }

      // Record video
      if (includeVideo) {
        const videoStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: 640, height: 480 },
        });
        const videoMimeType = MediaRecorder.isTypeSupported('video/webm')
          ? 'video/webm'
          : 'video/mp4';
        
        const videoRecorder = new MediaRecorder(videoStream, { mimeType: videoMimeType });
        videoRecorderRef.current = videoRecorder;
        chunksRef.current.video = [];
        
        videoRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunksRef.current.video.push(e.data);
          }
        };
        
        videoRecorder.onstop = async () => {
          const blob = new Blob(chunksRef.current.video, { type: videoMimeType });
          const url = URL.createObjectURL(blob);
          const duration = (Date.now() - startTimeRef.current) / 1000;
          
          const recording: AlertRecording = {
            id: crypto.randomUUID(),
            type: 'video',
            url,
            duration,
            timestamp: startTimeRef.current,
          };

          setRecordingState(prev => ({
            ...prev,
            videoUrl: url,
            recordings: [...prev.recordings, recording],
          }));

          updateAlertRecordings(currentAlertId, [
            ...recordingState.recordings,
            recording,
          ]);
        };

        videoRecorder.start(1000);
        setRecordingState(prev => ({ ...prev, isRecordingVideo: true }));
      }

      startTimeRef.current = Date.now();

      // Duration timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingState(prev => ({
          ...prev,
          recordingDuration: Math.floor((Date.now() - startTimeRef.current) / 1000),
        }));
      }, 1000);
    } catch (error) {
      console.error('Failed to start SOS recording:', error);
    }
  }, [currentAlertId, includeAudio, includeVideo, recordingState.recordings, updateAlertRecordings]);

  const stopSOSRecording = useCallback(async () => {
    if (audioRecorderRef.current && audioRecorderRef.current.state !== 'inactive') {
      audioRecorderRef.current.stop();
    }
    
    if (videoRecorderRef.current && videoRecorderRef.current.state !== 'inactive') {
      videoRecorderRef.current.stop();
    }

    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    setRecordingState(prev => ({
      ...prev,
      isRecordingAudio: false,
      isRecordingVideo: false,
    }));
  }, []);

  const loadRecordings = useCallback(async () => {
    if (!currentAlertId) return;
    const recordings = await getRecordingsForAlert(currentAlertId);
    setRecordingState(prev => ({ ...prev, recordings }));
    return recordings;
  }, [currentAlertId]);

  return {
    ...recordingState,
    startSOSRecording,
    stopSOSRecording,
    loadRecordings,
  };
}
