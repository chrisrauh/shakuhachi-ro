/**
 * Shakuhachi Score Renderer
 *
 * A standalone shakuhachi notation renderer inspired by VexFlow's architecture.
 * Supports traditional Kinko-ryū and Tozan notation.
 */

// Core Renderer API (Phases 1-5)
export { ScoreRenderer } from './web-component/renderer/ScoreRenderer';
export {
  renderScoreFromURL,
  renderScore,
} from './web-component/renderer/convenience';
export type { RenderOptions } from './web-component/renderer/RenderOptions';
export {
  mergeWithDefaults,
  DEFAULT_RENDER_OPTIONS,
} from './web-component/renderer/RenderOptions';

// Layout Components
export { ModifierConfigurator } from './web-component/renderer/ModifierConfigurator';
export { ColumnLayoutCalculator } from './web-component/renderer/ColumnLayoutCalculator';
export type {
  ColumnLayout,
  ColumnInfo,
  NotePosition,
} from './web-component/renderer/ColumnLayoutCalculator';

// Low-level Renderer exports
export { SVGRenderer } from './web-component/renderer/SVGRenderer';
export { Formatter } from './web-component/renderer/Formatter';
export type { FormatterOptions } from './web-component/renderer/Formatter';
export { VerticalSystem } from './web-component/renderer/VerticalSystem';
export type { VerticalSystemOptions } from './web-component/renderer/VerticalSystem';

// Parser exports
export { ScoreParser } from './web-component/parser/ScoreParser';

// Note exports
export { ShakuNote } from './web-component/notes/ShakuNote';
export type {
  ShakuNoteOptions,
  NoteDuration,
  BoundingBox,
} from './web-component/notes/ShakuNote';

// Modifier exports
export { Modifier } from './web-component/modifiers/Modifier';
export type { ModifierPosition } from './web-component/modifiers/Modifier';
export { TestModifier } from './web-component/modifiers/TestModifier';
export { OctaveMarksModifier } from './web-component/modifiers/OctaveMarksModifier';
export { MeriKariModifier } from './web-component/modifiers/MeriKariModifier';
export type { MeriKariType } from './web-component/modifiers/MeriKariModifier';
export { AtariModifier } from './web-component/modifiers/AtariModifier';
export type { AtariStyle } from './web-component/modifiers/AtariModifier';
export { DurationDotModifier } from './web-component/modifiers/DurationDotModifier';
export { DurationLineModifier } from './web-component/modifiers/DurationLineModifier';

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
  octaveDots,
} from './web-component/constants/kinko-symbols';
export type {
  KinkoSymbol,
  Octave,
  PitchAlteration,
  Technique,
  Fingering,
} from './web-component/constants/kinko-symbols';

// Score Data types
export type {
  ScoreData,
  ScoreNote,
  Pitch,
  PitchStep,
  NotationStyle,
} from './web-component/types/ScoreData';

// Uncomment exports as we implement each component
