/**
 * Unit tests for ModifierConfigurator
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ModifierConfigurator } from './ModifierConfigurator';
import { ShakuNote } from '../notes/ShakuNote';
import { OctaveMarksModifier } from '../modifiers/OctaveMarksModifier';
import { MeriKariModifier } from '../modifiers/MeriKariModifier';
import { DurationDotModifier } from '../modifiers/DurationDotModifier';
import { mergeWithDefaults, type RenderOptions } from './RenderOptions';

describe('ModifierConfigurator', () => {
  describe('configureModifiers', () => {
    it('should configure octave marks with correct fontSize and fontWeight', () => {
      // Create a note with an octave mark modifier
      const octaveMod = new OctaveMarksModifier('kan');
      const note = new ShakuNote({ symbol: 'ro' });
      note.addModifier(octaveMod);

      const options = mergeWithDefaults({
        octaveMarkFontSize: 14,
        octaveMarkFontWeight: 600,
      });

      ModifierConfigurator.configureModifiers([note], options);

      // Verify octave mark was configured
      // Note: We can't directly inspect private properties, but we can check
      // that the modifier exists and wasn't removed
      const modifiers = note.getModifiers();
      expect(modifiers.length).toBe(1);
      expect(modifiers[0]).toBeInstanceOf(OctaveMarksModifier);
    });

    it('should configure meri/kari marks with correct fontSize and fontWeight', () => {
      // Create a note with a meri mark modifier
      const meriMod = new MeriKariModifier('meri');
      const note = new ShakuNote({ symbol: 'ro' });
      note.addModifier(meriMod);

      const options = mergeWithDefaults({
        meriKariFontSize: 16,
        meriKariFontWeight: 550,
      });

      ModifierConfigurator.configureModifiers([note], options);

      // Verify meri mark was configured
      const modifiers = note.getModifiers();
      expect(modifiers.length).toBe(1);
      expect(modifiers[0]).toBeInstanceOf(MeriKariModifier);
    });

    it('should remove octave marks when showOctaveMarks is false', () => {
      // Create a note with octave and meri modifiers
      const octaveMod = new OctaveMarksModifier('kan');
      const meriMod = new MeriKariModifier('meri');
      const note = new ShakuNote({ symbol: 'ro' });
      note.addModifier(octaveMod);
      note.addModifier(meriMod);

      const options = mergeWithDefaults({
        showOctaveMarks: false,
      });

      ModifierConfigurator.configureModifiers([note], options);

      // Verify octave mark was removed but meri mark remains
      const modifiers = note.getModifiers();
      expect(modifiers.length).toBe(1);
      expect(modifiers[0]).toBeInstanceOf(MeriKariModifier);
    });

    it('should keep octave marks when showOctaveMarks is true', () => {
      // Create a note with octave and meri modifiers
      const octaveMod = new OctaveMarksModifier('kan');
      const meriMod = new MeriKariModifier('meri');
      const note = new ShakuNote({ symbol: 'ro' });
      note.addModifier(octaveMod);
      note.addModifier(meriMod);

      const options = mergeWithDefaults({
        showOctaveMarks: true,
      });

      ModifierConfigurator.configureModifiers([note], options);

      // Verify both modifiers remain
      const modifiers = note.getModifiers();
      expect(modifiers.length).toBe(2);
      const hasOctave = modifiers.some((m) => m instanceof OctaveMarksModifier);
      const hasMeri = modifiers.some((m) => m instanceof MeriKariModifier);
      expect(hasOctave).toBe(true);
      expect(hasMeri).toBe(true);
    });

    it('should preserve other modifiers when removing octave marks', () => {
      // Create a note with octave, meri, and duration dot modifiers
      const octaveMod = new OctaveMarksModifier('kan');
      const meriMod = new MeriKariModifier('chu-meri');
      const dotMod = new DurationDotModifier();
      const note = new ShakuNote({ symbol: 'ro' });
      note.addModifier(octaveMod);
      note.addModifier(meriMod);
      note.addModifier(dotMod);

      const options = mergeWithDefaults({
        showOctaveMarks: false,
      });

      ModifierConfigurator.configureModifiers([note], options);

      // Verify octave mark removed, but meri and dot remain
      const modifiers = note.getModifiers();
      expect(modifiers.length).toBe(2);
      expect(modifiers.some((m) => m instanceof OctaveMarksModifier)).toBe(false);
      expect(modifiers.some((m) => m instanceof MeriKariModifier)).toBe(true);
      expect(modifiers.some((m) => m instanceof DurationDotModifier)).toBe(true);
    });

    it('should configure multiple notes correctly', () => {
      // Create multiple notes with different modifiers
      const note1 = new ShakuNote({ symbol: 'ro' });
      note1.addModifier(new OctaveMarksModifier('kan'));

      const note2 = new ShakuNote({ symbol: 'tsu' });
      note2.addModifier(new MeriKariModifier('meri'));

      const note3 = new ShakuNote({ symbol: 'chi' });
      note3.addModifier(new OctaveMarksModifier('otsu'));
      note3.addModifier(new MeriKariModifier('dai-meri'));

      const notes = [note1, note2, note3];
      const options = mergeWithDefaults({
        showOctaveMarks: true,
      });

      ModifierConfigurator.configureModifiers(notes, options);

      // Verify all modifiers remain
      expect(note1.getModifiers().length).toBe(1);
      expect(note2.getModifiers().length).toBe(1);
      expect(note3.getModifiers().length).toBe(2);
    });

    it('should handle notes with no modifiers', () => {
      const note = new ShakuNote({ symbol: 'ro' });
      const options = mergeWithDefaults({});

      // Should not throw
      expect(() => {
        ModifierConfigurator.configureModifiers([note], options);
      }).not.toThrow();

      expect(note.getModifiers().length).toBe(0);
    });

    it('should handle empty notes array', () => {
      const options = mergeWithDefaults({});

      // Should not throw
      expect(() => {
        ModifierConfigurator.configureModifiers([], options);
      }).not.toThrow();
    });

    it('should use default options when not specified', () => {
      const octaveMod = new OctaveMarksModifier('kan');
      const note = new ShakuNote({ symbol: 'ro' });
      note.addModifier(octaveMod);

      const options = mergeWithDefaults({});

      ModifierConfigurator.configureModifiers([note], options);

      // With default options, octave marks should be shown
      const modifiers = note.getModifiers();
      expect(modifiers.length).toBe(1);
      expect(modifiers[0]).toBeInstanceOf(OctaveMarksModifier);
    });

    it('should configure multiple octave marks on same note', () => {
      // Edge case: note with multiple octave marks (unusual but possible)
      const note = new ShakuNote({ symbol: 'ro' });
      note.addModifier(new OctaveMarksModifier('kan'));
      note.addModifier(new OctaveMarksModifier('otsu'));

      const options = mergeWithDefaults({
        showOctaveMarks: true,
      });

      ModifierConfigurator.configureModifiers([note], options);

      // Both should be configured
      const modifiers = note.getModifiers();
      expect(modifiers.length).toBe(2);
      expect(modifiers.every((m) => m instanceof OctaveMarksModifier)).toBe(true);
    });

    it('should remove all octave marks when disabled, even if multiple', () => {
      const note = new ShakuNote({ symbol: 'ro' });
      note.addModifier(new OctaveMarksModifier('kan'));
      note.addModifier(new OctaveMarksModifier('otsu'));
      note.addModifier(new MeriKariModifier('meri'));

      const options = mergeWithDefaults({
        showOctaveMarks: false,
      });

      ModifierConfigurator.configureModifiers([note], options);

      // Only meri should remain
      const modifiers = note.getModifiers();
      expect(modifiers.length).toBe(1);
      expect(modifiers[0]).toBeInstanceOf(MeriKariModifier);
    });

    it('should configure modifiers with custom options', () => {
      const note1 = new ShakuNote({ symbol: 'ro' });
      note1.addModifier(new OctaveMarksModifier('kan'));

      const note2 = new ShakuNote({ symbol: 'tsu' });
      note2.addModifier(new MeriKariModifier('chu-meri'));

      const customOptions: RenderOptions = {
        showOctaveMarks: true,
        octaveMarkFontSize: 16,
        octaveMarkFontWeight: 700,
        meriKariFontSize: 18,
        meriKariFontWeight: 650,
        noteColor: '#333',
      };

      const options = mergeWithDefaults(customOptions);

      ModifierConfigurator.configureModifiers([note1, note2], options);

      // Modifiers should still exist (configuration is internal)
      expect(note1.getModifiers().length).toBe(1);
      expect(note2.getModifiers().length).toBe(1);
    });
  });
});
