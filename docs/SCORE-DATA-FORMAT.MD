# Score Data Format (Minimal JSON)

## Design Principles

- **Keep it simple** - Only include what's needed for Akatombo
- **Easy to read** - Musicians should understand it quickly
- **Easy to extend** - Can add more features later
- **Separation of concerns** - Data describes notes, renderer handles layout
- **MusicXML meanings** - A field that MusicXML also has uses the MusicXML meaning. See [Relation to MusicXML](#relation-to-musicxml)

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

This format is not isomorphic to MusicXML. It embeds in MusicXML (#471):

- **JSON → MusicXML → JSON is exact.** Each value has one MusicXML encoding, and it reads back unchanged. This makes the MusicXML source view lose nothing (#459).
- **MusicXML → JSON loses information by design.** Many MusicXML documents become the same score, because the importer drops measures, divisions, layout and signatures. Some documents have no score. The importer fails on chords, voices and parts (#464, #465).
- **Other programs read only the shared part.** Our extensions use MusicXML elements that other programs ignore, such as `<technical><fingering>`. Kan ro and go-no-hi both sound D5, so those programs cannot tell them apart.

A field uses the MusicXML meaning, not the MusicXML document structure. Measures, voices, `<backup>` and `<forward>` organize a MusicXML file. This format is a list of notes.

### The rule for new fields

1. **For a general feature,** name the MusicXML concept that the field follows, and use the meaning of that concept. One concept can use more than one element. For example, a tuplet uses `<time-modification>` and `<tuplet>`.
2. **For a shakuhachi feature,** state its MusicXML and ABC encoding, so that JSON → MusicXML → JSON stays exact.
3. **To differ from MusicXML,** give the reason in the issue that adds the field.

### Fields that exist now

| Field                        | MusicXML concept                            | Status                                                                                                                                  |
| ---------------------------- | ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `pitch.step`, `pitch.octave` | None. They are a fingering and a register.  | Differs from `<pitch>`, because the fingering identifies the note. The names are the same as in MusicXML, but the meaning is different. |
| `duration`                   | `<type>` and `<dot>`: the written length    | Follows MusicXML (#438). It is not `<duration>`, which is the sounding length.                                                          |
| `dotted`                     | `<dot/>`                                    | Has no effect on the render. The renderer draws the dot when the field is not set (#438).                                               |
| `rest`                       | `<rest/>`                                   | Follows MusicXML.                                                                                                                       |
| `meriKari`, `style`          | None. They are ours.                        | Need an encoding (#472, #473).                                                                                                          |
| `key`, `tempo`               | `<key>`, `<metronome>`                      | Free text. Nothing uses them, and the serializer does not write them. They get a structure when a feature uses them.                    |
| `title`, `composer`          | `<work-title>`, `<creator type="composer">` | Follow MusicXML. A missing title reads back as "Untitled", so the round trip is not exact (#472).                                       |
