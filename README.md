# Podcast Summary App

Generate audio summaries of multi-episode podcasts with timestamp control to avoid spoilers.

## Features

### Core Functionality
- ✅ **Spotify Episode Input:** Add multiple Spotify podcast episode URLs
- ✅ **Metadata Fetching:** Automatic episode title, duration, and show name retrieval via Listen Notes API
- ✅ **Spoiler Control:** Timestamp slider for final episode to avoid spoilers
- ✅ **Summary Duration:** Choose 1, 5, or 10-minute summaries
- ✅ **Audio Transcription:** OpenAI Whisper with automatic chunking for large files
- ✅ **AI Summarization:** Claude Sonnet 4.5 for high-quality summaries
- ✅ **Text-to-Speech:** OpenAI TTS with automatic text chunking
- ✅ **Real-time Progress:** Server-Sent Events for live progress updates
- ✅ **Audio Playback:** In-browser audio player with download capability
- ✅ **Cloud Storage:** Vercel Blob for generated audio files
- ✅ **Mobile Responsive:** Works on desktop and mobile devices

### Technical Features
- Server-side API key management (secure)
- Audio file chunking (handles files > 25MB for Whisper)
- Text chunking (handles summaries > 4096 chars for TTS)
- Listen Notes API integration for podcast metadata and audio URLs
- Fallback to 1-hour duration when Listen Notes unavailable

## Current Status: Working MVP

**Deployed and functional on Vercel.** The app successfully processes real podcast episodes through the complete pipeline:

1. User enters Spotify episode URLs
2. Listen Notes fetches metadata and audio URLs
3. Whisper transcribes audio (with chunking for large files)
4. Claude generates summary
5. OpenAI TTS creates audio summary
6. User downloads or plays the summary

## Quick Start

### Prerequisites

You'll need API keys from:
- **OpenAI** - For Whisper transcription and TTS ([Get API key](https://platform.openai.com/api-keys))
- **Anthropic** - For Claude summarization ([Get API key](https://console.anthropic.com/))
- **Listen Notes** - For podcast metadata ([Get API key](https://www.listennotes.com/api/))
- **Vercel Blob** - For audio storage ([Create store](https://vercel.com/dashboard/stores))

### Local Development

1. **Install dependencies:**
```bash
npm install
```

2. **Create `.env.local` file:**
```bash
# API Keys (server-side only, not exposed to browser)
OPENAI_API_KEY=your_openai_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here
LISTENNOTES_API_KEY=your_listennotes_key_here

# Vercel Blob Storage
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token_here
```

3. **Run development server:**
```bash
npm run dev
```

4. **Open browser:**
Navigate to [http://localhost:3000](http://localhost:3000)

5. **Test with a real podcast:**
- Enter a Spotify episode URL (e.g., `https://open.spotify.com/episode/...`)
- Adjust timestamp slider if needed
- Select summary duration
- Click "Generate Summary"
- Wait 2-4 minutes for processing
- Listen to your summary!

## Project Structure

```
app/
├── api/
│   ├── process-episodes/route.ts    # Main processing endpoint with SSE
│   └── spotify-metadata/route.ts     # Spotify + Listen Notes metadata
├── layout.tsx
└── page.tsx                          # Main UI

components/
├── AudioPlayer.tsx                   # Audio playback + download
├── EpisodeCard.tsx                   # Episode preview card
├── EpisodeForm.tsx                   # Episode input form
├── ProgressTracker.tsx               # Live progress display
└── TimestampSlider.tsx               # Spoiler control slider

lib/
├── cost-calculator.ts                # Cost tracking and estimation
├── summarization.ts                  # Claude API integration
├── transcript-finder.ts              # Multi-source transcript search (placeholder)
├── transcript-truncator.ts           # Timestamp cutoff logic
├── transcription.ts                  # OpenAI Whisper with chunking
├── tts.ts                            # OpenAI TTS with chunking
└── utils.ts                          # Helper functions

types/
└── index.ts                          # TypeScript interfaces
```

## Cost Breakdown (Per Summary)

Costs depend on podcast length and whether transcription is needed:

| Component | Cost per Minute | Notes |
|-----------|----------------|-------|
| Whisper Transcription | $0.006/min | Only for audio input |
| Claude Summarization | ~$0.015 | Based on transcript length |
| OpenAI TTS | ~$0.015 | Based on summary length |

**Example costs:**
- 1-hour podcast → 5-min summary: **~$0.40-0.60**
- 2-hour podcast → 10-min summary: **~$0.75-1.00**

**Note:** Listen Notes API has free tier (no additional cost for MVP).

## Deployment to Vercel

### Via GitHub

1. **Push to GitHub:**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin your-github-repo-url
git push -u origin main
```

2. **Deploy on Vercel:**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Add environment variables:
     - `OPENAI_API_KEY`
     - `ANTHROPIC_API_KEY`
     - `LISTENNOTES_API_KEY`
     - `BLOB_READ_WRITE_TOKEN`
   - Click Deploy

3. **Set Function Timeout (if needed):**
   - Vercel Hobby plan: 60 seconds (may timeout on long podcasts)
   - Vercel Pro plan: up to 900 seconds
   - For long podcasts, upgrade to Pro or implement async processing

Your app will be live at `https://your-app.vercel.app`

## Environment Variables

### Local Development (.env.local)
```bash
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
LISTENNOTES_API_KEY=...
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
```

### Vercel Production
Add the same variables in your Vercel project settings:
- Project Settings → Environment Variables
- Make sure variable names match exactly (case-sensitive)
- Vercel will automatically redeploy when you update environment variables

## Known Limitations

### Technical Constraints
- **Vercel Timeout:** Free tier has 60s limit; long podcasts may timeout
  - Workaround: Upgrade to Pro plan (up to 900s)
  - Future: Implement async job queue
- **Browser Must Stay Open:** Processing takes 2-4 minutes
  - Future: Add email notification when complete
- **No Spotify Transcript Access:** Spotify doesn't expose transcripts via API
  - Must use Whisper transcription for all episodes
- **No Caching:** Same podcast processed multiple times costs each time
  - Future: Cache transcripts and summaries

### API Rate Limits
- Listen Notes: 100 requests/month (free tier)
- OpenAI Whisper: Rate limited by account tier
- Claude: Rate limited by account tier

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **AI APIs:**
  - Claude Sonnet 4.5 (Anthropic) - Summarization
  - OpenAI Whisper - Transcription
  - OpenAI TTS - Text-to-Speech
- **Podcast Data:** Listen Notes API
- **Storage:** Vercel Blob
- **Deployment:** Vercel
- **State Management:** React hooks

## Development Notes

### Audio Chunking Strategy
Whisper has a 25MB file size limit. The app automatically:
1. Chunks audio into 20MB segments
2. Transcribes each chunk with context from previous chunk
3. Concatenates transcripts

### TTS Chunking Strategy
OpenAI TTS has a 4096 character limit. The app automatically:
1. Splits text at sentence boundaries
2. Generates audio for each chunk
3. Concatenates audio buffers

### Logging
The app includes detailed console logging for debugging:
- Listen Notes API calls and responses
- Transcription progress
- TTS generation
- Error tracking

Check Vercel function logs for production debugging.

## Support

For issues or questions:
- Open an issue on GitHub
- Check Vercel function logs for errors
- Review console logs in browser DevTools

## License

MIT
