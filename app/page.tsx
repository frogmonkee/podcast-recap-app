'use client';

import { useState } from 'react';
import { Episode, SummaryResult, ProcessingProgress } from '@/types';
import ApiCallCounter from '@/components/ApiCallCounter';
import EpisodeForm from '@/components/EpisodeForm';
import CostEstimator from '@/components/CostEstimator';
import ProgressTracker from '@/components/ProgressTracker';
import AudioPlayer from '@/components/AudioPlayer';

export default function Home() {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [targetDuration, setTargetDuration] = useState<1 | 5 | 10>(5);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<ProcessingProgress | null>(null);
  const [result, setResult] = useState<SummaryResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    // Validation
    if (episodes.length === 0) {
      setError('Please add at least one episode URL');
      return;
    }

    setError(null);
    setResult(null);
    setIsProcessing(true);
    setProgress({
      step: 'Initializing',
      percentage: 0,
      message: 'Starting summary generation...',
    });

    try {
      // Call API endpoint with Server-Sent Events
      const response = await fetch('/api/process-episodes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          episodes,
          targetDuration,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process episodes');
      }

      // Handle SSE stream
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response stream');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));

            if (data.type === 'progress') {
              setProgress(data.progress);
            } else if (data.type === 'complete') {
              setResult(data.result);
              setIsProcessing(false);
            } else if (data.type === 'error') {
              throw new Error(data.error);
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setIsProcessing(false);
      setProgress(null);
    }
  };

  const canSubmit = episodes.length > 0 && !isProcessing;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Podcast Summary App</h1>
          <p className="text-lg text-gray-600">
            Generate audio summaries of multi-episode podcasts with timestamp control
          </p>
        </div>

        {/* Listen Notes API Call Counter */}
        <ApiCallCounter />

        {/* Episode Form */}
        <EpisodeForm
          onEpisodesChange={setEpisodes}
          onTargetDurationChange={setTargetDuration}
          listenNotesApiKey={process.env.NEXT_PUBLIC_LISTENNOTES_API_KEY}
        />

        {/* Cost Estimator */}
        {episodes.length > 0 && (
          <CostEstimator episodes={episodes} targetDuration={targetDuration} />
        )}

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={`w-full py-4 px-6 text-lg font-semibold rounded-lg transition-colors
                     ${
                       canSubmit
                         ? 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
                         : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                     }`}
        >
          {isProcessing ? 'Processing...' : 'Generate Summary'}
        </button>

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-100 border border-red-400 rounded-md">
            <p className="text-sm text-red-800 font-medium">⚠️ {error}</p>
          </div>
        )}

        {/* Progress Tracker */}
        {isProcessing && <ProgressTracker progress={progress} isProcessing={isProcessing} />}

        {/* Audio Player */}
        {result && <AudioPlayer result={result} />}

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>
            Keep your browser open during processing (2-4 minutes).
          </p>
        </div>
      </div>
    </div>
  );
}
