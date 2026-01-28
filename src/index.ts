/**
 * Shakuhachi Score Renderer
 *
 * A standalone shakuhachi notation renderer inspired by VexFlow's architecture.
 * Supports traditional Kinko-ryū and Tozan notation.
 */

// Core Renderer API (Phases 1-5)
export { ScoreRenderer } from './renderer/ScoreRenderer';
export { renderScoreFromURL, renderScore } from './renderer/convenience';
export type { RenderOptions } from './renderer/RenderOptions';
export { mergeWithDefaults, DEFAULT_RENDER_OPTIONS } from './renderer/RenderOptions';

// Layout Components
export { ModifierConfigurator } from './renderer/ModifierConfigurator';
export { ColumnLayoutCalculator } from './renderer/ColumnLayoutCalculator';
export type { ColumnLayout, ColumnInfo, NotePosition } from './renderer/ColumnLayoutCalculator';

// Low-level Renderer exports
export { SVGRenderer } from './renderer/SVGRenderer';
export { Formatter } from './renderer/Formatter';
export type { FormatterOptions } from './renderer/Formatter';
export { VerticalSystem } from './renderer/VerticalSystem';
export type { VerticalSystemOptions } from './renderer/VerticalSystem';

// Parser exports
export { ScoreParser } from './parser/ScoreParser';

// Note exports
export { ShakuNote } from './notes/ShakuNote';
export type { ShakuNoteOptions, NoteDuration, BoundingBox } from './notes/ShakuNote';

// Modifier exports
export { Modifier } from './modifiers/Modifier';
export type { ModifierPosition } from './modifiers/Modifier';
export { TestModifier } from './modifiers/TestModifier';
export { OctaveMarksModifier } from './modifiers/OctaveMarksModifier';
export { MeriKariModifier } from './modifiers/MeriKariModifier';
export type { MeriKariType } from './modifiers/MeriKariModifier';
export { AtariModifier } from './modifiers/AtariModifier';
export type { AtariStyle } from './modifiers/AtariModifier';
export { DurationDotModifier } from './modifiers/DurationDotModifier';

// Data exports
export {
  kinkoMap,
  getKinkoSymbols,
  getSymbolByKana,
  getSymbolByRomaji,
  getSymbolByPitch,
  parseNote,
  octaveModifiers,
  alterationSemitones,
  meriKariSymbols,
  techniqueSymbols,
  octaveDots
} from './data/mappings';
export type {
  KinkoSymbol,
  Octave,
  PitchAlteration,
  Technique,
  Fingering
} from './data/mappings';

// Score Data types
export type { ScoreData, ScoreNote, Pitch, PitchStep, NotationStyle } from './types/ScoreData';

// Uncomment exports as we implement each component
