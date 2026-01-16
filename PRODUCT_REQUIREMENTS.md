# Podcast Summary App - Product Requirements Document

**Project:** Podcast Summary App MVP
**Last Updated:** January 15, 2026
**Status:** Working MVP deployed on Vercel
**Repository:** https://github.com/frogmonkee/podcast-recap-app

---

## Executive Summary

A web application that generates AI-powered audio summaries of multi-episode podcasts with timestamp control to avoid spoilers. Users input Spotify episode URLs, select a summary duration (1, 5, or 10 minutes), and receive a downloadable audio summary created by transcribing podcasts with OpenAI Whisper, summarizing with Claude Sonnet 4.5, and converting to speech with OpenAI TTS.

**Current State:** Fully functional MVP deployed on Vercel with end-to-end flow tested and working.

---

## Product Vision

### Goal
Enable podcast listeners to catch up on multi-episode shows quickly without spoilers, making podcast consumption more accessible and time-efficient.

### Target User
Podcast enthusiasts who:
- Fall behind on serial podcasts
- Want to catch up without spoilers
- Have limited time but want to stay current with shows
- Prefer audio content over text summaries

### Success Metrics (Future)
- User retention rate
- Average summaries generated per user
- Cost per summary
- User satisfaction scores

---

## Core Features

### 1. Episode Input & Metadata Fetching
**Requirement:** Users can add 1-5 Spotify podcast episode URLs

**Implementation:**
- Accepts Spotify episode URLs (format: `https://open.spotify.com/episode/[id]`)
- Real-time URL validation with visual feedback (green border = valid, red border = invalid)
- Automatic metadata fetching on URL paste using Listen Notes API
- Displays episode cards with:
  - Episode title
  - Show name
  - Episode thumbnail
  - Duration (in MM:SS format)
  - Remove button (if multiple episodes)

**Technical Details:**
- Uses Spotify oEmbed API (free, no auth) for basic metadata
- Enhances with Listen Notes API for accurate duration and audio URL
- Fallback to 1-hour duration if Listen Notes unavailable
- Episode cards replace input fields when metadata loads

### 2. Spoiler Control (Timestamp Slider)
**Requirement:** Users can set a cutoff point for the final episode to avoid spoilers

**Implementation:**
- Slider appears only for the last episode
- Shows episode title and duration
- Allows selection of any timestamp from 00:00 to full duration
- Displays selected timestamp in HH:MM:SS format
- Updates in real-time as user drags slider

**Technical Details:**
- Only the last episode's transcript is truncated
- Truncation happens before summarization
- Default: Full duration (no truncation)

### 3. Summary Duration Selection
**Requirement:** Users choose output summary length

**Implementation:**
- Three options: 1 minute, 5 minutes, 10 minutes
- Default: 5 minutes
- Visual button selection (blue = selected, gray = unselected)

**Technical Details:**
- Passed to Claude for summary generation
- Used to calculate target word count for summary
- Influences TTS generation length

### 4. Real-Time Progress Tracking
**Requirement:** Users see detailed progress during processing

**Implementation:**
- Server-Sent Events (SSE) stream from backend
- Progress bar with percentage (0-100%)
- Step-by-step status messages:
  - "Fetching transcripts..."
  - "Processing episode X of Y..."
  - "Transcribing audio with Whisper..."
  - "Creating text summary with Claude..."
  - "Converting to speech..."
  - "Uploading audio..."

**Technical Details:**
- Non-blocking UI during processing
- Real-time updates every few seconds
- Shows which episode is currently being processed
- Estimated processing time: 2-4 minutes for typical episodes

### 5. Audio Transcription
**Requirement:** Convert podcast audio to text using OpenAI Whisper

**Implementation:**
- Downloads audio from Listen Notes URL
- Automatically chunks files >25MB into 20MB segments
- Transcribes each chunk with context from previous chunk (via `prompt` parameter)
- Concatenates transcripts

