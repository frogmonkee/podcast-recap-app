// Utility functions for the Podcast Summary App

/**
 * Validates a Spotify episode URL
 */
export function isValidSpotifyUrl(url: string): boolean {
  const spotifyEpisodeRegex = /^https:\/\/open\.spotify\.com\/episode\/[a-zA-Z0-9]+/;
  return spotifyEpisodeRegex.test(url);
}

/**
 * Extracts the episode ID from a Spotify URL
 */
export function extractSpotifyEpisodeId(url: string): string | null {
  const match = url.match(/\/episode\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

/**
 * Counts words in a text string
 */
export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Converts seconds to HH:MM:SS or MM:SS format
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Converts HH:MM:SS or MM:SS format to seconds
 */
export function parseDuration(duration: string): number {
  const parts = duration.split(':').map(Number);

  if (parts.length === 3) {
    // HH:MM:SS
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    // MM:SS
    return parts[0] * 60 + parts[1];
  }

  return 0;
}

/**
 * Calculates target word count based on target duration in minutes
 * Assumes 150 words per minute speaking rate
 */
export function calculateTargetWordCount(targetMinutes: number): number {
  return targetMinutes * 150;
}

/**
 * Estimates speaking duration based on word count
 * Assumes 150 words per minute speaking rate
 */
export function estimateSpeakingDuration(wordCount: number): number {
  return Math.ceil((wordCount / 150) * 60); // returns seconds
}

/**
 * Formats cost as USD currency
 */
export function formatCost(cost: number): string {
  return `$${cost.toFixed(2)}`;
}

/**
 * Checks if word count is within acceptable range of target
 * Allows ±10% deviation
 */
export function isWordCountAcceptable(actual: number, target: number): boolean {
  const deviation = Math.abs(actual - target) / target;
  return deviation <= 0.10;
}
