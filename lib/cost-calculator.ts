// Cost calculation and budget enforcement module

import { Episode, CostBreakdown, BudgetInfo } from '@/types';

// Pricing constants (as of 2025)
const WHISPER_COST_PER_MINUTE = 0.006; // Kept for reference
const FIREWORKS_COST_PER_MINUTE = 0.0012; // Fireworks AI whisper-v3-turbo
const TRANSCRIPTION_COST_PER_MINUTE = FIREWORKS_COST_PER_MINUTE; // Active transcription provider
const CLAUDE_COST_ESTIMATE = 0.03; // Approximate for typical summary
const TTS_COST_PER_CHAR = 0.000015;

export const PER_REQUEST_LIMIT = 5.00;
export const MONTHLY_LIMIT = 20.00;
export const WARNING_THRESHOLD = 15.00;

/**
 * Get current monthly budget info from localStorage
 */
export function getBudgetInfo(): BudgetInfo {
  if (typeof window === 'undefined') {
    return {
      monthlySpend: 0,
      monthlyLimit: MONTHLY_LIMIT,
      lastResetDate: new Date().toISOString(),
      perRequestLimit: PER_REQUEST_LIMIT,
    };
  }

  // Check if we need to reset for new month
  checkAndResetIfNewMonth();

  const monthlySpend = parseFloat(localStorage.getItem('monthlySpend') || '0');
  const lastResetDate = localStorage.getItem('budgetResetDate') || new Date().toISOString();

  return {
    monthlySpend,
    monthlyLimit: MONTHLY_LIMIT,
    lastResetDate,
    perRequestLimit: PER_REQUEST_LIMIT,
  };
}

/**
 * Check if new month and reset budget if needed
 */
export function checkAndResetIfNewMonth(): void {
  if (typeof window === 'undefined') return;

  const lastResetDate = localStorage.getItem('budgetResetDate');
  const now = new Date();

  if (!lastResetDate) {
    // First time, initialize
    localStorage.setItem('monthlySpend', '0');
    localStorage.setItem('budgetResetDate', now.toISOString());
    return;
  }

  const lastReset = new Date(lastResetDate);

  // Check if different month or year
  if (lastReset.getMonth() !== now.getMonth() || lastReset.getFullYear() !== now.getFullYear()) {
    // New month - reset budget
    localStorage.setItem('monthlySpend', '0');
    localStorage.setItem('budgetResetDate', now.toISOString());
  }
}

/**
 * Estimate cost for processing episodes
 * @param episodes - Array of episodes with duration info
 * @param hasTranscripts - Array indicating which episodes have transcripts
 * @param summaryLength - Length of summary in characters (estimated)
 */
export function estimateCost(
  episodes: Episode[],
  hasTranscripts: boolean[],
  summaryLength: number = 5000
): CostBreakdown {
  let transcriptionCost = 0;

  // Calculate transcription costs for episodes without transcripts
  episodes.forEach((episode, index) => {
    if (!hasTranscripts[index]) {
      const durationMinutes = episode.duration / 60;
      transcriptionCost += durationMinutes * TRANSCRIPTION_COST_PER_MINUTE;
    }
  });

  const summarizationCost = CLAUDE_COST_ESTIMATE;
  const ttsCost = summaryLength * TTS_COST_PER_CHAR;
  const total = transcriptionCost + summarizationCost + ttsCost;

  return {
    transcription: transcriptionCost,
    summarization: summarizationCost,
    tts: ttsCost,
    total,
  };
}

/**
 * Check if request would exceed budget limits
 * @returns Error message if budget exceeded, null if OK
 */
export function checkBudget(estimatedCost: number): string | null {
  const budgetInfo = getBudgetInfo();

  // Check per-request limit
  if (estimatedCost > PER_REQUEST_LIMIT) {
    return `Estimated cost $${estimatedCost.toFixed(2)} exceeds per-request limit of $${PER_REQUEST_LIMIT.toFixed(2)}`;
  }

  // Check monthly limit
  if (budgetInfo.monthlySpend + estimatedCost > MONTHLY_LIMIT) {
    return `Would exceed monthly budget: $${budgetInfo.monthlySpend.toFixed(2)} + $${estimatedCost.toFixed(2)} > $${MONTHLY_LIMIT.toFixed(2)}`;
  }

  return null;
}

/**
 * Check if approaching warning threshold
 */
export function shouldShowWarning(): boolean {
  const budgetInfo = getBudgetInfo();
  return budgetInfo.monthlySpend >= WARNING_THRESHOLD && budgetInfo.monthlySpend < MONTHLY_LIMIT;
}

/**
 * Update monthly spend with actual costs
 */
export function updateMonthlySpend(actualCost: number): void {
  if (typeof window === 'undefined') return;

  const currentSpend = parseFloat(localStorage.getItem('monthlySpend') || '0');
  const newSpend = currentSpend + actualCost;
  localStorage.setItem('monthlySpend', newSpend.toString());
}

/**
 * Calculate actual costs from processing data
 */
export function calculateActualCosts(
  minutesTranscribed: number,
  summaryTextLength: number
): CostBreakdown {
  const transcriptionCost = minutesTranscribed * TRANSCRIPTION_COST_PER_MINUTE;
  const summarizationCost = CLAUDE_COST_ESTIMATE;
  const ttsCost = summaryTextLength * TTS_COST_PER_CHAR;
  const total = transcriptionCost + summarizationCost + ttsCost;

  return {
    transcription: transcriptionCost,
    summarization: summarizationCost,
    tts: ttsCost,
    total,
  };
}
