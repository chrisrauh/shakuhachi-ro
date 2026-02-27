# Web Platform Architecture

**Scope:** This document covers the web platform (shakuhachi.ro). For renderer library architecture, see [ARCHITECTURE-RENDERER.MD](./ARCHITECTURE-RENDERER.MD).

## Overview

Shakuhachi.ro is a web platform for sharing shakuhachi scores. Musicians can browse, create, edit, and share scores via links.

**Stack:**
- Astro (SSR mode) with Netlify adapter
- Supabase (authentication, database, storage)
- Embedded renderer library (see architecture-renderer.md)
- Vanilla TypeScript for client-side interactivity

**How it works:**
- Server fetches score data from Supabase
- Server embeds score JSON in HTML
- Client hydrates with renderer library
- Interactive features in vanilla TypeScript components

## Key Pages

### Browse Page (`/`)

**Purpose:** Discover scores in the library

**Rendering:** SSR with client hydration
- Server fetches all scores from Supabase
- Server embeds score data as JSON in HTML
- Client hydrates ScoreLibraryClient component
- Search/filter work client-side on embedded data

**Characteristics:**
- Content appears immediately (no loading spinner)
- Score titles in HTML for SEO
- Works without JavaScript (progressive enhancement)

### Score Detail Page (`/score/[slug]`)

**Purpose:** View and interact with a single score

**Rendering:** SSR with embedded renderer
- Server fetches score by slug from Supabase
- Server embeds score data as JSON
- Client initializes renderer with embedded data
- Client handles fork/share actions

**Components:**
- `ScoreRenderer` (from renderer library) - Renders notation
- `ScoreDetailClient.ts` - Handles interactivity (fork, share)

**Fork flow:**
- User clicks "Fork" on existing score
- Creates new score with temporary slug (e.g., flying-circus-catnip)
- Redirects to `/score/[slug]/edit` with forked content

### Score Edit Page (`/score/[slug]/edit`)

**Purpose:** Edit score content and metadata

**Rendering:** Client-side with live preview
- Load existing score data (or empty for new score)
- Live notation preview using renderer library
- Notation input supports three formats: ABC, JSON, MusicXML
- Automatic format conversion when switching formats (preserves content)
- Title changes update the slug
- Save to Supabase on submit

**Components:**
- `ScoreEditor.ts` - Form handling and notation input
- `ScoreRenderer` (preview mode) - Live rendering

## Data Flow

### Score Creation (New)
```
User clicks "Create New Score"
  ↓
Generate temporary slug (flying-circus-catnip)
  ↓
Create empty score in Supabase
  ↓
Redirect to /score/[slug]/edit
  ↓
User enters title, notation (ABC/JSON/MusicXML)
  ↓
Live preview renders notation
  ↓
Title change updates slug
  ↓
Save updates score in Supabase
```

### Score Creation (Fork)
```
User clicks "Fork" on existing score
  ↓
Generate temporary slug
  ↓
Copy score data to new score
  ↓
Redirect to /score/[slug]/edit
  ↓
User edits title, notation
  ↓
Save as new independent score
```

### Score Viewing
```
Request /score/akatombo
  ↓
Server: getScoreBySlug('akatombo')
  ↓
Server: Embed JSON in HTML
  ↓
Client: Parse JSON
  ↓
Client: Initialize renderer
  ↓
User sees score
```

### Score Sharing
```
User clicks "Share"
  ↓
Copy link to clipboard
  ↓
Recipient opens link on mobile
  ↓
SSR delivers score immediately
```

## Notation Formats

The platform supports three notation formats with full bidirectional conversion:

### Supported Formats

**ABC Notation** (`data_format: 'abc'`)
- Text-based music notation format
- Popular in folk and traditional music communities
- Human-readable and easy to edit
- Supports: pitches, durations, accidentals, rests, dotted notes
- Automatic mapping to shakuhachi fingerings (D shakuhachi, 1.8 shaku)

**JSON** (`data_format: 'json'`)
- Native ScoreData format
- Direct representation of score structure
- Used internally by renderer
- Compact and type-safe

**MusicXML** (`data_format: 'musicxml'`)
- Industry-standard Western notation format
- Interoperability with notation software (Finale, Sibelius, MuseScore)
- Supports import/export

### Format Conversion

**Architecture:** Decoupled utility in `src/utils/format-converter.ts`

