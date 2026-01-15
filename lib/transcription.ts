// OpenAI Whisper transcription module

import OpenAI from 'openai';

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB limit for Whisper API

/**
 * Transcribes audio using OpenAI Whisper API
 */
export async function transcribeAudio(
  audioUrl: string,
  openaiApiKey: string
): Promise<string> {
  const openai = new OpenAI({ apiKey: openaiApiKey });

  // Download audio file
  const response = await fetch(audioUrl);
  const audioBlob = await response.blob();

  // Check file size - if too large, use chunking
  if (audioBlob.size > MAX_FILE_SIZE) {
    return await transcribeLargeFile(audioBlob, openai);
  }

  // Convert blob to File object
  const audioFile = new File([audioBlob], 'episode.mp3', { type: 'audio/mpeg' });

  // Transcribe with Whisper
  const transcription = await openai.audio.transcriptions.create({
    file: audioFile,
    model: 'whisper-1',
  });

  return transcription.text;
}

/**
 * Transcribes large audio file by splitting into chunks
 * Splits the file into ~20MB chunks and transcribes separately
 */
async function transcribeLargeFile(
  audioBlob: Blob,
  openai: OpenAI
): Promise<string> {
  const CHUNK_SIZE = 20 * 1024 * 1024; // 20MB chunks (safely under 25MB limit)
  const totalSize = audioBlob.size;
  const numChunks = Math.ceil(totalSize / CHUNK_SIZE);

  console.log(`Audio file size: ${(totalSize / 1024 / 1024).toFixed(2)}MB. Splitting into ${numChunks} chunks...`);

  const transcripts: string[] = [];

  for (let i = 0; i < numChunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, totalSize);
    const chunkBlob = audioBlob.slice(start, end, audioBlob.type);

    console.log(`Transcribing chunk ${i + 1}/${numChunks} (${(chunkBlob.size / 1024 / 1024).toFixed(2)}MB)...`);

    // Convert chunk to File object
    const chunkFile = new File([chunkBlob], `chunk-${i}.mp3`, { type: 'audio/mpeg' });

    // Transcribe chunk with context from previous chunk
    const prompt = i > 0 ? transcripts[i - 1].slice(-200) : undefined; // Use last 200 chars as context

    const transcription = await openai.audio.transcriptions.create({
      file: chunkFile,
      model: 'whisper-1',
      prompt: prompt, // Helps maintain continuity between chunks
    });

    transcripts.push(transcription.text);
  }

  console.log(`Successfully transcribed all ${numChunks} chunks`);

  // Join all transcripts with a space
  return transcripts.join(' ');
}
