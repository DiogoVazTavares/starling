import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Mic capture via MediaRecorder, using the browser's default codec — format conversion is
 * `wav.ts`'s job (ticket 007), not the recorder's.
 */

export type RecorderStatus = 'idle' | 'recording';

export interface Recorder {
  status: RecorderStatus;
  /** Seconds recorded so far, so the user can feel the length of their answer. */
  elapsedSeconds: number;
  start: () => Promise<void>;
  stop: () => Promise<Blob>;
}

export function useRecorder(): Recorder {
  const [status, setStatus] = useState<RecorderStatus>('idle');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    if (status !== 'recording') return;
    const startedAt = Date.now();
    const tick = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 250);
    return () => clearInterval(tick);
  }, [status]);

  // Releasing the mic matters on unmount — otherwise the browser keeps showing "recording".
  useEffect(() => {
    return () => {
      const recorder = recorderRef.current;
      if (recorder && recorder.state !== 'inactive') recorder.stop();
      recorder?.stream.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const start = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    recorderRef.current = recorder;
    setElapsedSeconds(0);
    recorder.start();
    setStatus('recording');
  }, []);

  const stop = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === 'inactive') {
      return Promise.reject(new Error('Nothing is being recorded.'));
    }

    return new Promise<Blob>((resolve, reject) => {
      const chunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };
      recorder.onstop = () => {
        recorder.stream.getTracks().forEach((track) => track.stop());
        resolve(new Blob(chunks, { type: recorder.mimeType }));
      };
      recorder.onerror = (event) => {
        recorder.stream.getTracks().forEach((track) => track.stop());
        reject(new Error(`Recording failed: ${String((event as { error?: unknown }).error)}`));
      };

      recorder.stop();
      setStatus('idle');
    });
  }, []);

  return { status, elapsedSeconds, start, stop };
}