**Technical Details:**
- Whisper API has 25MB file size limit
- Chunking preserves context for better accuracy
- Cost: $0.006 per minute of audio
- Error handling for API failures with retry logic

### 6. AI Summarization
**Requirement:** Generate coherent multi-episode summary using Claude

**Implementation:**
- Uses Claude Sonnet 4.5 for high-quality summaries
- Processes all episode transcripts together
- Generates summary tailored to target duration
- Maintains narrative flow across episodes

**Technical Details:**
- Model: Claude Sonnet 4.5 (`claude-sonnet-4-5-20250929`)
- Prompt includes:
  - All episode titles and transcripts
  - Target duration (1, 5, or 10 minutes)
  - Instructions to maintain narrative coherence
  - Spoiler awareness (truncated final episode)
- Cost: ~$0.015 per summary (varies by transcript length)

### 7. Text-to-Speech Generation
**Requirement:** Convert summary text to natural-sounding audio

**Implementation:**
- Uses OpenAI TTS API
- Automatically chunks text >4096 characters at sentence boundaries
- Generates audio for each chunk
- Concatenates audio buffers into single file

**Technical Details:**
- Model: `tts-1` (standard quality)
- Voice: Default OpenAI voice
- Character limit: 4096 per request
- Chunking strategy: Split at sentence boundaries (`.`, `!`, `?`)
- Output format: MP3
- Cost: ~$0.015 per summary

### 8. Cloud Storage & Download
**Requirement:** Store and deliver generated audio files

**Implementation:**
- Uploads MP3 to Vercel Blob storage
- Generates unique blob URL
- Provides in-browser audio player with controls
- Download button for saving locally

**Technical Details:**
- Storage: Vercel Blob (cloud object storage)
- File naming: Timestamped for uniqueness
- Retention: Files persist until manually deleted
- Browser player: HTML5 audio element with controls

### 9. Mobile Responsiveness
**Requirement:** App works on all device sizes

**Implementation:**
- Tailwind CSS responsive utilities
- Mobile-first design approach
- Touch-friendly UI elements
- Responsive typography and spacing

**Technical Details:**
- Breakpoints: Mobile (<640px), Tablet (640-1024px), Desktop (>1024px)
- Tested on iOS Safari, Chrome mobile, Firefox mobile

---

## Technical Architecture

### Tech Stack

**Frontend:**
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS

**Backend:**
- Next.js API Routes (serverless functions)
- Server-Sent Events for real-time updates

**AI Services:**
- OpenAI Whisper (transcription)
- Anthropic Claude Sonnet 4.5 (summarization)
- OpenAI TTS (text-to-speech)

**Data & Storage:**
- Listen Notes API (podcast metadata & audio URLs)
- Vercel Blob (audio file storage)

**Deployment:**
- Vercel (hosting & CI/CD)
- GitHub (version control)

### System Architecture

```
User Browser
    ↓
Next.js Frontend (React)
    ↓
Next.js API Routes
    ↓
┌─────────────┬──────────────┬───────────────┬─────────────┐
│             │              │               │             │
Spotify       Listen Notes   OpenAI          Anthropic     Vercel Blob
oEmbed API    API           (Whisper + TTS)  (Claude)      Storage
```

### Data Flow

1. **Metadata Fetching:**
   - User pastes Spotify URL
   - Frontend calls `/api/spotify-metadata`
   - API fetches oEmbed data (title, thumbnail)
   - API searches Listen Notes for episode
   - Returns complete metadata to frontend
   - Frontend updates episode card

2. **Summary Generation:**
   - User clicks "Generate Summary"
   - Frontend calls `/api/process-episodes` with SSE
   - For each episode:
     - Download audio from Listen Notes URL
     - Transcribe with Whisper (chunked if >25MB)
     - Store transcript in memory
   - Send all transcripts to Claude
   - Claude generates summary
   - Send summary to OpenAI TTS (chunked if >4096 chars)
   - Upload MP3 to Vercel Blob
   - Return blob URL to frontend
   - Frontend displays audio player

### File Structure

