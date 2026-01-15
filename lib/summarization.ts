// Claude summarization module

import Anthropic from '@anthropic-ai/sdk';
import { Episode } from '@/types';
import { calculateTargetWordCount, countWords, isWordCountAcceptable } from './utils';

/**
 * Generates a summary of podcast episodes using Claude
 */
export async function summarizeEpisodes(
  episodes: Episode[],
  targetDurationMinutes: number,
  anthropicApiKey: string
): Promise<string> {
  const anthropic = new Anthropic({ apiKey: anthropicApiKey });

  // Calculate target word count
  const targetWordCount = calculateTargetWordCount(targetDurationMinutes);

  // Combine transcripts with episode markers
  const combinedTranscript = combineTranscripts(episodes);

  // Create prompt for Claude
  const prompt = createSummaryPrompt(combinedTranscript, targetWordCount, episodes.length);

  // Generate summary
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: targetWordCount * 2, // Allow some buffer
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const summaryText = message.content[0].type === 'text' ? message.content[0].text : '';

  // Validate word count
  const actualWordCount = countWords(summaryText);

  if (!isWordCountAcceptable(actualWordCount, targetWordCount)) {
    console.warn(
      `Summary word count ${actualWordCount} deviates from target ${targetWordCount}`
    );
    // Could implement re-generation here if needed
  }

  return summaryText;
}

/**
 * Combines episode transcripts with clear markers
 */
function combineTranscripts(episodes: Episode[]): string {
  return episodes
    .map((episode, index) => {
      const episodeNum = index + 1;
      const cutoffNote = episode.timestamp
        ? ` (summarize only up to ${formatTimestamp(episode.timestamp)})`
        : '';

      return `=== EPISODE ${episodeNum}: ${episode.title}${cutoffNote} ===\n\n${episode.transcript}`;
    })
    .join('\n\n');
}

/**
 * Creates the prompt for Claude to generate the summary
 */
function createSummaryPrompt(
  combinedTranscript: string,
  targetWordCount: number,
  episodeCount: number
): string {
  return `You are creating an audio podcast summary. You will be given transcripts from ${episodeCount} podcast episode(s), and you need to create a cohesive, engaging summary that will be converted to speech.

IMPORTANT REQUIREMENTS:
1. Target length: EXACTLY ${targetWordCount} words (±10% is acceptable, but try to hit the target)
2. Write in a conversational, podcast-style tone suitable for audio
3. Cover all episodes in order, providing clear transitions between episodes
4. If an episode has a timestamp cutoff note, only summarize content up to that point
5. Focus on key insights, main topics, and interesting moments
6. Use natural speech patterns (contractions, varied sentence lengths)
7. Add transition phrases like "In the next episode..." or "Moving on to part two..."

TRANSCRIPTS:
${combinedTranscript}

Please create your ${targetWordCount}-word summary now:`;
}

/**
 * Formats timestamp in seconds to MM:SS or HH:MM:SS
 */
function formatTimestamp(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}
