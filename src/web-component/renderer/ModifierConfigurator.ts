/**
 * ModifierConfigurator - Configures note modifiers based on render options
 *
 * Separates modifier configuration logic from rendering, following
 * Single Responsibility Principle. Extracts configuration logic from
 * index.html to make it reusable and testable.
 */

import type { ShakuNote } from '../notes/ShakuNote';
import type { ResolvedRenderOptions } from './RenderOptions';
import { OctaveMarksModifier } from '../modifiers/OctaveMarksModifier';
import { MeriKariModifier } from '../modifiers/MeriKariModifier';
import { DurationLineModifier } from '../modifiers/DurationLineModifier';
import { DurationDotModifier } from '../modifiers/DurationDotModifier';

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
   * 1. Removes octave marks if disabled in options (the only modifier
   *    that can be switched off entirely)
   * 2. Configures octave mark appearance (fontSize, fontWeight, color)
   * 3. Configures meri/kari mark appearance (fontSize, fontWeight, color)
   * 4. Configures duration line/dot color
   *
   * Steps 2-4 run for every remaining modifier regardless of
   * showOctaveMarks — that flag only controls octave mark removal.
   *
   * @param notes - Array of ShakuNote objects to configure
   * @param options - Render options specifying modifier configuration
   */
  static configureModifiers(
    notes: ShakuNote[],
    options: ResolvedRenderOptions,
  ): void {
    notes.forEach((note) => {
      // Octave marks are the only modifier that can be switched off entirely
      if (!options.showOctaveMarks) {
        const nonOctaveModifiers = note
          .getModifiers()
          .filter((mod) => !(mod instanceof OctaveMarksModifier));
        note.setModifiers(nonOctaveModifiers);
      }

      // Every remaining modifier is configured from render options
      note.getModifiers().forEach((mod) => {
        if (mod instanceof OctaveMarksModifier) {
          this.configureOctaveMark(mod, options);
        }

        if (mod instanceof MeriKariModifier) {
          this.configureMeriKariMark(mod, options);
        }

        if (mod instanceof DurationLineModifier) {
          mod.setColor(options.noteColor);
        }

        if (mod instanceof DurationDotModifier) {
          mod.setColor(options.noteColor);
        }
      });
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
    options: ResolvedRenderOptions,
  ): void {
    modifier
      .setFontSize(options.octaveMarkFontSize)
      .setFontWeight(options.octaveMarkFontWeight)
      .setFontFamily(options.noteFontFamily)
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
    options: ResolvedRenderOptions,
  ): void {
    modifier
      .setFontSize(options.meriKariFontSize)
      .setFontWeight(options.meriKariFontWeight)
      .setFontFamily(options.noteFontFamily)
      .setColor(options.noteColor); // Use noteColor for consistency
  }
}