```
podcast-summary-app/
├── app/
│   ├── api/
│   │   ├── process-episodes/route.ts    # Main processing endpoint (SSE)
│   │   └── spotify-metadata/route.ts    # Metadata fetching
│   ├── layout.tsx
│   └── page.tsx                          # Main UI page
│
├── components/
│   ├── AudioPlayer.tsx                   # Audio playback + download
│   ├── EpisodeCard.tsx                   # Episode preview card
│   ├── EpisodeForm.tsx                   # Episode input form
│   ├── ProgressTracker.tsx               # Live progress display
│   └── TimestampSlider.tsx               # Spoiler control slider
│
├── lib/
│   ├── cost-calculator.ts                # Cost tracking
│   ├── summarization.ts                  # Claude API integration
│   ├── transcript-finder.ts              # Multi-source transcript search (placeholder)
│   ├── transcript-truncator.ts           # Timestamp cutoff logic
│   ├── transcription.ts                  # Whisper with chunking
│   ├── tts.ts                            # TTS with chunking
│   └── utils.ts                          # Helper functions
│
├── types/
│   └── index.ts                          # TypeScript interfaces
│
├── .env.local                            # Environment variables (local)
├── .gitignore
├── package.json
└── README.md
```

---

## Design Decisions

### 1. Why Listen Notes Instead of Spotify API?
**Decision:** Use Listen Notes API for podcast metadata and audio URLs

**Rationale:**
- Spotify Web API doesn't provide direct audio download URLs (only 30-second previews)
- Spotify doesn't expose transcript data via API
- Listen Notes provides:
  - Full audio file URLs for podcasts
  - Accurate episode durations
  - Show metadata
  - Free tier: 100 requests/month (sufficient for MVP)

**Trade-off:** Limited to 100 Listen Notes calls per month on free tier

### 2. Why Server-Side API Keys?
**Decision:** Store all API keys server-side as environment variables

**Rationale:**
- Security: API keys never exposed to browser
- Cost control: Prevents API key theft and abuse
- Simplicity: No user account/auth required for MVP
- Centralized billing: All costs on developer's accounts

**Trade-off:** Developer pays for all API usage (acceptable for MVP testing)

### 3. Why Whisper for Transcription?
**Decision:** Use OpenAI Whisper instead of searching for existing transcripts

**Rationale:**
- Spotify transcripts not accessible via API
- Most podcasts don't publish transcripts publicly
- Whisper provides consistent, high-quality transcriptions
- Cost-effective at $0.006/minute

**Trade-off:** Higher cost per summary (~$0.40-0.60 for 1-hour episode)

### 4. Why SSE for Progress Updates?
**Decision:** Use Server-Sent Events instead of polling or WebSockets

**Rationale:**
- Simpler than WebSockets for one-way communication
- Built into Next.js without additional libraries
- More efficient than polling (no repeated requests)
- Browser-native EventSource API

**Trade-off:** Only works for server-to-client communication

### 5. Why Audio Chunking Strategy?
**Decision:** Chunk at 20MB for Whisper, 4000 chars for TTS

**Rationale:**
- Whisper: 25MB limit, so 20MB provides safety margin
- TTS: 4096 char limit, so 4000 chars provides margin
- Sentence boundary splitting preserves context
- Overlap/prompt parameter maintains continuity

**Trade-off:** More API calls (slight cost increase, but minimal)

### 6. Why Client-Side State for Metadata?
**Decision:** Store episode metadata in React state, pass directly to processing endpoint

**Rationale:**
- No database required for MVP
- Fast and simple
- Metadata already fetched when user inputs URL

**Critical Implementation Detail:** Must pass metadata directly via local variable (not state) to avoid React async state update race conditions

**Trade-off:** Data lost on page refresh (acceptable for MVP)

### 7. Why Vercel Blob for Storage?
**Decision:** Use Vercel Blob instead of S3 or local storage

**Rationale:**
- Integrated with Vercel deployment
- Simple API (put/get)
- No additional AWS account needed
- Sufficient for MVP

