'use client';

import { ProcessingProgress } from '@/types';

interface ProgressTrackerProps {
  progress: ProcessingProgress | null;
  isProcessing: boolean;
}

export default function ProgressTracker({ progress, isProcessing }: ProgressTrackerProps) {
  if (!isProcessing && !progress) {
    return null;
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md space-y-4">
      <h2 className="text-xl font-bold text-gray-900">Processing Your Summary</h2>

      {progress && (
        <>
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className="h-4 bg-blue-600 rounded-full transition-all duration-300 flex items-center justify-end pr-2"
              style={{ width: `${progress.percentage}%` }}
            >
              {progress.percentage > 10 && (
                <span className="text-xs font-medium text-white">
                  {Math.round(progress.percentage)}%
                </span>
              )}
            </div>
          </div>

          {/* Current Step */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {/* Spinner */}
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />

              <span className="text-sm font-medium text-gray-700">
                {progress.step}
                {progress.episodeIndex !== undefined && progress.totalEpisodes && (
                  <span className="text-gray-500">
                    {' '}
                    (Episode {progress.episodeIndex + 1} of {progress.totalEpisodes})
                  </span>
                )}
              </span>
            </div>

            <p className="text-sm text-gray-600 ml-7">{progress.message}</p>
          </div>

          {/* Estimated Time Remaining */}
          <div className="text-xs text-gray-500 italic">
            This may take 2-4 minutes depending on episode length...
          </div>
        </>
      )}

      {isProcessing && !progress && (
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
          <span className="text-sm text-gray-600">Initializing...</span>
        </div>
      )}
    </div>
  );
}
