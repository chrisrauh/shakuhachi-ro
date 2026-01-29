/**
 * Unit tests for RenderOptions
 */

import { describe, it, expect } from 'vitest';
import {
  type RenderOptions,
  DEFAULT_RENDER_OPTIONS,
  mergeWithDefaults,
} from './RenderOptions';

describe('RenderOptions', () => {
  describe('DEFAULT_RENDER_OPTIONS', () => {
    it('should have correct display option defaults', () => {
      expect(DEFAULT_RENDER_OPTIONS.showOctaveMarks).toBe(true);
      expect(DEFAULT_RENDER_OPTIONS.showDebugLabels).toBe(false);
    });

    it('should have correct layout option defaults', () => {
      expect(DEFAULT_RENDER_OPTIONS.notesPerColumn).toBe(10);
      expect(DEFAULT_RENDER_OPTIONS.columnSpacing).toBe(35);
      expect(DEFAULT_RENDER_OPTIONS.columnWidth).toBe(100);
      expect(DEFAULT_RENDER_OPTIONS.topMargin).toBe(34);
    });

    it('should have correct note typography defaults', () => {
      expect(DEFAULT_RENDER_OPTIONS.noteFontSize).toBe(28);
      expect(DEFAULT_RENDER_OPTIONS.noteFontWeight).toBe(400);
      expect(DEFAULT_RENDER_OPTIONS.noteVerticalSpacing).toBe(44);
      expect(DEFAULT_RENDER_OPTIONS.noteFontFamily).toBe('Noto Sans JP, sans-serif');
      expect(DEFAULT_RENDER_OPTIONS.noteColor).toBe('#000');
    });

    it('should have correct octave mark configuration defaults', () => {
      expect(DEFAULT_RENDER_OPTIONS.octaveMarkFontSize).toBe(12);
      expect(DEFAULT_RENDER_OPTIONS.octaveMarkFontWeight).toBe(500);
      expect(DEFAULT_RENDER_OPTIONS.octaveMarkOffsetX).toBe(18);
      expect(DEFAULT_RENDER_OPTIONS.octaveMarkOffsetY).toBe(-22);
    });

    it('should have correct meri/kari mark configuration defaults', () => {
      expect(DEFAULT_RENDER_OPTIONS.meriKariFontSize).toBe(14);
      expect(DEFAULT_RENDER_OPTIONS.meriKariFontWeight).toBe(500);
    });

    it('should have correct duration dot configuration defaults', () => {
      expect(DEFAULT_RENDER_OPTIONS.durationDotExtraSpacing).toBe(12);
    });

    it('should have correct debug label configuration defaults', () => {
      expect(DEFAULT_RENDER_OPTIONS.debugLabelFontSize).toBe(7);
      expect(DEFAULT_RENDER_OPTIONS.debugLabelOffsetX).toBe(25);
      expect(DEFAULT_RENDER_OPTIONS.debugLabelOffsetY).toBe(-6);
      expect(DEFAULT_RENDER_OPTIONS.debugLabelFontFamily).toBe('monospace');
      expect(DEFAULT_RENDER_OPTIONS.debugLabelColor).toBe('#999');
    });

    it('should have correct viewport option defaults', () => {
      expect(DEFAULT_RENDER_OPTIONS.autoResize).toBe(true);
    });
  });

  describe('mergeWithDefaults', () => {
    it('should return defaults when no options provided', () => {
      const result = mergeWithDefaults();
      expect(result).toEqual(DEFAULT_RENDER_OPTIONS);
    });

    it('should return defaults when empty object provided', () => {
      const result = mergeWithDefaults({});
      expect(result).toEqual(DEFAULT_RENDER_OPTIONS);
    });

    it('should merge display options correctly', () => {
      const options: RenderOptions = {
        showOctaveMarks: false,
        showDebugLabels: true,
      };
      const result = mergeWithDefaults(options);

      expect(result.showOctaveMarks).toBe(false);
      expect(result.showDebugLabels).toBe(true);
      // Other options should still be defaults
      expect(result.noteFontSize).toBe(DEFAULT_RENDER_OPTIONS.noteFontSize);
    });

    it('should merge layout options correctly', () => {
      const options: RenderOptions = {
        notesPerColumn: 15,
        columnSpacing: 50,
        columnWidth: 120,
      };
      const result = mergeWithDefaults(options);

      expect(result.notesPerColumn).toBe(15);
      expect(result.columnSpacing).toBe(50);
      expect(result.columnWidth).toBe(120);
      // Other options should still be defaults
      expect(result.showOctaveMarks).toBe(DEFAULT_RENDER_OPTIONS.showOctaveMarks);
    });

    it('should merge note typography options correctly', () => {
      const options: RenderOptions = {
        noteFontSize: 32,
        noteFontWeight: 700,
        noteVerticalSpacing: 50,
        noteFontFamily: 'Arial',
        noteColor: '#333',
      };
      const result = mergeWithDefaults(options);

      expect(result.noteFontSize).toBe(32);
      expect(result.noteFontWeight).toBe(700);
      expect(result.noteVerticalSpacing).toBe(50);
      expect(result.noteFontFamily).toBe('Arial');
      expect(result.noteColor).toBe('#333');
    });

    it('should merge octave mark options correctly', () => {
      const options: RenderOptions = {
        octaveMarkFontSize: 14,
        octaveMarkFontWeight: 600,
        octaveMarkOffsetX: 20,
        octaveMarkOffsetY: -25,
      };
      const result = mergeWithDefaults(options);

      expect(result.octaveMarkFontSize).toBe(14);
      expect(result.octaveMarkFontWeight).toBe(600);
      expect(result.octaveMarkOffsetX).toBe(20);
      expect(result.octaveMarkOffsetY).toBe(-25);
    });

    it('should merge meri/kari mark options correctly', () => {
      const options: RenderOptions = {
        meriKariFontSize: 16,
        meriKariFontWeight: 600,
      };
      const result = mergeWithDefaults(options);

      expect(result.meriKariFontSize).toBe(16);
      expect(result.meriKariFontWeight).toBe(600);
    });

    it('should merge debug label options correctly', () => {
      const options: RenderOptions = {
        debugLabelFontSize: 10,
        debugLabelOffsetX: 30,
        debugLabelOffsetY: -10,
        debugLabelFontFamily: 'Courier',
        debugLabelColor: '#666',
      };
      const result = mergeWithDefaults(options);

      expect(result.debugLabelFontSize).toBe(10);
      expect(result.debugLabelOffsetX).toBe(30);
      expect(result.debugLabelOffsetY).toBe(-10);
      expect(result.debugLabelFontFamily).toBe('Courier');
      expect(result.debugLabelColor).toBe('#666');
    });

    it('should merge viewport options correctly', () => {
      const options: RenderOptions = {
        width: 1200,
        height: 800,
        autoResize: true,
      };
      const result = mergeWithDefaults(options);

      expect(result.width).toBe(1200);
      expect(result.height).toBe(800);
      expect(result.autoResize).toBe(true);
    });

    it('should handle partial options and preserve defaults for omitted values', () => {
      const options: RenderOptions = {
        noteFontSize: 30,
        showDebugLabels: true,
      };
      const result = mergeWithDefaults(options);

      // Changed values
      expect(result.noteFontSize).toBe(30);
      expect(result.showDebugLabels).toBe(true);

      // Unchanged defaults
      expect(result.noteFontWeight).toBe(DEFAULT_RENDER_OPTIONS.noteFontWeight);
      expect(result.showOctaveMarks).toBe(DEFAULT_RENDER_OPTIONS.showOctaveMarks);
      expect(result.columnSpacing).toBe(DEFAULT_RENDER_OPTIONS.columnSpacing);
      expect(result.octaveMarkFontSize).toBe(DEFAULT_RENDER_OPTIONS.octaveMarkFontSize);
    });

    it('should handle all options being overridden', () => {
      const options: RenderOptions = {
        showOctaveMarks: false,
        showDebugLabels: true,
        notesPerColumn: 20,
        columnSpacing: 40,
        columnWidth: 150,
        topMargin: 50,
        noteFontSize: 32,
        noteFontWeight: 700,
        noteVerticalSpacing: 50,
        noteFontFamily: 'Arial',
        noteColor: '#333',
        octaveMarkFontSize: 14,
        octaveMarkFontWeight: 600,
        octaveMarkOffsetX: 20,
        octaveMarkOffsetY: -25,
        meriKariFontSize: 16,
        meriKariFontWeight: 600,
        durationDotExtraSpacing: 15,
        debugLabelFontSize: 10,
        debugLabelOffsetX: 30,
        debugLabelOffsetY: -10,
        debugLabelFontFamily: 'Courier',
        debugLabelColor: '#666',
        width: 1200,
        height: 800,
        autoResize: true,
      };
      const result = mergeWithDefaults(options);

      // Verify every single option was overridden
      expect(result).toEqual(options);
      expect(result).not.toEqual(DEFAULT_RENDER_OPTIONS);
    });

    it('should handle zero and false values correctly', () => {
      const options: RenderOptions = {
        topMargin: 0,
        noteFontWeight: 100,
        showOctaveMarks: false,
        autoResize: false,
      };
      const result = mergeWithDefaults(options);

      // Zero and false should be preserved, not replaced with defaults
      expect(result.topMargin).toBe(0);
      expect(result.noteFontWeight).toBe(100);
      expect(result.showOctaveMarks).toBe(false);
      expect(result.autoResize).toBe(false);
    });
  });
});
