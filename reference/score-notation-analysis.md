# Shakuhachi Score Notation Analysis

Analysis of: `scores-pictures/akatombo-kinko-score.png`

## Overview

This document analyzes the traditional Kinko-ryū shakuhachi score "Akatombo" to identify all notation elements that must be supported in our score data format.

## Layout Structure

### Reading Direction
- **Vertical orientation**: Notes read top to bottom within each column
- **Right-to-left progression**: Columns progress from right to left across the page
- **Column count**: 4 columns in this example

### Visual Elements
- Vertical separator lines between columns
- Consistent horizontal spacing between columns
- Variable column heights based on musical content
- Page margins around the entire score

## Notation Elements Identified

### 1. Note Symbols (Kana)

The score uses Kinko-ryū katakana symbols to represent fingerings:

- **ロ** (ro) - All holes closed (fundamental)
- **ツ** (tsu) - Release ring finger
- **レ** (re) - Release ring and middle fingers
- **チ** (chi) - Release middle finger only
- **リ** (ri) - Release ring, middle, and index fingers

### 2. Octave Indicators (Dots)

Small circular dots positioned above or below note symbols:

- **No dots** - Otsu (乙) octave - base range
- **1 dot above** - Kan (甲) octave - first overtone
- **2 dots above** - Daikan (大甲) octave - second overtone
- **1 dot below** - Lower than otsu (less common)

**Position**: Centered above/below the note symbol
**Size**: Small, approximately 1/8 the size of the note symbol

### 3. Pitch Modifiers (Meri/Kari)

Small marks positioned to the side of note symbols indicating pitch alterations:

- **Small diagonal line** - Meri (メリ) - slightly lowered pitch
- **Small circle or mark** - Dai-meri (大メリ) - significantly lowered pitch
- **Upward mark** - Kari (カリ) - slightly raised pitch

**Position**: To the left of the note symbol (before rotation)
**Size**: Small accent marks

### 4. Duration Indicators

Visual markers indicating note length:

- **No marker** - Standard duration
- **Small dot** - Extended duration
- **Horizontal dash/line** - Longer hold
- **Multiple marks** - Progressively longer durations

**Position**: To the right of the note symbol (after rotation)

### 5. Technique Marks

- **Atari (アタリ)** - Percussive attack mark
  - Small mark above or beside note
  - Indicates sharp articulation

### 6. Phrase Marks

- **Curved lines** - Visible at top of some columns
  - Indicate breathing points or phrase boundaries
  - Connect groups of notes

### 7. Spacing and Timing

- **Vertical spacing** varies based on note duration
- Longer notes have more vertical space
- Rests or pauses represented by vertical gaps

## Column Structure

### Column Properties Observed

Each column contains:
- Variable number of notes (appears to range from 5-12 notes per column)
- Mix of different note types and modifiers
- Natural phrase groupings

### Column Breaks

Column breaks appear to occur at:
- Musical phrase boundaries
- Natural breathing points
- To maintain readable column height

## Data Format Requirements

Based on this analysis, the score data format must support:

1. **Note definition**
   - Symbol/fingering (ro, tsu, re, chi, ri, etc.)
   - Duration value

2. **Modifier system**
   - Octave indicators (count and position: above/below)
   - Pitch modifiers (meri, dai-meri, kari)
   - Technique marks (atari, yuri, etc.)
   - Multiple modifiers per note

3. **Layout control**
   - Column breaks (explicit or automatic)
   - Phrase grouping
   - Spacing hints

4. **Metadata**
   - Title
   - Composer/arranger
   - Style (Kinko-ryū, Tozan-ryū)
   - Tempo/mood indications

## Example Note Representation

A note might need to encode:
```
Note: tsu (ツ)
Duration: quarter
Octave: kan (+1 dot above)
Pitch: meri (slightly flat)
Technique: atari (percussive)
```

## Next Steps

With this analysis complete, the next task is to design the score data format that can efficiently represent all these elements while remaining human-readable and easy to work with.

Considerations:
- JSON: Good structure, widely supported, easy to parse
- Custom DSL: More concise, music-specific syntax
- Extended Markdown: Human-readable, familiar format

---

**Analysis Date**: 2026-01-25
**Analyzed By**: Claude Code
**Source**: scores-pictures/akatombo-kinko-score.png
