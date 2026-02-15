import { Redis } from '@upstash/redis';
import { Job, ProcessingProgress, SummaryResult } from '@/types';

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

const JOB_TTL_SECONDS = 24 * 60 * 60; // 24 hours

function jobKey(id: string): string {
  return `job:${id}`;
}

export async function createJob(id: string): Promise<Job> {
  const job: Job = {
    id,
    status: 'processing',
    progress: null,
    result: null,
    error: null,
    createdAt: Date.now(),
  };
  await redis.set(jobKey(id), job, { ex: JOB_TTL_SECONDS });
  return job;
}

export async function updateJobProgress(id: string, progress: ProcessingProgress): Promise<void> {
  const job = await redis.get<Job>(jobKey(id));
  if (!job) return;
  job.progress = progress;
  await redis.set(jobKey(id), job, { ex: JOB_TTL_SECONDS });
}

export async function completeJob(id: string, result: SummaryResult): Promise<void> {
  const job = await redis.get<Job>(jobKey(id));
  if (!job) return;
  job.status = 'completed';
  job.result = result;
  job.progress = { step: 'Complete', percentage: 100, message: 'Your summary is ready!' };
  await redis.set(jobKey(id), job, { ex: JOB_TTL_SECONDS });
}

export async function failJob(id: string, error: string): Promise<void> {
  const job = await redis.get<Job>(jobKey(id));
  if (!job) return;
  job.status = 'failed';
  job.error = error;
  await redis.set(jobKey(id), job, { ex: JOB_TTL_SECONDS });
}

export async function getJob(id: string): Promise<Job | null> {
  return redis.get<Job>(jobKey(id));
}