**Trade-off:** Vendor lock-in to Vercel ecosystem

---

## Critical Implementation Details

### Bug Fix: Metadata State Timing Issue

**Problem Discovered:**
When user pasted a Spotify URL, the metadata was fetched successfully from Listen Notes (including `audioUrl`), but when submitted to the processing endpoint, the episode data showed:
- `title: "Episode 1"` (fallback)
- `duration: 3600` (fallback)
- `audioUrl: undefined` (missing!)

**Root Cause:**
React state updates are asynchronous. The flow was:
1. `handleUrlChange` → `fetchEpisodeMetadata` (returns metadata)
2. Inside `fetchEpisodeMetadata` → `setEpisodeMetadata(newMetadata)` (schedules state update)
3. `handleUrlChange` → `updateEpisodes()` immediately
4. `updateEpisodes` reads `episodeMetadata[index]` → still `null` (state not updated yet!)

**Solution:**
Pass fetched metadata directly via local variable instead of relying on state:

```typescript
// Old (broken)
const handleUrlChange = async (index: number, value: string) => {
  metadata = await fetchEpisodeMetadata(value, index);
  // fetchEpisodeMetadata calls setEpisodeMetadata(...)
  updateEpisodes(newUrls, timestamp); // Reads from state (not updated yet!)
};

// New (fixed)
const handleUrlChange = async (index: number, value: string) => {
  const newMetadata = [...episodeMetadata];
  metadata = await fetchEpisodeMetadata(value, index);
  newMetadata[index] = metadata; // Store in local variable
  updateEpisodesWithMetadata(newUrls, newMetadata, timestamp); // Pass directly
};
```

**Key Lesson:** When fetching async data and immediately using it, don't rely on state updates - use local variables.

### Listen Notes Search Strategy

**Implementation:**
Two-tier search approach to maximize match rate:

1. **First attempt:** Search by title only (`only_in=title`)
2. **Fallback:** If no results, search by title + show name (broader search)

**Rationale:**
- Title-only search is more precise
- Fallback ensures we find episodes even if title matching is imperfect
- Show name adds context for disambiguation

### Audio File Chunking for Whisper

**Implementation:**
```typescript
// If audio file > 25MB:
1. Download audio file
2. Split into 20MB chunks
3. For each chunk:
   - Transcribe with Whisper
   - Use previous chunk's transcript as `prompt` parameter
4. Concatenate all transcripts
```

**Rationale:**
- Whisper has 25MB file size limit
- 20MB chunks provide safety margin
- `prompt` parameter maintains context between chunks
- Preserves accuracy across chunk boundaries

### TTS Text Chunking

**Implementation:**
```typescript
// If summary text > 4096 characters:
1. Split text at sentence boundaries
2. Keep chunks under 4000 characters
3. For each chunk:
   - Generate audio with OpenAI TTS
4. Concatenate audio buffers
```

**Rationale:**
- TTS has 4096 character limit
- Sentence boundary splitting avoids mid-sentence cuts
- 4000-char limit provides safety margin
- Audio concatenation is lossless for MP3

---

## Environment Variables

### Required Variables

**Local Development (`.env.local`):**
```bash
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
LISTENNOTES_API_KEY=...
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
```

**Vercel Production:**
Same variables in Vercel project settings → Environment Variables

**CRITICAL:** Variable names must match exactly (case-sensitive):
- ✅ `OPENAI_API_KEY` (correct)
- ❌ `OPENAI_WHISPER_KEY` (wrong)
- ✅ `ANTHROPIC_API_KEY` (correct)
- ❌ `ANTHROPIC_KEY` (wrong)
- ✅ `LISTENNOTES_API_KEY` (correct)
- ❌ `LISTEN_NOTES_KEY` (wrong)

### Security

- `.env.local` is gitignored (never committed)
- All API keys are server-side only (never exposed to browser)
- Vercel environment variables are encrypted at rest
- API keys should be rotated if accidentally exposed

---

## Cost Analysis

### Per-Summary Breakdown

