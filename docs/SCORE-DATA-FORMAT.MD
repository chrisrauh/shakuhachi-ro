# Score Data Format (Minimal JSON)

## Design Principles

- **Keep it simple** - Only include what's needed for Akatombo
- **Easy to read** - Musicians should understand it quickly
- **Easy to extend** - Can add more features later
- **Separation of concerns** - Data describes notes, renderer handles layout
- **MusicXML-like structure** - Familiar format for music software interoperability

## Format Structure

```typescript
{
  "title": string,           // Score title
  "style": "kinko",          // Notation style (kinko or tozan)
  "notes": Note[]            // Flat array of notes in performance order
}

Note = {
  "pitch": {
    "step": string,          // Written character, e.g. "ro", "tsu", "go-no-hi" (see below)
    "octave": number         // 0=otsu (base), 1=kan, 2=daikan
  },
  "duration": number,        // Duration in relative timing units
  "meriKari"?: string        // Optional: "dai-meri" | "meri" | "chu-meri" | "chu-kari" | "kari" | "dai-kari"
}
```

## Required Fields

- `pitch.step` - The written character (required). The five basic notes `"ro"`, `"tsu"`, `"re"`, `"chi"` and `"ri"`; `"u"`, `"hi"` and `"ha"`; and the fingerings written with a small numeral: `"go-no-hi"` (ヒ五), `"go-no-ha"` (ハ五), `"san-no-u"` (ウ三), `"san-no-ha"` (ハ三), `"shi-no-ha"` (ハ四) and `"ni-shi-go-no-ha"` (ハ二四五). The list is `PITCH_STEPS` in `src/web-component/types/ScoreData.ts`.
- `pitch.octave` - Octave indicator (required, 0=otsu, 1=kan, 2=daikan)
- `duration` - Duration value (required)

## Optional Fields

- `meriKari` - The meri or kari mark the score writes beside the note: `"dai-meri"` (大メ), `"meri"` (メ), `"chu-meri"` (中), `"chu-kari"` (中カ), `"kari"` (カ) or `"dai-kari"` (大カ). It names the technique, not a pitch interval, because how far meri lowers a note varies with school, piece and player. It is only what is written: u and san no u are played meri and kari without a mark, and the fingering table (`src/web-component/constants/kinko-fingerings.ts`) records that. Pitch that moves within a note (yuri, ori, suri) is a separate technique, not a `meriKari` value.

A step, octave and mark that the fingering table doesn't list still render. Converted to MusicXML or ABC, they get an estimated Western pitch (the character's pitch, moved by the mark) and their name, so they read back exactly; other software plays the estimate.

## Column Layout

**Important**: Column breaks are NOT stored in the data format. The renderer determines column layout dynamically based on:

- Available space (screen width, paper size)
- Number of notes
- Column height preferences
- Responsive layout needs

This separation allows the same score data to be rendered differently on mobile, desktop, and print formats.

## Example

```json
{
  "title": "Akatombo",
  "style": "kinko",
  "notes": [
    { "pitch": { "step": "tsu", "octave": 1 }, "duration": 1 },
    { "pitch": { "step": "re", "octave": 1 }, "duration": 1 },
    { "pitch": { "step": "chi", "octave": 1 }, "duration": 2 },
    {
      "pitch": { "step": "ri", "octave": 0 },
      "duration": 1,
      "meriKari": "meri"
    },
    { "pitch": { "step": "ro", "octave": 0 }, "duration": 4 }
  ]
}
```

## Reading Order

- **Notes array**: Performance order (first note played first)
- **Renderer**: Creates vertical columns reading top-to-bottom, right-to-left

## Future Extensions

When needed, we can add:

- `atari` - For atari technique marks
- More pitch modifiers
- Additional metadata (composer, tempo, etc.)

---

**Note**: This format follows MusicXML structure for easier future integration. MusicXML import/export will be added as a future enhancement.
