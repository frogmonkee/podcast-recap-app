// OpenAI TTS module

import OpenAI from 'openai';
import { estimateSpeakingDuration, countWords } from './utils';

const MAX_TTS_CHARS = 4096; // OpenAI TTS character limit

/**
 * Converts text to speech using OpenAI TTS API
 * Handles long text by chunking and concatenating audio
 */
export async function textToSpeech(
  text: string,
  targetDurationSeconds: number,
  openaiApiKey: string
): Promise<Buffer> {
  const openai = new OpenAI({ apiKey: openaiApiKey });

  // Check if text needs chunking
  if (text.length > MAX_TTS_CHARS) {
    return await generateLongAudio(text, targetDurationSeconds, openai);
  }

  // Estimate actual duration based on word count
  const wordCount = countWords(text);
  const estimatedDuration = estimateSpeakingDuration(wordCount);

  // Calculate speed adjustment if needed (0.75-1.25x range)
  let speed = 1.0;
  if (estimatedDuration > targetDurationSeconds * 1.15) {
    // Too long, speed up
    speed = Math.min(1.25, estimatedDuration / targetDurationSeconds);
  } else if (estimatedDuration < targetDurationSeconds * 0.85) {
    // Too short, slow down
    speed = Math.max(0.75, estimatedDuration / targetDurationSeconds);
  }

  // Generate speech
  const mp3 = await openai.audio.speech.create({
    model: 'tts-1',
    voice: 'alloy', // Default voice, could be made configurable
    input: text,
    speed: speed,
  });

  // Convert response to buffer
  const buffer = Buffer.from(await mp3.arrayBuffer());

  return buffer;
}

/**
 * Generates audio for long text by chunking and concatenating
 * Splits text into ~4000 character chunks at sentence boundaries
 */
async function generateLongAudio(
  text: string,
  targetDurationSeconds: number,
  openai: OpenAI
): Promise<Buffer> {
  const CHUNK_SIZE = 4000; // Safely under 4096 limit
  const chunks = splitTextIntoChunks(text, CHUNK_SIZE);

  console.log(`Text length: ${text.length} characters. Splitting into ${chunks.length} chunks for TTS...`);

  // Calculate speed adjustment for entire text
  const wordCount = countWords(text);
  const estimatedDuration = estimateSpeakingDuration(wordCount);
  let speed = 1.0;
  if (estimatedDuration > targetDurationSeconds * 1.15) {
    speed = Math.min(1.25, estimatedDuration / targetDurationSeconds);
  } else if (estimatedDuration < targetDurationSeconds * 0.85) {
    speed = Math.max(0.75, estimatedDuration / targetDurationSeconds);
  }

  // Generate audio for each chunk
  const audioBuffers: Buffer[] = [];
  for (let i = 0; i < chunks.length; i++) {
    console.log(`Generating audio chunk ${i + 1}/${chunks.length} (${chunks[i].length} chars)...`);

    const mp3 = await openai.audio.speech.create({
      model: 'tts-1',
      voice: 'alloy',
      input: chunks[i],
      speed: speed,
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());
    audioBuffers.push(buffer);
  }

  console.log(`Successfully generated all ${chunks.length} audio chunks`);

  // Concatenate all audio buffers
  return Buffer.concat(audioBuffers);
}

/**
 * Splits text into chunks at sentence boundaries
 * Tries to keep chunks under maxChars while respecting sentence breaks
 */
function splitTextIntoChunks(text: string, maxChars: number): string[] {
  const chunks: string[] = [];

  // Split into sentences (rough approximation)
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];

  let currentChunk = '';

  for (const sentence of sentences) {
    // If adding this sentence would exceed limit, save current chunk
    if (currentChunk.length + sentence.length > maxChars && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += sentence;
    }
  }

  // Add final chunk
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/**
 * Estimates the file size of generated audio (for cost calculation)
 */
export function estimateAudioSize(text: string): number {
  // TTS generates approximately 1KB per second of audio
  // At 150 words/min, that's ~2.5KB per word
  const wordCount = countWords(text);
  return wordCount * 2500; // bytes
}
