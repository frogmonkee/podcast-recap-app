import { NextRequest } from 'next/server';
import { SummaryRequest, ProcessingProgress, SummaryResult } from '@/types';
import { put } from '@vercel/blob';
import { textToSpeech } from '@/lib/tts';
import { summarizeEpisodes } from '@/lib/summarization';
import { calculateActualCosts } from '@/lib/cost-calculator';
import { findTranscript } from '@/lib/transcript-finder';
import { transcribeAudio } from '@/lib/transcription';
import { truncateTranscript } from '@/lib/transcript-truncator';

export async function POST(request: NextRequest) {
  try {
    const body: SummaryRequest = await request.json();

    // Validate required fields
    if (!body.episodes || body.episodes.length === 0) {
      return new Response(
        JSON.stringify({ error: 'At least one episode is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get API keys from environment variables
    const openaiApiKey = process.env.OPENAI_API_KEY;
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
    const listenNotesApiKey = process.env.LISTENNOTES_API_KEY;

    if (!openaiApiKey || !anthropicApiKey) {
      return new Response(
        JSON.stringify({ error: 'Server API keys not configured' }),
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
        await sendProgress({
          step: 'Fetching transcripts',
          percentage: 5,
          message: 'Searching for existing transcripts...',
        });

        // Process each episode to get transcripts
        const episodesWithTranscripts = [];
        let totalTranscriptionCost = 0;

        for (let i = 0; i < body.episodes.length; i++) {
          const episode = body.episodes[i];
          const progress = 5 + (i / body.episodes.length) * 40; // 5% to 45%

          await sendProgress({
            step: 'Processing episodes',
            percentage: Math.round(progress),
            message: `Processing episode ${i + 1} of ${body.episodes.length}: ${episode.title}`,
          });

          let transcript = '';

          // Step 1: Try to find existing transcript
          try {
            const foundTranscript = await findTranscript(
              episode.url,
              episode.title,
              episode.showName || 'Unknown Show'
            );

            if (foundTranscript) {
              transcript = foundTranscript.text;
              console.log(`Found ${foundTranscript.source} transcript for: ${episode.title}`);
            }
          } catch (error) {
            console.error('Transcript search failed:', error);
          }

          // Step 2: If no transcript found and audioUrl available, transcribe with Whisper
          if (!transcript && episode.audioUrl) {
            await sendProgress({
              step: 'Transcribing audio',
              percentage: Math.round(progress),
              message: `Transcribing episode ${i + 1} with Whisper...`,
            });

            try {
              transcript = await transcribeAudio(episode.audioUrl, openaiApiKey);

              // Estimate transcription cost (Whisper is $0.006 per minute)
              const durationMinutes = episode.duration ? episode.duration / 60 : 60;
              totalTranscriptionCost += durationMinutes * 0.006;

              console.log(`Transcribed episode: ${episode.title}`);
            } catch (error) {
              console.error(`Whisper transcription failed for ${episode.title}:`, error);
              throw new Error(`Failed to transcribe episode: ${episode.title}. ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          }

          // Step 3: If still no transcript, fail
          if (!transcript) {
            throw new Error(`Could not obtain transcript for episode: ${episode.title}. No audio URL available from Listen Notes.`);
          }

          // Step 4: Truncate final episode at timestamp if specified
          if (i === body.episodes.length - 1 && episode.timestamp && episode.duration) {
            transcript = truncateTranscript(transcript, episode.timestamp, episode.duration);
          }

          episodesWithTranscripts.push({
            ...episode,
            transcript,
          });
        }

        await sendProgress({
          step: 'Generating summary',
          percentage: 50,
          message: 'Creating text summary with Claude...',
        });

        // Generate summary with Claude API
        const summaryText = await summarizeEpisodes(
          episodesWithTranscripts,
          body.targetDuration,
          anthropicApiKey
        );

        await sendProgress({
          step: 'Converting to speech',
          percentage: 75,
          message: 'Generating audio with OpenAI TTS...',
        });

        // Convert to speech
        const audioBuffer = await textToSpeech(
          summaryText,
          body.targetDuration * 60,
          openaiApiKey
        );

        await sendProgress({
          step: 'Storing audio',
          percentage: 90,
          message: 'Uploading to storage...',
        });

        // Store in Vercel Blob
        const blob = await put(`summary-${Date.now()}.mp3`, audioBuffer, {
          access: 'public',
          contentType: 'audio/mpeg',
        });

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
