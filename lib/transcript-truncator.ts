// Transcript truncation module for timestamp cutoff

import { countWords } from './utils';

// Average speaking rate in words per minute
const WORDS_PER_MINUTE = 150;

/**
 * Truncates a transcript at a specified timestamp
 * @param transcript - Full transcript text
 * @param cutoffSeconds - Timestamp in seconds where to cut off
 * @param episodeDurationSeconds - Total duration of the episode
 * @returns Truncated transcript text
 */
export function truncateTranscript(
  transcript: string,
  cutoffSeconds: number,
  episodeDurationSeconds: number
): string {
  // Edge case: cutoff beyond episode length
  if (cutoffSeconds >= episodeDurationSeconds) {
    return transcript;
  }

  // Edge case: cutoff at or near start
  if (cutoffSeconds <= 0) {
    // Return first few sentences as minimum
    const sentences = transcript.match(/[^.!?]+[.!?]+/g) || [];
    return sentences.slice(0, 3).join(' ');
  }

  // Calculate what percentage of the episode we're including
  const percentageToInclude = cutoffSeconds / episodeDurationSeconds;

  // Estimate word position based on cutoff time
  const totalWords = countWords(transcript);
  const estimatedCutoffPosition = Math.floor(totalWords * percentageToInclude);

  // Split transcript into words
  const words = transcript.split(/\s+/);

  // Take words up to estimated position
  const truncatedWords = words.slice(0, estimatedCutoffPosition);

  // Rejoin and try to end at a sentence boundary
  let truncatedText = truncatedWords.join(' ');

  // Find the last sentence-ending punctuation
  const lastSentenceEnd = Math.max(
    truncatedText.lastIndexOf('.'),
    truncatedText.lastIndexOf('!'),
    truncatedText.lastIndexOf('?')
  );

  // If we found a sentence boundary near the end, cut there
  if (lastSentenceEnd > truncatedText.length * 0.9) {
    truncatedText = truncatedText.substring(0, lastSentenceEnd + 1);
  }

  return truncatedText.trim();
}

/**
 * Estimates the word count at a given timestamp
 * @param episodeDurationSeconds - Total duration of the episode
 * @param timestampSeconds - Target timestamp
 * @returns Estimated word count at that timestamp
 */
export function estimateWordCountAtTimestamp(
  episodeDurationSeconds: number,
  timestampSeconds: number
): number {
  const durationMinutes = episodeDurationSeconds / 60;
  const timestampMinutes = timestampSeconds / 60;
  const totalEstimatedWords = durationMinutes * WORDS_PER_MINUTE;
  const percentageComplete = timestampMinutes / durationMinutes;

  return Math.floor(totalEstimatedWords * percentageComplete);
}

/**
 * Validates that a cutoff timestamp is reasonable
 * @param cutoffSeconds - Proposed cutoff time
 * @param episodeDurationSeconds - Total episode duration
 * @returns Error message if invalid, null if valid
 */
export function validateCutoffTimestamp(
  cutoffSeconds: number,
  episodeDurationSeconds: number
): string | null {
  if (cutoffSeconds < 0) {
    return 'Cutoff time cannot be negative';
  }

  if (cutoffSeconds > episodeDurationSeconds) {
    return 'Cutoff time cannot exceed episode duration';
  }

  // Warn if cutoff is very early (less than 5% of episode)
  if (cutoffSeconds < episodeDurationSeconds * 0.05) {
    return 'Cutoff time is very early in the episode. Are you sure?';
  }

  return null;
}
