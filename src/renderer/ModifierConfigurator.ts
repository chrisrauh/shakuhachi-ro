/**
 * ModifierConfigurator - Configures note modifiers based on render options
 *
 * Separates modifier configuration logic from rendering, following
 * Single Responsibility Principle. Extracts configuration logic from
 * index.html to make it reusable and testable.
 */

import type { ShakuNote } from '../notes/ShakuNote';
import type { RenderOptions } from './RenderOptions';
import { OctaveMarksModifier } from '../modifiers/OctaveMarksModifier';
import { MeriKariModifier } from '../modifiers/MeriKariModifier';

/**
 * ModifierConfigurator handles configuration of note modifiers
 * based on render options.
 *
 * Following "Separation of Concerns" - modifier configuration is
 * separate from layout calculation and rendering.
 */
export class ModifierConfigurator {
  /**
   * Configures all modifiers on notes according to render options
   *
   * This method:
   * 1. Removes octave marks if disabled in options
   * 2. Configures octave mark appearance (fontSize, fontWeight, color)
   * 3. Configures meri/kari mark appearance (fontSize, fontWeight, color)
   *
   * @param notes - Array of ShakuNote objects to configure
   * @param options - Render options specifying modifier configuration
   */
  static configureModifiers(
    notes: ShakuNote[],
    options: Required<RenderOptions>,
  ): void {
    notes.forEach((note) => {
      const modifiers = note.getModifiers();

      // Remove octave marks if disabled
      if (!options.showOctaveMarks) {
        const nonOctaveModifiers = modifiers.filter(
          (mod) => !(mod instanceof OctaveMarksModifier),
        );
        note.setModifiers(nonOctaveModifiers);
      } else {
        // Configure octave marks and meri/kari marks
        modifiers.forEach((mod) => {
          if (mod instanceof OctaveMarksModifier) {
            this.configureOctaveMark(mod, options);
          }

          if (mod instanceof MeriKariModifier) {
            this.configureMeriKariMark(mod, options);
          }
        });
      }
    });
  }

  /**
   * Configures an octave mark modifier with render options
   *
   * @param modifier - OctaveMarksModifier to configure
   * @param options - Render options
   */
  private static configureOctaveMark(
    modifier: OctaveMarksModifier,
    options: Required<RenderOptions>,
  ): void {
    modifier
      .setFontSize(options.octaveMarkFontSize)
      .setFontWeight(options.octaveMarkFontWeight)
      .setColor(options.noteColor); // Use noteColor for consistency
  }

  /**
   * Configures a meri/kari mark modifier with render options
   *
   * @param modifier - MeriKariModifier to configure
   * @param options - Render options
   */
  private static configureMeriKariMark(
    modifier: MeriKariModifier,
    options: Required<RenderOptions>,
  ): void {
    modifier
      .setFontSize(options.meriKariFontSize)
      .setFontWeight(options.meriKariFontWeight)
      .setColor(options.noteColor); // Use noteColor for consistency
  }
}