| Component | Cost Formula | Example (1hr podcast → 5min summary) |
|-----------|--------------|-------------------------------------|
| Whisper Transcription | $0.006/min × audio minutes | $0.36 (60 min) |
| Claude Summarization | ~$0.015 (varies by length) | $0.015 |
| OpenAI TTS | ~$0.015 (varies by output) | $0.015 |
| Listen Notes API | Free tier (100/month) | $0.00 |
| **Total** | | **~$0.39** |

### Cost Projections

**MVP Testing (10 summaries/month):**
- Cost: ~$4/month
- Listen Notes: Well within free tier

**Light Usage (50 summaries/month):**
- Cost: ~$20/month
- Listen Notes: Within free tier

**Heavy Usage (200 summaries/month):**
- Cost: ~$78/month
- Listen Notes: Exceeds free tier (need paid plan: $9/month for 1000 calls)

### Cost Optimization Opportunities

1. **Transcript Caching:** Store transcripts for frequently-requested episodes
2. **Summary Caching:** Reuse summaries if same episodes + duration requested
3. **Smart Sampling:** Summarize only key segments instead of full transcription
4. **User Limits:** Rate limiting per IP or user account
5. **Batch Processing:** Queue multiple requests to optimize API usage

---

## Known Limitations

### Technical Constraints

1. **Vercel Timeout**
   - Free tier: 10 seconds (too short)
   - Hobby tier: 60 seconds (may timeout for long podcasts)
   - Pro tier: Up to 900 seconds (current workaround)
   - **Solution:** Upgrade to Pro plan or implement async job queue

2. **Browser Must Stay Open**
   - Processing takes 2-4 minutes
   - Browser tab must remain open during processing
   - **Solution:** Email notification when complete

3. **No Spotify Transcript Access**
   - Spotify shows transcripts in UI but doesn't expose via API
   - Must use Whisper for all episodes
   - **Solution:** None available (Spotify API limitation)

4. **No Caching**
   - Same podcast processed multiple times costs each time
   - **Solution:** Implement transcript/summary caching with database

5. **Sequential Processing**
   - Episodes processed one at a time (not parallel)
   - **Rationale:** Simpler for MVP, avoids rate limits

### API Rate Limits

- **Listen Notes:** 100 requests/month (free tier)
- **OpenAI Whisper:** Account tier dependent
- **Anthropic Claude:** Account tier dependent
- **OpenAI TTS:** Account tier dependent

### Browser Compatibility

- Tested on: Chrome, Firefox, Safari (desktop & mobile)
- Requires JavaScript enabled
- Requires HTML5 audio support

---

## Deployment

### Vercel Deployment

**Setup:**
1. Push code to GitHub repository
2. Connect GitHub repo to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy (automatic)

**Environment Variables (Vercel Dashboard):**
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `LISTENNOTES_API_KEY`
- `BLOB_READ_WRITE_TOKEN`

**Function Timeout:**
- Default: 10 seconds (insufficient)
- Can export `maxDuration = 300` in route.ts
- Requires Vercel Pro plan for >60 seconds

**Automatic Deployments:**
- Every push to `main` branch triggers deployment
- Preview deployments for pull requests
- Environment variables inherited from production

### Local Development

**Setup:**
```bash
npm install
# Create .env.local with API keys
npm run dev
# Open http://localhost:3000
```

**Testing:**
1. Paste Spotify episode URL
2. Wait for episode card to load (metadata fetched)
3. Adjust timestamp slider if needed
4. Select summary duration
5. Click "Generate Summary"
6. Wait 2-4 minutes
7. Play or download generated audio

---

## Future Roadmap

### Phase 1: Production Readiness

1. **Async Job Processing**
   - Implement Vercel Queue or similar
   - Remove browser timeout dependency
   - Add job status polling endpoint
   - Email notification when complete

2. **User Authentication**
   - Add Clerk or NextAuth
   - User accounts with session management
   - Usage tracking per user

