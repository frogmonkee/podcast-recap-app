'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Episode, Job, ProcessingProgress, SummaryResult } from '@/types';

const STORAGE_KEY = 'podcast-summary-active-job';
const POLL_INTERVAL_MS = 3000;

export function useJob() {
  const [job, setJob] = useState<Job | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const pollJob = useCallback(async (jobId: string) => {
    try {
      const res = await fetch(`/api/jobs/${jobId}`);
      if (!res.ok) {
        if (res.status === 404) {
          // Job expired or doesn't exist
          localStorage.removeItem(STORAGE_KEY);
          stopPolling();
          setIsProcessing(false);
          return;
        }
        throw new Error('Failed to fetch job status');
      }

      const data: Job = await res.json();
      setJob(data);

      if (data.status === 'completed') {
        localStorage.removeItem(STORAGE_KEY);
        stopPolling();
        setIsProcessing(false);
      } else if (data.status === 'failed') {
        localStorage.removeItem(STORAGE_KEY);
        stopPolling();
        setIsProcessing(false);
        setError(data.error);
      }
    } catch (err) {
      console.error('[useJob] Poll error:', err);
    }
  }, [stopPolling]);

  const startPolling = useCallback((jobId: string) => {
    stopPolling();
    // Poll immediately, then on interval
    pollJob(jobId);
    pollRef.current = setInterval(() => pollJob(jobId), POLL_INTERVAL_MS);
  }, [stopPolling, pollJob]);

  // On mount, check for an active job in localStorage
  useEffect(() => {
    const activeJobId = localStorage.getItem(STORAGE_KEY);
    if (activeJobId) {
      setIsProcessing(true);
      startPolling(activeJobId);
    }
    return () => stopPolling();
  }, [startPolling, stopPolling]);

  const submit = useCallback(async (episodes: Episode[], targetDuration: 1 | 5 | 10) => {
    setError(null);
    setJob(null);
    setIsProcessing(true);

    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ episodes, targetDuration }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit job');
      }

      const { jobId } = await res.json();
      localStorage.setItem(STORAGE_KEY, jobId);
      startPolling(jobId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setIsProcessing(false);
    }
  }, [startPolling]);

  const reset = useCallback(() => {
    stopPolling();
    localStorage.removeItem(STORAGE_KEY);
    setJob(null);
    setIsProcessing(false);
    setError(null);
  }, [stopPolling]);

  return {
    submit,
    job,
    progress: job?.progress ?? null,
    result: job?.result ?? null,
    isProcessing,
    error,
    reset,
  };
}
