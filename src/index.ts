/**
 * Shakuhachi Score Renderer
 *
 * A standalone shakuhachi notation renderer inspired by VexFlow's architecture.
 * Supports traditional Kinko-ryū and Tozan notation.
 */

// Renderer exports
export { SVGRenderer } from './renderer/SVGRenderer';
export { Formatter } from './renderer/Formatter';
export type { FormatterOptions } from './renderer/Formatter';
export { VerticalSystem } from './renderer/VerticalSystem';
export type { VerticalSystemOptions } from './renderer/VerticalSystem';

// Note exports
export { ShakuNote } from './notes/ShakuNote';
export type { ShakuNoteOptions, NoteDuration, BoundingBox } from './notes/ShakuNote';

// Modifier exports
export { Modifier } from './modifiers/Modifier';
export type { ModifierPosition } from './modifiers/Modifier';
export { TestModifier } from './modifiers/TestModifier';
export { OctaveDotsModifier } from './modifiers/OctaveDotsModifier';
export { MeriKariModifier } from './modifiers/MeriKariModifier';
export type { MeriKariType } from './modifiers/MeriKariModifier';
export { AtariModifier } from './modifiers/AtariModifier';
export type { AtariStyle } from './modifiers/AtariModifier';

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

// Uncomment exports as we implement each component
