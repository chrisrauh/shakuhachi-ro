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
    "step": string,          // Fingering: "ro" | "tsu" | "re" | "chi" | "ri" | "u" | "hi"
    "octave": number         // 0=otsu (base), 1=kan, 2=daikan
  },
  "duration": number,        // Duration in relative timing units
  "meri"?: boolean           // Optional: true if meri mark present
}
```

## Required Fields

- `pitch.step` - The fingering/pitch step (required)
- `pitch.octave` - Octave indicator (required, 0=otsu, 1=kan, 2=daikan)
- `duration` - Duration value (required)

## Optional Fields

- `meri` - Meri pitch alteration (optional, defaults to false)

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
    { "pitch": { "step": "ri", "octave": 0 }, "duration": 1, "meri": true },
    { "pitch": { "step": "ro", "octave": 0 }, "duration": 4 }
  ]
}
```

## Reading Order

- **Notes array**: Performance order (first note played first)
- **Renderer**: Creates vertical columns reading top-to-bottom, right-to-left

## Future Extensions

When needed, we can add:
- `kari` - For kari pitch marks
- `atari` - For atari technique marks
- More pitch modifiers
- Additional metadata (composer, tempo, etc.)

---

**Note**: This format follows MusicXML structure for easier future integration. MusicXML import/export will be added as a future enhancement.