3. **Payment Integration**
   - Stripe integration
   - Pay-per-summary or credit system
   - Subscription tiers

4. **Rate Limiting**
   - Per-user limits (e.g., 5 summaries/day)
   - IP-based limits for anonymous users
   - Prevent abuse

5. **Caching System**
   - Store transcripts in database
   - Cache summaries for duplicate requests
   - Reduce API costs

### Phase 2: Optimization

1. **Smart Sampling**
   - Summarize only key segments
   - Reduce transcription costs
   - Machine learning to identify important sections

2. **Batch Processing**
   - Queue multiple user requests
   - Process efficiently
   - Reduce API overhead

3. **Alternative Models**
   - Test cheaper transcription models
   - Evaluate Claude Haiku for summarization
   - Compare quality vs. cost

4. **Database Implementation**
   - PostgreSQL or similar
   - Store user data, transcripts, summaries
   - Enable history and analytics

### Phase 3: Feature Expansion

1. **Summary History**
   - Save user's past summaries
   - Re-download previous summaries
   - Share summaries with friends

2. **Social Sharing**
   - Generate shareable links
   - Social media cards
   - Referral program

3. **RSS Feed Support**
   - Accept RSS feed URLs directly
   - Auto-detect episodes
   - Support non-Spotify podcasts

4. **YouTube Podcast Support**
   - Accept YouTube URLs
   - Extract audio from video
   - Support video podcasts

5. **Custom Voices**
   - Choose TTS voice (male/female/accent)
   - Match original podcast host voice
   - Premium feature

6. **Multi-Language Support**
   - Support non-English podcasts
   - Whisper supports 50+ languages
   - Localized UI

### Phase 4: Marketing & Growth

1. **Landing Page**
   - Value proposition
   - Demo video
   - Testimonials
   - Pricing page

2. **SEO Optimization**
   - Blog content
   - Podcast summaries as SEO content
   - Backlink strategy

3. **Community Distribution**
   - Product Hunt launch
   - Reddit (r/podcasts, r/productivity)
   - Twitter/X (podcast community)
   - Podcast Discord servers

4. **Content Marketing**
   - YouTube demo videos
   - Blog posts about productivity
   - Guest posts on podcast blogs
   - Case studies

---

## Development Notes

### Debugging Tips

**Browser Console Logs:**
- `[EpisodeForm]` - Episode metadata and state updates
- `[Client]` - Data being submitted to backend

**Server Logs (Terminal or Vercel):**
- `[Metadata API]` - Spotify/Listen Notes API calls
- `[Listen Notes]` - Search results and audio URLs
- `[Server]` - Episodes data received by backend

**Common Issues:**

1. **"No audio URL available"**
   - Check Listen Notes API key is set correctly
   - Check Vercel logs for API errors
   - Verify episode exists on Listen Notes

2. **Timeout on Vercel**
   - Check podcast length (very long = timeout)
   - Verify Vercel Pro plan active
   - Check function execution time in logs

3. **Metadata shows "Episode 1" with 1hr fallback**
   - State timing issue (should be fixed)
   - Check browser console for metadata array
   - Verify metadata fetch succeeded

### Testing Checklist

- [ ] Episode URL validation works (green/red borders)
- [ ] Episode card appears after pasting URL
- [ ] Timestamp slider appears for last episode
- [ ] Timestamp updates in real-time
- [ ] Summary duration selection works
- [ ] Generate button enables when episode added
- [ ] Progress tracker shows during processing
- [ ] Audio player appears when complete
- [ ] Download button works
- [ ] Mobile layout responsive
- [ ] Error handling for invalid URLs
- [ ] Error handling for API failures

---

## API References

### Listen Notes API

**Base URL:** `https://listen-api.listennotes.com/api/v2`

**Search Endpoint:**
```
GET /search?q={query}&type=episode&only_in=title
Headers: X-ListenAPI-Key: {api_key}
```

