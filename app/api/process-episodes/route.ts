import { NextRequest } from 'next/server';
import { SummaryRequest, ProcessingProgress, SummaryResult } from '@/types';
import { put } from '@vercel/blob';
import { textToSpeech } from '@/lib/tts';
import { summarizeEpisodes } from '@/lib/summarization';
import { calculateActualCosts } from '@/lib/cost-calculator';
import { findTranscript } from '@/lib/transcript-finder';
import { transcribeWithFireworks } from '@/lib/fireworks-transcription';
import { truncateTranscript } from '@/lib/transcript-truncator';

// Set maximum duration for this serverless function
// Pro plan allows up to 900 seconds, set to 800 for safety margin
export const maxDuration = 800;

export async function POST(request: NextRequest) {
  try {
    const body: SummaryRequest = await request.json();

    console.log('[Server] Received episodes:', JSON.stringify(body.episodes, null, 2));

    // Validate required fields
    if (!body.episodes || body.episodes.length === 0) {
      return new Response(
        JSON.stringify({ error: 'At least one episode is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get API keys from environment variables
    const openaiApiKey = process.env.OPENAI_API_KEY;
    const anthropicApiKey = process.env.APP_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY;
    const listenNotesApiKey = process.env.LISTENNOTES_API_KEY;
    const fireworksApiKey = process.env.FIREWORKS_API_KEY;

    console.log('[Server] API keys check - OpenAI:', !!openaiApiKey, 'Anthropic:', !!anthropicApiKey, 'Fireworks:', !!fireworksApiKey, 'ListenNotes:', !!listenNotesApiKey);

    if (!openaiApiKey || !anthropicApiKey) {
      return new Response(
        JSON.stringify({ error: 'Server API keys not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!fireworksApiKey) {
      console.error('[Server] FIREWORKS_API_KEY is not set in environment variables');
      return new Response(
        JSON.stringify({ error: 'Fireworks API key not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create SSE stream
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
    const encoder = new TextEncoder();

    // Helper function to send progress updates
    const sendProgress = async (progress: ProcessingProgress) => {
      const data = `data: ${JSON.stringify({ type: 'progress', progress })}\n\n`;
      await writer.write(encoder.encode(data));
    };

    // Process episodes asynchronously
    (async () => {
      try {
        const pipelineStart = Date.now();
        const timings: { step: string; seconds: number }[] = [];

        await sendProgress({
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

            // Transcript search skipped — all sources are stubs that return null
            // TODO: Re-enable when real transcript sources are implemented
            let transcript = '';

            // Transcribe with Fireworks AI if audioUrl available
            if (episode.audioUrl) {
              const fwStart = Date.now();
              try {
                console.log(`[Server] Starting Fireworks transcription for: ${episode.title}`);
                transcript = await transcribeWithFireworks(episode.audioUrl, fireworksApiKey);

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

            // Step 3: If still no transcript, fail
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

        // Collect per-episode timings and build ordered results
        const episodesWithTranscripts = episodeResults.map((result, i) => {
          timings.push(...result.epTimings);
          totalTranscriptionCost += result.cost;

          let { transcript } = result;

          // Truncate final episode at timestamp if specified
          if (i === body.episodes.length - 1 && result.episode.timestamp && result.episode.duration) {
            transcript = truncateTranscript(transcript, result.episode.timestamp, result.episode.duration);
          }

          return { ...result.episode, transcript };
        });

        await sendProgress({
          step: 'Generating summary',
          percentage: 50,
          message: 'Creating text summary with Claude...',
        });

        // Generate summary with Claude API
        const summarizationStart = Date.now();
        const summaryText = await summarizeEpisodes(
          episodesWithTranscripts,
          body.targetDuration,
          anthropicApiKey
        );
        timings.push({
          step: 'Claude summarization',
          seconds: (Date.now() - summarizationStart) / 1000,
        });

        await sendProgress({
          step: 'Converting to speech',
          percentage: 75,
          message: 'Generating audio with OpenAI TTS...',
        });

        // Convert to speech
        const ttsStart = Date.now();
        const audioBuffer = await textToSpeech(
          summaryText,
          body.targetDuration * 60,
          openaiApiKey
        );
        timings.push({
          step: 'OpenAI TTS',
          seconds: (Date.now() - ttsStart) / 1000,
        });

        await sendProgress({
          step: 'Storing audio',
          percentage: 90,
          message: 'Uploading to storage...',
        });

        // Store in Vercel Blob
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

        // Calculate costs
        const costBreakdown = calculateActualCosts(totalTranscriptionCost, summaryText.length);

        const result: SummaryResult = {
          audioUrl: blob.url,
          summaryText,
          actualDuration: Math.floor(summaryText.split(' ').length / 150) * 60,
          targetDuration: body.targetDuration * 60,
          costBreakdown,
        };

        // Send completion
        await writer.write(
          encoder.encode(`data: ${JSON.stringify({ type: 'complete', result })}\n\n`)
        );
        await writer.close();
      } catch (error) {
        console.error('Processing error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        await writer.write(
          encoder.encode(`data: ${JSON.stringify({ type: 'error', error: errorMessage })}\n\n`)
        );
        await writer.close();
      }
    })();

    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });

    /*
    // Future implementation:
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
    const encoder = new TextEncoder();

    // Send progress updates via SSE
    const sendProgress = (progress: ProcessingProgress) => {
      const data = `data: ${JSON.stringify({ type: 'progress', progress })}\n\n`;
      writer.write(encoder.encode(data));
    };

    // Process episodes
    (async () => {
      try {
        sendProgress({ step: 'Fetching metadata', percentage: 10, message: 'Getting episode info...' });

        // 1. Fetch episode metadata
        // 2. Check for existing transcripts
        // 3. Transcribe if needed
        // 4. Truncate final episode
        // 5. Generate summary with Claude
        // 6. Convert to speech with OpenAI TTS
        // 7. Store in Vercel Blob
        // 8. Send complete event

        const result: SummaryResult = {
          audioUrl: 'https://example.com/audio.mp3',
          summaryText: 'Generated summary...',
          actualDuration: 300,
          targetDuration: body.targetDuration * 60,
          costBreakdown: {
            transcription: 0,
            summarization: 0.03,
            tts: 0.01,
            total: 0.04,
          },
        };

        writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'complete', result })}\n\n`));
        writer.close();
      } catch (error) {
        writer.write(
          encoder.encode(
            `data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`
          )
        );
        writer.close();
      }
    })();

    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
    */
  } catch (error) {
    console.error('API error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
