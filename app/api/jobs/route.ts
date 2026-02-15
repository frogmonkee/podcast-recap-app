import { NextRequest } from 'next/server';
import { after } from 'next/server';
import { SummaryRequest } from '@/types';
import { createJob, updateJobProgress, completeJob, failJob } from '@/lib/job-store';
import { processPipeline } from '@/lib/process-pipeline';

export const maxDuration = 800;

export async function POST(request: NextRequest) {
  try {
    const body: SummaryRequest = await request.json();

    console.log('[Server] Received episodes:', JSON.stringify(body.episodes, null, 2));

    if (!body.episodes || body.episodes.length === 0) {
      return new Response(
        JSON.stringify({ error: 'At least one episode is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const openaiApiKey = process.env.OPENAI_API_KEY;
    const anthropicApiKey = process.env.APP_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY;
    const fireworksApiKey = process.env.FIREWORKS_API_KEY;

    if (!openaiApiKey || !anthropicApiKey) {
      return new Response(
        JSON.stringify({ error: 'Server API keys not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!fireworksApiKey) {
      return new Response(
        JSON.stringify({ error: 'Fireworks API key not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const jobId = crypto.randomUUID();
    await createJob(jobId);

    after(async () => {
      try {
        const result = await processPipeline(
          body,
          { openai: openaiApiKey, anthropic: anthropicApiKey, fireworks: fireworksApiKey },
          async (progress) => {
            await updateJobProgress(jobId, progress);
          }
        );
        await completeJob(jobId, result);
      } catch (error) {
        console.error('[Server] Pipeline error:', error);
        const message = error instanceof Error ? error.message : 'Unknown error occurred';
        await failJob(jobId, message);
      }
    });

    return new Response(
      JSON.stringify({ jobId }),
      { status: 202, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Server] API error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