**Conversion Matrix:**
```
        ABC    JSON   MusicXML
ABC      -      ✓        ✓
JSON     ✓      -        ✓
MusicXML ✓      ✓        -
```

**Implementation:**
- All conversions use ScoreData as intermediate format
- Parsers: ABCParser, MusicXMLParser, JSON.parse
- Serializers: ABCSerializer, MusicXMLSerializer, JSON.stringify
- Automatic conversion when switching formats in editor

**Parser/Serializer Locations:**
- `src/web-component/parser/ABCParser.ts` - ABC → ScoreData
- `src/web-component/parser/ABCSerializer.ts` - ScoreData → ABC
- `src/web-component/parser/MusicXMLParser.ts` - MusicXML → ScoreData
- `src/web-component/parser/MusicXMLSerializer.ts` - ScoreData → MusicXML
- `src/utils/format-converter.ts` - Orchestrates all conversions

**ABC Pitch Mapping:**
- `src/web-component/constants/abc-pitch-map.ts` - Maps ABC notation to shakuhachi fingerings
- Default key: D major (D shakuhachi)
- Automatic meri handling: ABC accidentals (^, _, =) → shakuhachi meri variants
- Octave support: uppercase (otsu), lowercase (kan), apostrophe (dai-kan)

### Format Selection in Editor

**UX Pattern:** Radio buttons with automatic conversion

**Behavior:**
1. User selects different format (e.g., ABC → JSON)
2. Editor attempts automatic conversion using format-converter
3. On success: Content converted, format switched
4. On failure: Prompt user to clear content or cancel switch

**Why automatic conversion:**
- Preserves user's work when exploring formats
- Enables seamless format switching workflow
- Reduces friction for users unfamiliar with specific formats

## Authentication

**Provider:** Supabase Auth

**Features:**
- Email/password signup
- Session management
- Auth state persistence

**Integration:**
- `src/api/auth.ts` - Auth API wrapper
- `src/api/authState.ts` - Client-side state management
- `src/components/AuthComponents.ts` - Login/signup UI

## Database Schema

**Supabase tables:**
- `scores` - Score data (title, slug, composer, notation, user_id, forked_from)
- `users` - User profiles

## Client Components

**Architecture:** Vanilla TypeScript classes

**Pattern:**
```typescript
class Component {
  constructor(containerId: string) {
    this.container = document.getElementById(containerId);
    this.render();
  }

  private render(): void {
    this.container.innerHTML = `...`;
    this.attachEventListeners();
  }
}
```

**Key components:**
- `ThemeSwitcher.ts` - Light/dark mode toggle
- `AuthWidget.ts` - Login/signup UI
- `ScoreLibrary.ts` - Browse page grid
- `ScoreDetailClient.ts` - Score page interactions (fork, share)
- `ScoreEditor.ts` - Edit page notation input and preview

## Renderer Integration

**How platform uses renderer:**

```typescript
// In score detail page
import { ScoreRenderer } from '../renderer/ScoreRenderer';

// Parse embedded JSON
const scoreData = JSON.parse(
  document.getElementById('score-data').textContent
);

// Initialize renderer
const renderer = new ScoreRenderer(container, {
  showOctaveMarks: true,
  notesPerColumn: 10
});

await renderer.renderFromScoreData(scoreData);
```

**Why this pattern:**
- Renderer is framework-agnostic
- Same renderer used in platform and by external developers
- Platform validates renderer API through real usage
- Bugs found in platform → fixed in renderer → benefits all users

## Deployment

**Platform:** Netlify
- SSR via Netlify Functions
- Automatic deploys from main branch
- Preview deploys for PRs

**Adapter:** `@astrojs/netlify`
- Handles SSR
- Edge functions for API routes
- Session storage via Netlify Blobs

## Development Workflow

**Local development:**
```bash
npm run dev  # Starts Astro dev server on port 3001
```

**Environment variables:**
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Public anon key
- `SUPABASE_SERVICE_KEY` - Server-side key (secrets)

## Testing

**Unit tests:** Vitest for TypeScript logic
**Visual tests:** Playwright for UI regression
**Manual tests:** Chrome DevTools MCP for visual verification

## Future Enhancements

- Mobile responsive renderer (current priority)
- Page turn navigation for long scores
- Collections/playlists
- Comments on scores
- Advanced search filters
