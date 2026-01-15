# Podcast Summary App

Generate audio summaries of multi-episode podcasts with timestamp control to avoid spoilers.

## Features

✅ **Working Features (MVP Demo):**
- Enter up to 5 Spotify podcast episode URLs
- Select summary duration (1, 5, or 10 minutes)
- Timestamp slider for final episode (avoid spoilers)
- Real-time progress tracking with Server-Sent Events
- Claude AI text summarization
- OpenAI TTS audio generation
- Budget tracking ($20/month limit with $5 per-request cap)
- Cost estimation before processing
- Audio playback and download
- Mobile-responsive UI

🚧 **In Progress (Needs API Integration):**
- Spotify API for episode metadata
- RSS feed parsing for audio URLs
- Multi-source transcript finding (Spotify, RSS, YouTube, web)
- OpenAI Whisper transcription (fallback when no transcript exists)

## Current Status: MVP Demo Mode

The app is **fully functional** for testing the UX flow. It uses **mock transcripts** to demonstrate the complete pipeline:
1. Episode input → 2. Progress tracking → 3. Summary generation → 4. Audio output

**What works:**
- All UI components
- Claude API summarization
- OpenAI TTS generation
- Vercel Blob storage
- Budget tracking
- Cost estimation

**What needs integration (8-12 hours):**
- Real Spotify episode metadata
- Actual podcast audio extraction
- Transcript finding/transcription

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up API Keys

You'll need:
- **OpenAI API Key** - Get from [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- **Anthropic API Key** - Get from [https://console.anthropic.com/](https://console.anthropic.com/)
- **Vercel Blob Token** (for deployment) - Get from [https://vercel.com/dashboard/stores](https://vercel.com/dashboard/stores)

Create `.env.local`:

```bash
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token_here
```

**Note:** User API keys (OpenAI, Anthropic) are entered in the UI and stored in browser localStorage only.

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 4. Test the Demo

1. Enter any valid Spotify podcast episode URL (e.g., `https://open.spotify.com/episode/...`)
2. Add your OpenAI and Anthropic API keys in the UI
3. Select summary duration
4. Click "Generate Summary"
5. Watch real-time progress
6. Listen to generated audio summary

**Demo Mode:** The app will use mock transcripts for now, but you'll see the full flow working!

## Project Structure

```
app/
├── api/
│   └── process-episodes/route.ts  # Main API endpoint with SSE
├── layout.tsx
└── page.tsx                        # Main UI page

components/
├── ApiKeyInput.tsx                 # API key management
├── AudioPlayer.tsx                 # Audio playback + download
├── BudgetTracker.tsx               # Monthly budget display
├── CostEstimator.tsx               # Pre-request cost preview
├── EpisodeForm.tsx                 # Episode URLs + duration selector
├── ProgressTracker.tsx             # Live progress updates
└── TimestampSlider.tsx             # Spoiler-avoiding timestamp control

lib/
├── audio-extraction.ts             # RSS/Listen Notes audio URLs (TODO)
├── cost-calculator.ts              # Budget enforcement
├── summarization.ts                # Claude API integration ✅
├── transcript-finder.ts            # Multi-source transcript search (TODO)
├── transcript-truncator.ts         # Timestamp cutoff logic
├── transcription.ts                # OpenAI Whisper (TODO)
├── tts.ts                          # OpenAI TTS ✅
└── utils.ts                        # Helper functions

types/
└── index.ts                        # TypeScript interfaces
```

## Cost Breakdown (Per Summary)

| Component | Cost | When Used |
|-----------|------|-----------|
| Whisper Transcription | $0.006/min | Only if no transcript found |
| Claude Summarization | ~$0.03 | Always |
| OpenAI TTS | ~$0.01 | Always |
| **Best Case** (transcript found) | **$0.04** | 70-80% of episodes |
| **Worst Case** (6 hours audio) | **$2.20** | When transcription needed |

**Budget Protection:**
- $5 max per request (hard limit)
- $20/month total (hard limit)
- Warning at $15/month
- Budget resets on 1st of each month

## API Keys Setup

### OpenAI

1. Go to [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Create new secret key
3. **Set usage limit:** $20/month in [billing settings](https://platform.openai.com/account/billing/limits)
4. Enter key in app UI (stored in browser only)

### Anthropic

1. Go to [https://console.anthropic.com/](https://console.anthropic.com/)
2. Create API key
3. Enter key in app UI (stored in browser only)

### Vercel Blob (For Deployment)

1. Go to [https://vercel.com/dashboard/stores](https://vercel.com/dashboard/stores)
2. Create new Blob store
3. Copy `BLOB_READ_WRITE_TOKEN`
4. Add to `.env.local` (for local dev) and Vercel environment variables (for production)

## Deployment to Vercel

### Option 1: Vercel CLI

```bash
npm install -g vercel
vercel login
vercel
```

### Option 2: GitHub + Vercel

1. Push code to GitHub
2. Go to [https://vercel.com/new](https://vercel.com/new)
3. Import your repository
4. Add environment variable: `BLOB_READ_WRITE_TOKEN`
5. Deploy

Your app will be live at `https://your-app.vercel.app`

## Next Steps for Full Production

To complete the app (8-12 hours of work):

1. **Spotify API Integration** (2-3 hours)
   - Implement OAuth client credentials flow
   - Fetch episode metadata (duration, title, show name)
   - Test with various podcast types

2. **Audio Extraction** (2-3 hours)
   - Parse RSS feeds from Spotify episodes
   - Extract audio URLs
   - Implement Listen Notes API fallback

3. **Transcript Finding** (2-3 hours)
   - Spotify native transcripts
   - RSS feed transcript links
   - YouTube captions
   - Web scraping fallback

4. **Whisper Transcription** (1-2 hours)
   - Audio file chunking (25MB limit)
   - Progress tracking during transcription
   - Error handling

5. **Testing & Polish** (2-3 hours)
   - Test with real podcast episodes
   - Mobile responsiveness testing
   - Edge case handling

## Known Limitations

- **Must keep browser open** during processing (2-4 minutes)
  - Future: Add job queue or email delivery
- **Budget tracked per-browser** (localStorage)
  - Future: Add user accounts with server-side tracking
- **Sequential episode processing** (not parallel)
  - Simpler for MVP, avoids rate limits
- **Mock transcripts in demo mode**
  - Need Spotify/RSS/Whisper integration for real transcripts

## Tech Stack

- **Frontend:** Next.js 14, React, TypeScript, Tailwind CSS
- **AI APIs:** Claude (Anthropic), OpenAI (Whisper + TTS)
- **Storage:** Vercel Blob
- **Deployment:** Vercel (free tier)

## Support

For issues or questions, please open an issue on GitHub or contact the maintainers.

---

**MVP Status:** UI complete, core APIs integrated (Claude + OpenAI TTS), transcript fetching needs implementation.
**Estimated Time to Production:** 8-12 hours of additional development.
