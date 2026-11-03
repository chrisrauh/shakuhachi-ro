# Score Data Format (Minimal JSON)

## Design Principles

- **Keep it simple** - Only include what's needed for Akatombo
- **Easy to read** - Musicians should understand it quickly
- **Easy to extend** - Can add more features later
- **Separation of concerns** - Data describes notes, renderer handles layout
- **What is written, not what sounds** - A note records the score: its character, register and mark. The fingering table gives the sound. A score gives one sound, but one sound can be written in more than one way, so the score is what we keep
- **MusicXML meanings** - See [Relation to MusicXML](#relation-to-musicxml)

## Format Structure

```typescript
{
  "title": string,           // Score title
  "style": "kinko",          // Notation style (kinko or tozan)
  "notes": Note[]            // Flat array of notes in performance order
}

Note = {
  "character": string,            // The main notation character, e.g. "ro", "tsu", "go-no-hi" (see below)
  "register": number,        // 0=otsu (base), 1=kan, 2=daikan
  "accidental"?: string,     // Optional: "dai-meri" | "meri" | "chu-meri" | "chu-kari" | "kari" | "dai-kari"
  "duration": string         // Length in beats, e.g. "1", "1/2", "3/2"
}

Rest = { "rest": true, "duration": string }
```

## Required Fields

- `character` - The main notation character of the note (譜字 _fuji_; 音符 in everyday Japanese use), by name (required). It names the character, not the glyph: `style` picks how it is drawn. The five basic notes `"ro"`, `"tsu"`, `"re"`, `"chi"` and `"ri"`; `"u"`, `"hi"` and `"ha"`; and the fingerings written with a small numeral: `"go-no-hi"` (ヒ五), `"go-no-ha"` (ハ五), `"san-no-u"` (ウ三), `"san-no-ha"` (ハ三), `"shi-no-ha"` (ハ四) and `"ni-shi-go-no-ha"` (ハ二四五). The list is `CHARACTERS` in `src/web-component/types/ScoreData.ts`.
- `register` - The register (required, 0=otsu, 1=kan, 2=daikan)
- `duration` - Duration value (required)

## Optional Fields

- `accidental` - The meri or kari mark the score writes beside the note. The same meaning as MusicXML `<accidental>`: the written mark, not the change in sound. The values are shakuhachi marks, not Western sharps and flats, and meri also changes the tone colour. The values are `"dai-meri"` (大メ), `"meri"` (メ), `"chu-meri"` (中), `"chu-kari"` (中カ), `"kari"` (カ) or `"dai-kari"` (大カ). It names the technique, not a pitch interval, because how far meri lowers a note varies with school, piece and player. It is only what is written: u and san no u are played meri and kari without a mark, and the fingering table (`src/web-component/constants/kinko-fingerings.ts`) records that. Pitch that moves within a note (yuri, ori, suri) is a separate technique, not an accidental.

A character, register and accidental that the fingering table doesn't list still render. Converted to MusicXML or ABC, they get an estimated Western pitch (the character's pitch, moved by the mark) and their name, so they read back exactly; other software plays the estimate.

## Terms

The field names come from the notation, not from the sound. These terms come from research for #492. Each row gives a source.

| Term                               | Meaning                                                                                                                                                                                                                | Field        |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| 譜字 _fuji_                        | The characters of a score in Japanese traditional music (hogaku). Seki and Ohmukai translate it as "notation character" [1]. Gagaku and wagon sources use it [2]. We found no shakuhachi-specific source that uses it. | `character`  |
| 音符 _onpu_                        | The general Japanese word for a note symbol, Western notes included. Some shakuhachi sources also use it for these characters [3][4].                                                                                  | `character`  |
| ロツレチ譜                         | Shakuhachi notation written with katakana characters [4].                                                                                                                                                              | —            |
| 乙 _otsu_, 甲 _kan_, 大甲 _daikan_ | The registers. Teachers say "register", and at least one tells it apart from "octave" [5]. In MusicXML and MEI, "octave" is a pitch octave.                                                                            | `register`   |
| メ, 中, カ…                        | The meri and kari marks beside a character. MusicXML `<accidental>` is the notated sign, and `<alter>` is the change in sound [6]. MEI has the same split: `@accid` is written, `@accid.ges` is performed [7].         | `accidental` |

