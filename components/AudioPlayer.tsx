'use client';

import { SummaryResult } from '@/types';
import { formatDuration, formatCost } from '@/lib/utils';

interface AudioPlayerProps {
  result: SummaryResult;
}

export default function AudioPlayer({ result }: AudioPlayerProps) {
  const handleDownload = async () => {
    try {
      const response = await fetch(result.audioUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'podcast-summary.mp3';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download audio file');
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md space-y-4">
      <h2 className="text-xl font-bold text-gray-900">Your Summary is Ready!</h2>

      {/* Audio Player */}
      <div className="w-full">
        <audio controls className="w-full" src={result.audioUrl}>
          Your browser does not support the audio element.
        </audio>
      </div>

      {/* Download Button */}
      <button
        onClick={handleDownload}
        className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white font-medium rounded-lg
                   hover:bg-blue-700 active:bg-blue-800 transition-colors
                   flex items-center justify-center gap-2"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
          />
        </svg>
        Download Audio
      </button>

      {/* Duration Info */}
      <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-md">
        <div>
          <p className="text-sm text-gray-600">Target Duration</p>
          <p className="text-lg font-semibold text-gray-900">
            {formatDuration(result.targetDuration)}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Actual Duration</p>
          <p className="text-lg font-semibold text-gray-900">
            {formatDuration(result.actualDuration)}
          </p>
        </div>
      </div>

      {/* Cost Breakdown */}
      <div className="border-t pt-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Cost Breakdown</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Transcription (Whisper)</span>
            <span className="font-medium">{formatCost(result.costBreakdown.transcription)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Summarization (Claude)</span>
            <span className="font-medium">{formatCost(result.costBreakdown.summarization)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Text-to-Speech (TTS)</span>
            <span className="font-medium">{formatCost(result.costBreakdown.tts)}</span>
          </div>
          <div className="flex justify-between pt-2 border-t font-bold text-base">
            <span>Total Cost</span>
            <span className="text-blue-600">{formatCost(result.costBreakdown.total)}</span>
          </div>
        </div>
      </div>

      {/* Summary Text (Collapsible) */}
      <details className="border-t pt-4">
        <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
          View Text Summary
        </summary>
        <div className="mt-3 p-4 bg-gray-50 rounded-md text-sm text-gray-700 whitespace-pre-wrap">
          {result.summaryText}
        </div>
      </details>
    </div>
  );
}
