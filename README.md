# Podcast Summary App

Generate AI-powered audio summaries of podcast episodes with spoiler control. Paste Spotify episode URLs, choose a summary length, and get a downloadable audio recap.

## How It Works

1. Paste 1-5 Spotify episode URLs
2. Set a spoiler cutoff point (optional) for the last episode
3. Choose summary duration: 1, 5, or 10 minutes
4. Click "Generate Summary" and wait ~90 seconds
5. Play or download your audio summary

## Architecture

```
User Browser → Next.js Frontend → Next.js API Routes
                                        ↓
                    ┌───────────┬────────┴────────┬──────────────┐
                    │           │                  │              │
              Listen Notes   Fireworks AI     Anthropic      OpenAI TTS
              (metadata)     (transcription)  (summarization)  (speech)
                                                                  ↓
                                                            Vercel Blob
                                                            (storage)
```

## Processing Pipeline

| Step | Service | Time (typical) |
|------|---------|---------------|
| Transcription | Fireworks AI (whisper-v3-turbo) | ~25s |
| Summarization | Claude Haiku 4.5 | ~15s |
| Text-to-Speech | OpenAI TTS (tts-1) | ~50s |
| Storage | Vercel Blob | ~1s |
| **Total** | | **~86s** |

Multiple episodes are transcribed in parallel. TTS chunks are also generated in parallel.

## Tech Stack

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS
- **Transcription:** Fireworks AI (whisper-v3-turbo) — supports up to 1GB, no chunking needed
- **Summarization:** Anthropic Claude Haiku 4.5
- **Text-to-Speech:** OpenAI TTS (tts-1), chunked at sentence boundaries, parallel generation
- **Metadata:** Spotify oEmbed API + Listen Notes API
- **Storage:** Vercel Blob
- **Hosting:** Vercel

## Setup

```bash
npm install
```

Create `.env.local`:

```bash
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
APP_ANTHROPIC_API_KEY=sk-ant-...
LISTENNOTES_API_KEY=...
FIREWORKS_API_KEY=fw_...
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
```

Run locally:

```bash
npm run dev
# Open http://localhost:3000
```

## Cost Per Summary

| Component | Cost | Notes |
|-----------|------|-------|
| Fireworks transcription | ~$0.07 | 60 min episode at $0.0012/min |
| Claude Haiku summarization | ~$0.003 | Varies by transcript length |
| OpenAI TTS | ~$0.015 | Varies by summary length |
| **Total** | **~$0.09** | Per 1-hour episode → 5-min summary |

## Project Structure

```
app/
  api/
    process-episodes/route.ts    # Main pipeline (SSE streaming)
    spotify-metadata/route.ts    # Metadata fetching
  page.tsx                       # Main UI

components/
  EpisodeForm.tsx               # Episode URL input
  EpisodeCard.tsx               # Episode preview card
  AudioPlayer.tsx               # Playback + download
  ProgressTracker.tsx           # Live progress display
  TimestampSlider.tsx           # Spoiler cutoff slider

lib/
  fireworks-transcription.ts    # Fireworks AI transcription
  summarization.ts              # Claude summarization
  tts.ts                        # OpenAI TTS with parallel chunking
  cost-calculator.ts            # Cost tracking
  transcript-truncator.ts       # Timestamp cutoff logic
  utils.ts                      # Helpers
```

## Known Limitations

- **Vercel Timeout:** Free tier has 60s limit; Pro plan supports up to 900s
- **Browser Must Stay Open:** Processing takes ~90 seconds
- **No Caching:** Same podcast processed multiple times incurs cost each time
- **Listen Notes Free Tier:** 100 requests/month

## License

MIT
