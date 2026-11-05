# Typography

This project sets type: notes are glyphs, and every mark around them (strokes, dots, duration lines, octave and meri/kari marks, rests) is placed relative to a glyph. This file records which font metrics the renderer uses, where each value comes from, and why.

## Rule: use the font's own metrics

Where the font states a metric, use it. Do not measure pixels in a screenshot. The type designer knows the font best, and a value from the font file can be cited and checked again.

Store each value as a fraction of the em (the font size), so it scales with `noteFontSize`. Name the font and the table it came from in the code comment. #517 tracks the values that are still in fixed pixels.

## The notation fonts

| Option `notation-font` | Font          | Source                                                                   |
| ---------------------- | ------------- | ------------------------------------------------------------------------ |
| `sans` (default)       | Noto Sans JP  | Google Fonts; the same files as `@fontsource/noto-sans-jp@5.1.0` on npm  |
| `serif`                | Noto Serif JP | Google Fonts; the same files as `@fontsource/noto-serif-jp@5.1.0` on npm |

Both have 1000 units per em. Values below are in units; divide by 1000 for em. Positive is above the baseline.

## Metrics in the font files

Read from the 400 weight, `japanese` subset, with fontTools.

| Table  | Field                       | What it is                                                                   | Sans        | Serif       |
| ------ | --------------------------- | ---------------------------------------------------------------------------- | ----------- | ----------- |
| `BASE` | `icft`                      | Top of the ideographic character face: where the designer says CJK ink stops | 838         | 839         |
| `BASE` | `icfb`                      | Bottom of the ideographic character face                                     | −78         | −79         |
| `BASE` | `ideo`                      | Bottom of the ideographic em box (the box runs from −120 to 880)             | −120        | −120        |
| `BASE` | `romn`                      | Alphabetic baseline                                                          | 0           | 0           |
| `OS/2` | `sCapHeight`                | Latin capital height                                                         | 733         | 729         |
| `OS/2` | `sxHeight`                  | Latin x-height                                                               | 543         | 514         |
| `OS/2` | `sTypoAscender`/`Descender` | Typographic ascent and descent (the ideographic em box)                      | 880 / −120  | 880 / −120  |
| `hhea` | `ascent`/`descent`          | Line box that browsers use for line height                                   | 1160 / −288 | 1151 / −286 |

The ideographic character face is the box that kanji fill: 水, 大 and 中 touch its top and bottom. Its centre, (838 − 78) / 2 = 380, is also the centre of the ideographic em box.

## What the renderer uses

In `src/web-component/modifiers/mark-geometry.ts`:

| Constant                  | Value  | From                                     | Used for                                                                                   |
| ------------------------- | ------ | ---------------------------------------- | ------------------------------------------------------------------------------------------ |
| `IDEOGRAPHIC_FACE_TOP`    | 0.838  | `BASE` `icft`, Noto Sans JP              | Where a centre duration line from the previous column starts its reach above a note (#507) |
| `IDEOGRAPHIC_FACE_BOTTOM` | −0.078 | `BASE` `icfb`, Noto Sans JP              | Where a centre duration line to the next column starts its reach below a note (#507)       |
| `GLYPH_CENTRE`            | 0.38   | Centre of the ideographic character face | The middle of a note: strokes, rest circles, and the ends of centre duration lines         |

The Serif values differ by 1/1000 em (0.03px at 32px), so one set of constants serves both fonts. If a notation font is added, read its `BASE` table and check that this is still true.

## Kana sit inside the face

Kana are drawn smaller than kanji. The ink of the note kana, from the glyph outlines of Noto Sans JP:

| Kana            | ロ     | ツ     | レ     | チ     | リ     | ウ     | ヒ     |
| --------------- | ------ | ------ | ------ | ------ | ------ | ------ | ------ |
| Ink top (em)    | 0.685  | 0.752  | 0.744  | 0.768  | 0.759  | 0.801  | 0.769  |
| Ink bottom (em) | −0.007 | −0.033 | −0.018 | −0.041 | −0.041 | −0.037 | −0.002 |
| Ink middle (em) | 0.339  | 0.360  | 0.363  | 0.364  | 0.359  | 0.382  | 0.384  |

The average ink middle is 0.364em, within 0.016em (0.5px at 32px) of the face centre. The middles of single kana spread more than that, so no one value is exact for every note. We chose the face over these measurements: it is the designer's statement for the whole font, not our average of seven glyphs (#507).

## What the browser exposes

Tested in Chromium 153. Not yet tested in Firefox or Safari.

| Feature                                          | Result                                                                                                                       |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| CSS units `cap`, `ex`, `ic`                      | Work. They read `OS/2` `sCapHeight` and `sxHeight`, and the advance of 水. These are Latin metrics, not kana ink.            |
| `text-box-edge: cap \| ex \| alphabetic \| text` | Supported. Used by the design system for button text.                                                                        |
| `text-box-edge: ideographic \| ideographic-ink`  | In the CSS Inline 3 specification. Not supported.                                                                            |
| SVG `dominant-baseline: central`                 | Supported, but centres on the `hhea` line box: 0.435em above the baseline, not 0.38.                                         |
| SVG `dominant-baseline: ideographic`             | Supported, but uses the `hhea` descent (−0.288em), not `BASE` `ideo` (−0.12em).                                              |
| `font-size-adjust: ic-height`                    | Supported. It sets the size; it does not report a position.                                                                  |
| Canvas `measureText` (`actualBoundingBox*`)      | Gives the ink of a given string. Not used: it needs a canvas and a loaded font, and it measures ink, not the font's metrics. |

So the browser does not expose the `BASE` table. The renderer stores the values from the font file instead.

## Reading the values again

To check a value, or to read a new font, install fontTools (`pip install fonttools brotli`) and read the woff2 file from the fontsource package:

```python
from fontTools.ttLib import TTFont

font = TTFont('noto-sans-jp-japanese-400-normal.woff2')
axis = font['BASE'].table.HorizAxis
tags = axis.BaseTagList.BaselineTag
for record in axis.BaseScriptList.BaseScriptRecord:
    if record.BaseScriptTag == 'kana':
        coords = record.BaseScript.BaseValues.BaseCoord
        print(dict(zip(tags, (c.Coordinate for c in coords))))
# {'icfb': -78, 'icft': 838, 'ideo': -120, 'romn': 0}
```

For a glyph's ink, draw it with `fontTools.pens.boundsPen.BoundsPen` from `font.getGlyphSet()`.
