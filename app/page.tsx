'use client';

import { useState } from 'react';
import { Episode } from '@/types';
import { useJob } from '@/hooks/useJob';
import EpisodeForm from '@/components/EpisodeForm';
import ProgressTracker from '@/components/ProgressTracker';
import AudioPlayer from '@/components/AudioPlayer';

export default function Home() {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [targetDuration, setTargetDuration] = useState<1 | 5 | 10>(5);
  const { submit, progress, result, isProcessing, error, reset } = useJob();

  const handleSubmit = async () => {
    if (episodes.length === 0) return;
    await submit(episodes, targetDuration);
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

        {/* Episode Form */}
        <EpisodeForm
          onEpisodesChange={setEpisodes}
          onTargetDurationChange={setTargetDuration}
        />

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
          <div className="p-4 bg-red-100 border border-red-400 rounded-md flex items-center justify-between">
            <p className="text-sm text-red-800 font-medium">Error: {error}</p>
            <button
              onClick={reset}
              className="text-sm text-red-600 underline hover:text-red-800"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Progress Tracker */}
        {isProcessing && <ProgressTracker progress={progress} isProcessing={isProcessing} />}

        {/* Audio Player */}
        {result && <AudioPlayer result={result} />}
      </div>
    </div>
  );
}