1. Seki and Ohmukai, IPSJ-CH 2023: https://repository.dl.itc.u-tokyo.ac.jp/record/2007541/files/IPSJ-CH23132009.pdf
2. 篳篥譜字の次第: https://www.osaka-geidai.ac.jp/assets/files/id/886 ; 和琴譜: https://da.lib.kobe-u.ac.jp/da/kernel/81001273/81001273.pdf
3. https://kujira.office-isana.jp/blog/20190124/
4. https://jonkara.com/wagaku_manual/instrument/shakuhachi/
5. https://josenshakuhachi.com/shakuhachi-guides/shakuhachi-terms
6. MusicXML 4.0 schema: https://raw.githubusercontent.com/w3c/musicxml/v4.0/schema/musicxml.xsd
7. MEI: https://music-encoding.org/guidelines/dev/mei-cmn/attribute-classes/att.pitch.ges.html

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
    { "character": "tsu", "register": 1, "duration": 1 },
    { "character": "re", "register": 1, "duration": 1 },
    { "character": "chi", "register": 1, "duration": 2 },
    {
      "character": "ri",
      "register": 0,
      "duration": 1,
      "accidental": "meri"
    },
    { "character": "ro", "register": 0, "duration": 4 }
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

The fields use MusicXML meanings, not MusicXML structure. A MusicXML file has measures and voices. This format has a list of notes (#471).

### Goal

This format is isomorphic with canonical MusicXML for the domain below.

The goal is a guide for decisions. We do not work toward it now. Build what we need now, and do not make a choice that blocks the goal.

- **Canonical MusicXML** is one fixed way to write the music: one `divisions` value, measures from the time signature, voice 1, no layout. MusicXML can write the same music in many ways. This form makes two files with the same music equal.
- **The same music** is which notes, at what pitch, for how long, in what order, and with which techniques.
- **Today the goal is not met.** Many features are not in this format yet (#465).

### Domain

- Shakuhachi music in one or more parts (#493).
- Each part is monophonic: its notes do not overlap.
- Parts align in bars.
- A part can use a different flute length (later, #493).
- Not in the domain: other instruments, chords, multiphonics, and parts that do not align in bars.

### Other programs

Other programs read only the MusicXML part. They ignore our fingering names. Kan ro and go-no-hi both sound D5, so other programs show the same note for the two.

The pitch for each fingering comes from the fingering table (`constants/kinko-fingerings.ts`). The table assumes a 1.8 flute: ro is D4. For other flute lengths, see #493.

### The rule for new fields

1. **A general feature:** use the meaning of the MusicXML element. Name that element.
2. **A shakuhachi feature:** write its MusicXML and ABC encoding.
3. **A different meaning:** give the reason in the issue for the field.

### Fields that exist now

| Field                   | MusicXML                    | Status                                                                                                                                        |
| ----------------------- | --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `character`, `register` | Not `<pitch>`               | Different. These are the written character and its register, not a sounding pitch (#492).                                                     |
| `duration`              | `<type>` and `<dot>`        | Same. It is the written length, not `<duration>` (#438). A length with a half has a dot (#492).                                               |
| `rest`                  | `<rest/>`                   | Same.                                                                                                                                         |
| `accidental`            | `<accidental>`              | Same meaning: the written mark. MusicXML has no meri or kari value, and SMuFL has no glyph for one, so export needs an encoding (#472, #473). |
| `style`                 | None                        | Ours. It needs an encoding (#472).                                                                                                            |
| `key`, `tempo`          | `<key>`, `<metronome>`      | Free text. Not used and not exported.                                                                                                         |
| `title`, `composer`     | `<work-title>`, `<creator>` | Same. An empty title comes back as "Untitled" (#472).                                                                                         |
