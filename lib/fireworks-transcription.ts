// Fireworks AI transcription module
// Uses Fireworks AI's hosted Whisper v3 turbo for fast transcription
// Downloads audio and sends as binary — no chunking needed (supports up to 1GB)

const FIREWORKS_API_URL = 'https://audio-turbo.us-virginia-1.direct.fireworks.ai/v1/audio/transcriptions';

/**
 * Transcribes audio using Fireworks AI's hosted Whisper v3 turbo model.
 * Downloads audio from the provided URL and sends to Fireworks for transcription.
 * No file size chunking required — Fireworks supports up to 1GB files.
 *
 * @param audioUrl - Public URL to the audio file (e.g., from Listen Notes)
 * @param fireworksApiKey - Fireworks AI API key
 * @returns Transcribed text
 */
export async function transcribeWithFireworks(
  audioUrl: string,
  fireworksApiKey: string
): Promise<string> {
  console.log(`[Fireworks] Starting transcription`);
  console.log(`[Fireworks] Audio URL: ${audioUrl}`);

  const totalStartTime = Date.now();

  try {
    // Step 1: Download audio file
    console.log(`[Fireworks] Downloading audio file...`);
    const downloadStart = Date.now();

    const audioResponse = await fetch(audioUrl);
    if (!audioResponse.ok) {
      throw new Error(`Failed to download audio: ${audioResponse.status} ${audioResponse.statusText}`);
    }

    const audioBlob = await audioResponse.blob();
    const downloadTime = ((Date.now() - downloadStart) / 1000).toFixed(1);
    const fileSizeMB = (audioBlob.size / (1024 * 1024)).toFixed(1);

    console.log(`[Fireworks] Audio downloaded: ${fileSizeMB}MB in ${downloadTime}s`);

    // Step 2: Build multipart form data with binary audio
    const audioFile = new File([audioBlob], 'episode.mp3', { type: 'audio/mpeg' });

    const formData = new FormData();
    formData.append('model', 'whisper-v3-turbo');
    formData.append('file', audioFile);
    formData.append('response_format', 'verbose_json');
    formData.append('temperature', '0');

    // Step 3: Send to Fireworks API
    console.log(`[Fireworks] Sending ${fileSizeMB}MB to Fireworks API...`);
    console.log(`[Fireworks] Endpoint: ${FIREWORKS_API_URL}`);
    console.log(`[Fireworks] Model: whisper-v3-turbo`);

    const transcriptionStart = Date.now();

    const response = await fetch(FIREWORKS_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${fireworksApiKey}`,
      },
      body: formData,
    });

    const transcriptionTime = ((Date.now() - transcriptionStart) / 1000).toFixed(1);

    console.log(`[Fireworks] Response status: ${response.status} ${response.statusText}`);
    console.log(`[Fireworks] Transcription API time: ${transcriptionTime}s`);

    // Log response headers that might be useful for debugging
    const rateLimitRemaining = response.headers.get('x-ratelimit-remaining');
    if (rateLimitRemaining) {
      console.log(`[Fireworks] Rate limit remaining: ${rateLimitRemaining}`);
    }

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`[Fireworks] ERROR: Request failed with status ${response.status}`);
      console.error(`[Fireworks] Error body: ${errorBody}`);
      throw new Error(`Fireworks AI transcription failed (${response.status}): ${errorBody}`);
    }

    const result = await response.json();

    // Extract transcript text
    const transcript = result.text || '';

    const totalTime = ((Date.now() - totalStartTime) / 1000).toFixed(1);

    console.log(`[Fireworks] ✅ Transcription successful`);
    console.log(`[Fireworks] Transcript length: ${transcript.length} characters`);
    console.log(`[Fireworks] Word count: ~${transcript.split(/\s+/).length} words`);
    console.log(`[Fireworks] First 200 chars: "${transcript.substring(0, 200)}..."`);
    console.log(`[Fireworks] Timing breakdown: download=${downloadTime}s, transcription=${transcriptionTime}s, total=${totalTime}s`);

    if (result.duration) {
      console.log(`[Fireworks] Audio duration reported: ${result.duration}s`);
    }

    if (!transcript || transcript.trim().length === 0) {
      console.error(`[Fireworks] WARNING: Received empty transcript`);
      throw new Error('Fireworks AI returned an empty transcript');
    }

    return transcript;
  } catch (error) {
    const totalTime = ((Date.now() - totalStartTime) / 1000).toFixed(1);

    if (error instanceof Error && error.message.includes('Fireworks AI')) {
      // Already logged above, re-throw as-is
      throw error;
    }

    // Unexpected error (network, timeout, etc.)
    console.error(`[Fireworks] ERROR after ${totalTime}s:`, error);
    console.error(`[Fireworks] Error type: ${error instanceof Error ? error.constructor.name : typeof error}`);
    console.error(`[Fireworks] Error message: ${error instanceof Error ? error.message : String(error)}`);

    throw new Error(
      `Fireworks AI transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
