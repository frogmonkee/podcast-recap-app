import { SummaryRequest, ProcessingProgress, SummaryResult } from '@/types';
import { put } from '@vercel/blob';
import { textToSpeech } from '@/lib/tts';
import { summarizeEpisodes } from '@/lib/summarization';
import { calculateActualCosts } from '@/lib/cost-calculator';
import { transcribeWithFireworks } from '@/lib/fireworks-transcription';
import { truncateTranscript } from '@/lib/transcript-truncator';

interface ApiKeys {
  openai: string;
  anthropic: string;
  fireworks: string;
}

export async function processPipeline(
  body: SummaryRequest,
  apiKeys: ApiKeys,
  onProgress: (progress: ProcessingProgress) => Promise<void>
): Promise<SummaryResult> {
  const pipelineStart = Date.now();
  const timings: { step: string; seconds: number }[] = [];

  await onProgress({
    step: 'Transcribing episodes',
    percentage: 5,
    message: `Transcribing ${body.episodes.length} episode(s) in parallel...`,
  });

  // Process all episodes in parallel
  let totalTranscriptionCost = 0;
  const transcriptionStart = Date.now();

  const episodeResults = await Promise.all(
    body.episodes.map(async (episode, i) => {
      const epTimings: { step: string; seconds: number }[] = [];

      let transcript = '';

      if (episode.audioUrl) {
        const fwStart = Date.now();
        try {
          console.log(`[Server] Starting Fireworks transcription for: ${episode.title}`);
          transcript = await transcribeWithFireworks(episode.audioUrl, apiKeys.fireworks);

          const transcriptionTime = (Date.now() - fwStart) / 1000;
          epTimings.push({
            step: `Fireworks transcription (ep ${i + 1}: ${episode.title})`,
            seconds: transcriptionTime,
          });
          console.log(`[Server] Fireworks transcription complete for "${episode.title}" in ${transcriptionTime.toFixed(1)}s`);

          const durationMinutes = episode.duration ? episode.duration / 60 : 60;
          const cost = durationMinutes * 0.0012;
          console.log(`[Server] Estimated transcription cost: $${cost.toFixed(4)}`);

          return { episode, transcript, epTimings, cost };
        } catch (error) {
          console.error(`[Server] Fireworks transcription failed for ${episode.title}:`, error);
          throw new Error(`Failed to transcribe episode: ${episode.title}. ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      if (!transcript) {
        throw new Error(`Could not obtain transcript for episode: ${episode.title}. No audio URL available from Listen Notes.`);
      }

      return { episode, transcript, epTimings, cost: 0 };
    })
  );

  const totalTranscriptionTime = (Date.now() - transcriptionStart) / 1000;
  timings.push({
    step: `All episodes transcribed (parallel)`,
    seconds: totalTranscriptionTime,
  });

  const episodesWithTranscripts = episodeResults.map((result, i) => {
    timings.push(...result.epTimings);
    totalTranscriptionCost += result.cost;

    let { transcript } = result;

    if (i === body.episodes.length - 1 && result.episode.timestamp && result.episode.duration) {
      transcript = truncateTranscript(transcript, result.episode.timestamp, result.episode.duration);
    }

    return { ...result.episode, transcript };
  });

  await onProgress({
    step: 'Generating summary',
    percentage: 50,
    message: 'Creating text summary with Claude...',
  });

  const summarizationStart = Date.now();
  const summaryText = await summarizeEpisodes(
    episodesWithTranscripts,
    body.targetDuration,
    apiKeys.anthropic
  );
  timings.push({
    step: 'Claude summarization',
    seconds: (Date.now() - summarizationStart) / 1000,
  });

  await onProgress({
    step: 'Converting to speech',
    percentage: 75,
    message: 'Generating audio with OpenAI TTS...',
  });

  const ttsStart = Date.now();
  const audioBuffer = await textToSpeech(
    summaryText,
    body.targetDuration * 60,
    apiKeys.openai
  );
  timings.push({
    step: 'OpenAI TTS',
    seconds: (Date.now() - ttsStart) / 1000,
  });

  await onProgress({
    step: 'Storing audio',
    percentage: 90,
    message: 'Uploading to storage...',
  });

  const blobStart = Date.now();
  const blob = await put(`summary-${Date.now()}.mp3`, audioBuffer, {
    access: 'public',
    contentType: 'audio/mpeg',
  });
  timings.push({
    step: 'Vercel Blob upload',
    seconds: (Date.now() - blobStart) / 1000,
  });

  const totalSeconds = (Date.now() - pipelineStart) / 1000;

  // Log timing table
  console.log('\n' + '='.repeat(60));
  console.log('  PIPELINE TIMING SUMMARY');
  console.log('='.repeat(60));
  console.log(`  ${'Step'.padEnd(45)} ${'Time'.padStart(10)}`);
  console.log('-'.repeat(60));
  for (const t of timings) {
    console.log(`  ${t.step.padEnd(45)} ${t.seconds.toFixed(1).padStart(8)}s`);
  }
  console.log('-'.repeat(60));
  console.log(`  ${'TOTAL'.padEnd(45)} ${totalSeconds.toFixed(1).padStart(8)}s`);
  console.log('='.repeat(60) + '\n');

  const costBreakdown = calculateActualCosts(totalTranscriptionCost, summaryText.length);

  return {
    audioUrl: blob.url,
    summaryText,
    actualDuration: Math.floor(summaryText.split(' ').length / 150) * 60,
    targetDuration: body.targetDuration * 60,
    costBreakdown,
  };
}
