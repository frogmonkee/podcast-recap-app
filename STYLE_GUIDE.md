# Spotify Replay — Style Guide

## Brand Identity

**App Name:** Spotify Replay
**Tagline:** "Pick up where you left off"
**Logo:** `public/logo.png` (48x48 rounded square, used as favicon and header mark)

---

## Color Palette

### Core Colors

| Name | Hex | Usage |
|------|-----|-------|
| **Spotify Green** | `#1DB954` | Primary accent, CTA buttons, active states, progress bars, brand highlights |
| **Green Hover** | `#1ed760` | Hover state for primary green buttons |
| **Background** | `#121212` | Page background, input field backgrounds |
| **Surface** | `#181818` | Card backgrounds, content sections |
| **Header** | `#000000` | Top header bar |
| **Border** | `#282828` | Card borders, dividers, input borders |
| **Border Hover** | `#3e3e3e` | Input border hover state |

### Text Colors

| Name | Hex | Usage |
|------|-----|-------|
| **Primary Text** | `#FFFFFF` | Headings, titles, primary content |
| **Secondary Text** | `#b3b3b3` | Subtitles, descriptions, labels, helper text |
| **Muted Text** | `#6a6a6a` | Placeholders, inactive states |
| **Error** | `#e22134` | Error messages, destructive actions |

### UI Element Colors

| Name | Hex | Usage |
|------|-----|-------|
| **Track Background** | `#4d4d4d` | Slider/progress bar unfilled portions |
| **Slider Fill** | `#b3b3b3` | Spoiler slider filled portion |
| **Progress Fill** | `#1DB954` | Audio progress bar, generation progress |
| **Thumb** | `#FFFFFF` | Slider thumb controls |

---

## Typography

### Font Family

**Primary:** Montserrat (Google Fonts)
**Weights:** 400 (Regular), 500 (Medium), 600 (Semibold), 700 (Bold)
**Fallbacks:** -apple-system, BlinkMacSystemFont, Segoe UI, Helvetica Neue, Arial, sans-serif

### Scale

| Element | Size | Weight | Line Height |
|---------|------|--------|-------------|
| `h1` | `text-2xl` (1.5rem) | 500 (Medium) | 1.5 |
| `h2` | `text-xl` (1.25rem) | 500 (Medium) | 1.5 |
| `h3` | `text-lg` (1.125rem) | 500 (Medium) | 1.5 |
| `h4` | `text-base` (1rem) | 500 (Medium) | 1.5 |
| Body | `text-base` (1rem) | 400 (Normal) | 1.5 |
| Small | `text-sm` (0.875rem) | — | — |
| Caption | `text-xs` (0.75rem) | — | — |

### Usage Examples

- **Page header:** `text-3xl font-bold` (Spotify Replay)
- **Section header:** `text-xl font-semibold` (Summarize Any Spotify Podcast)
- **Episode title:** `text-base font-bold sm:text-xl` (responsive)
- **Metadata label:** `text-sm text-[#b3b3b3]`
- **Placeholder text:** `placeholder-[#6a6a6a]`

---

## Spacing & Layout

### Container

- **Max width:** `max-w-6xl` (1152px)
- **Horizontal padding:** `px-6`
- **Content vertical padding:** `py-8`

### Section Spacing

- **Between sections:** `space-y-6` (1.5rem)
- **Inside cards:** `p-6` (1.5rem)
- **Between form elements:** `mt-6` (1.5rem)

### Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `rounded-full` | 50% | Buttons (play, remove), slider thumbs, toggle switches |
| `rounded-lg` | `var(--radius)` = 0.625rem | Cards, images, content sections |
| `rounded-md` | `calc(var(--radius) - 2px)` | Inputs, duration selectors, smaller elements |

---

## Components

### Primary CTA (Play Button)

```
size-20 rounded-full bg-[#1DB954] text-black
shadow-[0_8px_24px_rgba(29,185,84,0.4)]
hover:scale-105 hover:bg-[#1ed760]
hover:shadow-[0_12px_32px_rgba(29,185,84,0.5)]
disabled:opacity-50 disabled:shadow-none disabled:hover:scale-100
```

- Centered, large green circle with play icon
- Glow shadow effect in Spotify green
- Scale-up on hover, shadow intensifies
- 50% opacity when disabled, no shadow, no scale

### Text Input

```
rounded-md border border-[#282828] bg-[#121212]
py-3 pl-12 pr-4
text-white placeholder-[#6a6a6a]
hover:border-[#3e3e3e]
focus:border-[#1DB954] focus:outline-none
disabled:opacity-50
```

- Dark background matching page
- Left icon padding (pl-12) for link icon
- Green border on focus
- Subtle border brightening on hover

### Card / Content Section

```
rounded-lg bg-[#181818] p-6
```

- Slightly lighter than page background
- Consistent padding
- Used for: input section, player, progress display

### Duration Selector Buttons

```
rounded-md px-4 py-3 text-sm font-semibold
Active:   bg-[#1DB954] text-black
Inactive: bg-[#282828] text-white hover:bg-[#3e3e3e]
disabled:opacity-50
```

- 3-column grid layout (`grid grid-cols-3 gap-3`)
- Options: Short (1 min), Medium (5 min), Long (10 min)

### Episode Card

```
rounded-lg bg-[#121212] p-3 sm:p-4
```