**Response:**
```json
{
  "results": [
    {
      "title_original": "Episode Title",
      "audio": "https://audio.listennotes.com/...",
      "audio_length_sec": 3600,
      "podcast": {
        "title_original": "Show Name"
      },
      "description_original": "...",
      "thumbnail": "..."
    }
  ]
}
```

**Rate Limits:** 100 requests/month (free tier)

### Spotify oEmbed API

**Endpoint:**
```
GET https://open.spotify.com/oembed?url={spotify_url}
```

**Response:**
```json
{
  "title": "Episode Title • Show Name",
  "thumbnail_url": "https://...",
  "html": "<iframe>...</iframe>"
}
```

**Rate Limits:** No official limit (public endpoint)

### OpenAI Whisper API

**Endpoint:**
```
POST https://api.openai.com/v1/audio/transcriptions
```

**Parameters:**
- `file`: Audio file (max 25MB)
- `model`: "whisper-1"
- `prompt`: Context from previous chunk (optional)

**Cost:** $0.006 per minute

### Anthropic Claude API

**Model:** `claude-sonnet-4-5-20250929`

**Endpoint:**
```
POST https://api.anthropic.com/v1/messages
```

**Cost:** ~$3 per million input tokens, ~$15 per million output tokens

### OpenAI TTS API

**Endpoint:**
```
POST https://api.openai.com/v1/audio/speech
```

**Parameters:**
- `model`: "tts-1"
- `input`: Text (max 4096 chars)
- `voice`: Default voice

**Cost:** ~$15 per million characters

---

## Security Considerations

### Current Implementation

✅ **Implemented:**
- API keys server-side only (environment variables)
- .env.local gitignored
- No client-side API key exposure
- HTTPS enforced by Vercel

❌ **Not Implemented (Future):**
- User authentication/authorization
- Rate limiting per user
- Input sanitization (XSS protection)
- CSRF protection
- API key rotation policy
- Audit logging
- DDoS protection

### Recommendations for Production

1. **User Authentication**
   - Implement OAuth or email/password
   - Session management with secure cookies
   - JWT tokens for API access

2. **Rate Limiting**
   - Per-user limits (5-10 summaries/day)
   - IP-based limits for anonymous users
   - Sliding window algorithm

3. **Input Validation**
   - Sanitize all user inputs
   - Validate Spotify URL format strictly
   - Limit episode count to prevent abuse

4. **Monitoring & Alerting**
   - Error tracking (Sentry)
   - Cost monitoring (OpenAI/Anthropic dashboards)
   - Usage analytics
   - Alert on unusual patterns

5. **API Key Management**
   - Rotate keys quarterly
   - Use separate keys for dev/staging/prod
   - Monitor for leaked keys

---

## Contact & Support

**Repository:** https://github.com/frogmonkee/podcast-recap-app

**For Issues:**
- Check Vercel function logs
- Review browser console logs
- Check GitHub issues

**Tech Support:**
- Vercel documentation
- Next.js documentation
- API provider documentation (OpenAI, Anthropic, Listen Notes)

---

## Appendix: TypeScript Interfaces

### Core Types

```typescript
export interface Episode {
  url: string;
  title: string;
  showName?: string;
  duration: number; // seconds
  audioUrl?: string;
  timestamp?: number; // cutoff timestamp in seconds (for final episode)
}

export interface EpisodeMetadata {
  title: string;
  duration: number; // seconds
  showName: string;
  description?: string;
  thumbnailUrl?: string;
  audioUrl?: string;
  audioFileSize?: number; // bytes
}

export interface SummaryRequest {
  episodes: Episode[];
  targetDuration: 1 | 5 | 10; // minutes
}

export interface ProcessingProgress {
  step: string;
  percentage: number;
  message: string;
}

export interface SummaryResult {
  audioUrl: string; // Vercel Blob URL
  summaryText: string;
  actualCosts: {
    transcription: number;
    summarization: number;
    tts: number;
    total: number;
  };
}

export interface TranscriptResult {
  text: string;
  source: 'spotify' | 'rss' | 'youtube' | 'web' | 'whisper';
}
```

---

**End of Product Requirements Document**
