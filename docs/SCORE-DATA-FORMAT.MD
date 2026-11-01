# Score Data Format (Minimal JSON)

## Design Principles

- **Keep it simple** - Only include what's needed for Akatombo
- **Easy to read** - Musicians should understand it quickly
- **Easy to extend** - Can add more features later
- **Separation of concerns** - Data describes notes, renderer handles layout
- **MusicXML meanings** - See [Relation to MusicXML](#relation-to-musicxml)

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

## Relation to MusicXML

This format is not the same as MusicXML. It is a smaller format that uses MusicXML meanings (#471).

- **JSON to MusicXML and back must not change the score.** Some fields do not do this now. #472 lists them and fixes them.
- **MusicXML to JSON can lose data.** The importer removes measures, layout and signatures. It stops on chords, voices and parts (#464, #465).
- **Other programs read only the MusicXML part.** They ignore our fingering names. Kan ro and go-no-hi both sound D5, so other programs show the same note for the two.

Use MusicXML meanings, not MusicXML structure. A MusicXML file has measures and voices. This format has a list of notes.

### The rule for new fields

1. **A general feature:** use the meaning of the MusicXML element. Name that element.
2. **A shakuhachi feature:** write its MusicXML and ABC encoding.
3. **A different meaning:** give the reason in the issue for the field.

### Fields that exist now

| Field                        | MusicXML                    | Status                                                                       |
| ---------------------------- | --------------------------- | ---------------------------------------------------------------------------- |
| `pitch.step`, `pitch.octave` | Not `<pitch>`               | Different. The names are the same, but these are a fingering and a register. |
| `duration`                   | `<type>` and `<dot>`        | Same. It is the written length, not `<duration>` (#438).                     |
| `dotted`                     | `<dot/>`                    | No effect. The renderer always draws the dot (#438).                         |
| `rest`                       | `<rest/>`                   | Same.                                                                        |
| `meriKari`, `style`          | None                        | Ours. They need an encoding (#472, #473).                                    |
| `key`, `tempo`               | `<key>`, `<metronome>`      | Free text. Not used and not exported.                                        |
| `title`, `composer`          | `<work-title>`, `<creator>` | Same. An empty title comes back as "Untitled" (#472).                        |