- Thumbnail: `size-16 sm:size-20 rounded object-cover`
- Title: `text-base font-bold text-white sm:text-xl`
- Show name: `text-sm text-[#b3b3b3] sm:text-base`
- Description: `text-xs text-[#b3b3b3] line-clamp-2`
- Remove button: Green circle with trash icon, `hover:scale-105`

### Toggle Switch (Spoiler Protection)

```
h-6 w-11 rounded-full
On:  bg-[#1DB954]
Off: bg-[#4d4d4d]
Thumb: size-4 bg-white rounded-full
```

### Error Display

```
rounded-md bg-[#e22134]/10 border border-[#e22134] px-4 py-3
text-sm text-[#e22134]
```

- Red tinted background at 10% opacity
- Solid red border and text

---

## Audio Player

### Album Art

```
aspect-square w-96 rounded-lg bg-[#282828] shadow-2xl overflow-hidden
```

- Centered, max-width container
- Fallback: Green SVG play icon on dark background

### Playback Controls (left to right)

1. **Speed toggle** — `text-[#1DB954]` cycles through 1x, 1.25x, 1.5x, 2x
2. **Skip back 15s** — `text-[#b3b3b3] hover:text-white`
3. **Play/Pause** — `size-16 bg-white text-black rounded-full hover:scale-105`
4. **Skip forward 15s** — `text-[#b3b3b3] hover:text-white`
5. **Volume** — Click-toggle popup with vertical slider

### Progress Bar

```
h-1.5 rounded-full bg-[#4d4d4d]
Fill: linear-gradient #1DB954
Thumb: size-4 rounded-full bg-white
```

### Time Display

```
text-sm text-[#b3b3b3]
Left: current time (M:SS)
Right: -remaining time (-M:SS)
```

### Back Button

```
text-[#b3b3b3] hover:text-white
ArrowLeft icon + "Summarize another podcast"
```

---

## Generation Progress

### Layout

- Card: `rounded-lg bg-[#181818] p-6`
- Header: Spinning `Loader2` icon in green + "Recording Your Summary Episode"
- Steps listed vertically with numbered circles

### Step States

| State | Circle Style | Text Style |
|-------|-------------|------------|
| **Active** | `border-[#1DB954] bg-[#1DB954]/10 text-[#1DB954]` | `text-white font-medium` |
| **Completed** | `border-[#1DB954] bg-[#1DB954] text-black` (with checkmark) | `text-[#1DB954]` |
| **Pending** | `border-[#282828] text-[#6a6a6a]` | `text-[#6a6a6a]` |

### Steps

1. Listening (transcription)
2. Summarizing (summarization)
3. Recording (TTS)

### Progress Bar

```
h-1 rounded-full bg-[#282828]
Fill: bg-[#1DB954] transition-all duration-500
```

---

## Shadows

| Name | Value | Usage |
|------|-------|-------|
| **CTA Glow** | `0 8px 24px rgba(29,185,84,0.4)` | Play button resting |
| **CTA Glow Hover** | `0 12px 32px rgba(29,185,84,0.5)` | Play button hover |
| **Album Art** | `shadow-2xl` (Tailwind) | Player artwork |
| **Volume Popup** | `shadow-xl` (Tailwind) | Volume slider popup |

---

## Animations & Transitions

- **Hover scale:** `transition-all hover:scale-105` (buttons)
- **Color transitions:** `transition-colors` (links, inputs, icons)
- **Progress bar fill:** `transition-all duration-500`
- **Spoiler slider reveal:** `animate-in fade-in slide-in-from-top-2 duration-200`
- **Spinner:** `animate-spin` (Loader2 icon during generation)

---

## Responsive Breakpoints

The app uses Tailwind's default breakpoints with mobile-first design:

- **Default (mobile):** Single column, smaller thumbnails (`size-16`), tighter padding (`p-3`)
- **`sm` (640px+):** Larger thumbnails (`sm:size-20`), larger text (`sm:text-xl`), more padding (`sm:p-4`)

---

## Icons

**Library:** Lucide React

| Icon | Usage |
|------|-------|
| `Play` | Play button, generate CTA |
| `Pause` | Pause button |
| `ArrowLeft` | Back/reset navigation |
| `Volume2` | Volume control |
| `Link` | URL input prefix |
| `Plus` | Add episode button |
| `X` | Remove input row |
| `Trash2` | Remove episode card |
| `Loader2` | Loading spinner (with `animate-spin`) |

Custom SVGs are used for skip forward/backward 15s icons.

---

## Dark Mode

The app runs in permanent dark mode (`<html className="dark">`). The shadcn/ui design tokens in `globals.css` define both light and dark variables, but only dark mode is active. All custom component colors use hardcoded dark-theme hex values for consistency.

---

## File Structure

```
components/
  ui/              # shadcn/ui primitives (button, card, input, etc.)
    utils.ts       # cn() utility (clsx + tailwind-merge)
  AudioPlayer.tsx  # Rich audio player with all controls
  DurationSelector.tsx  # Short/Medium/Long selector
  EpisodeCard.tsx  # Episode metadata display card
  GenerationProgress.tsx  # 3-step progress tracker
  ImageWithFallback.tsx   # Image with error fallback
  MultiEpisodeInput.tsx   # Multi-URL input with metadata fetching
  SpoilerSlider.tsx       # Timestamp cutoff with toggle
```
