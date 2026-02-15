import { NextRequest } from 'next/server';
import { getJob } from '@/lib/job-store';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const job = await getJob(id);

  if (!job) {
    return new Response(
      JSON.stringify({ error: 'Job not found' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify(job),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}
