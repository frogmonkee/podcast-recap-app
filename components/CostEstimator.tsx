'use client';

import { useState, useEffect } from 'react';
import { Episode, CostBreakdown } from '@/types';
import { estimateCost, checkBudget } from '@/lib/cost-calculator';
import { formatCost } from '@/lib/utils';

interface CostEstimatorProps {
  episodes: Episode[];
  targetDuration: 1 | 5 | 10;
}

export default function CostEstimator({ episodes, targetDuration }: CostEstimatorProps) {
  const [costEstimate, setCostEstimate] = useState<CostBreakdown | null>(null);
  const [budgetError, setBudgetError] = useState<string | null>(null);

  useEffect(() => {
    // Only estimate if we have valid episodes
    const validEpisodes = episodes.filter((ep) => ep.url && ep.duration > 0);

    if (validEpisodes.length === 0) {
      setCostEstimate(null);
      setBudgetError(null);
      return;
    }

    // Estimate costs
    // For simplicity, assume no transcripts available (worst case)
    const hasTranscripts = validEpisodes.map(() => false);
    const summaryLength = targetDuration * 150 * 4; // Estimate 4 chars per word

    const estimate = estimateCost(validEpisodes, hasTranscripts, summaryLength);
    setCostEstimate(estimate);

    // Check budget
    const error = checkBudget(estimate.total);
    setBudgetError(error);
  }, [episodes, targetDuration]);

  if (!costEstimate) {
    return null;
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md space-y-4">
      <h2 className="text-xl font-bold text-gray-900">Cost Estimate</h2>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Transcription (Whisper)</span>
          <span className="font-medium">{formatCost(costEstimate.transcription)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Summarization (Claude)</span>
          <span className="font-medium">{formatCost(costEstimate.summarization)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Text-to-Speech (TTS)</span>
          <span className="font-medium">{formatCost(costEstimate.tts)}</span>
        </div>
        <div className="flex justify-between pt-2 border-t font-bold text-base">
          <span>Estimated Total</span>
          <span className={budgetError ? 'text-red-600' : 'text-blue-600'}>
            {formatCost(costEstimate.total)}
          </span>
        </div>
      </div>

      {budgetError && (
        <div className="p-3 bg-red-100 border border-red-400 rounded-md">
          <p className="text-sm text-red-800 font-medium">⚠️ {budgetError}</p>
        </div>
      )}

      {!budgetError && (
        <div className="p-3 bg-green-100 border border-green-400 rounded-md">
          <p className="text-sm text-green-800">
            ✓ Within budget limits. Ready to proceed.
          </p>
        </div>
      )}

      <p className="text-xs text-gray-500 italic">
        Note: Actual cost may be lower if existing transcripts are found.
      </p>
    </div>
  );
}
