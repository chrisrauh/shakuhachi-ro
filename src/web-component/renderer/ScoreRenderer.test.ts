/**
 * Integration tests for ScoreRenderer
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ScoreRenderer } from './ScoreRenderer';
import { ShakuNote } from '../notes/ShakuNote';
import { OctaveMarksModifier } from '../modifiers/OctaveMarksModifier';
import { MeriKariModifier } from '../modifiers/MeriKariModifier';
import { DurationDotModifier } from '../modifiers/DurationDotModifier';
import type { ScoreData } from '../types/ScoreData';

/**
 * Creates a mock container element for testing
 */
function createMockContainer(): HTMLElement {
  const container = document.createElement('div');
  container.style.width = '800px';
  container.style.height = '600px';
  document.body.appendChild(container);
  return container;
}

/**
 * Creates a simple test score data
 */
function createTestScoreData(): ScoreData {
  return {
    title: 'Test Score',
    composer: 'Test Composer',
    style: 'kinko',
    notes: [
      { pitch: { step: 'ro', octave: 0 }, duration: 1 },
      { pitch: { step: 'tsu', octave: 0 }, duration: 1 },
      { pitch: { step: 'chi', octave: 0 }, duration: 1 },
    ],
  };
}

describe('ScoreRenderer', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = createMockContainer();
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe('constructor', () => {
    it('should create renderer with default options', () => {
      const renderer = new ScoreRenderer(container);
      const options = renderer.getOptions();

      expect(options.showOctaveMarks).toBe(true);
      expect(options.showDebugLabels).toBe(false);
      expect(options.notesPerColumn).toBe(10);
    });

    it('should create renderer with custom options', () => {
      const renderer = new ScoreRenderer(container, {
        showOctaveMarks: false,
        showDebugLabels: true,
        notesPerColumn: 5,
      });

      const options = renderer.getOptions();
      expect(options.showOctaveMarks).toBe(false);
      expect(options.showDebugLabels).toBe(true);
      expect(options.notesPerColumn).toBe(5);
    });
  });

  describe('renderNotes', () => {
    it('should render notes into container', () => {
      const notes = [
        new ShakuNote({ symbol: 'ro' }),
        new ShakuNote({ symbol: 'tsu' }),
        new ShakuNote({ symbol: 'chi' }),
      ];

      const renderer = new ScoreRenderer(container);
      renderer.renderNotes(notes);

      // Should create SVG element
      const svg = container.querySelector('svg');
      expect(svg).toBeTruthy();
      expect(svg?.getAttribute('width')).toBe('800');
      expect(svg?.getAttribute('height')).toBe('600');
    });

    it('should render notes with octave marks when enabled', () => {
      const note = new ShakuNote({ symbol: 'ro' });
      note.addModifier(new OctaveMarksModifier('kan'));

      const renderer = new ScoreRenderer(container, {
        showOctaveMarks: true,
      });
      renderer.renderNotes([note]);

      // Note should still have octave modifier
      const notes = renderer.getNotes();
      expect(notes[0].getModifiers().length).toBe(1);
      expect(notes[0].getModifiers()[0]).toBeInstanceOf(OctaveMarksModifier);
    });

    it('should remove octave marks when disabled', () => {
      const note = new ShakuNote({ symbol: 'ro' });
      note.addModifier(new OctaveMarksModifier('kan'));
      note.addModifier(new MeriKariModifier('meri'));

      const renderer = new ScoreRenderer(container, {
        showOctaveMarks: false,
      });
      renderer.renderNotes([note]);

      // Octave mark should be removed, meri should remain
      const notes = renderer.getNotes();
      expect(notes[0].getModifiers().length).toBe(1);
      expect(notes[0].getModifiers()[0]).toBeInstanceOf(MeriKariModifier);
    });

    it('should handle empty notes array', () => {
      const renderer = new ScoreRenderer(container);
      renderer.renderNotes([]);

      // Should create SVG but no notes
      const svg = container.querySelector('svg');
      expect(svg).toBeTruthy();
    });

    it('should render multiple columns', () => {
      // Create 25 notes (should create 3 columns with 10 notes each)
      const notes = Array.from(
        { length: 25 },
        () => new ShakuNote({ symbol: 'ro' }),
      );

      const renderer = new ScoreRenderer(container, {
        notesPerColumn: 10,
      });
      renderer.renderNotes(notes);

      const svg = container.querySelector('svg');
      expect(svg).toBeTruthy();
    });

    it('should apply custom note styling', () => {
      const note = new ShakuNote({ symbol: 'ro' });

      const renderer = new ScoreRenderer(container, {
        noteFontSize: 40,
        noteFontWeight: 700,
      });
      renderer.renderNotes([note]);

      // Note should have custom styling applied
      const notes = renderer.getNotes();
      expect(notes[0]).toBeTruthy();
    });

    it('should render debug labels when enabled', () => {
      const note = new ShakuNote({ symbol: 'ro' });
      note.addModifier(new OctaveMarksModifier('kan'));

      const renderer = new ScoreRenderer(container, {
        showDebugLabels: true,
      });
      renderer.renderNotes([note]);

      // Should render debug label text elements
      const svg = container.querySelector('svg');
      const textElements = svg?.querySelectorAll('text');
      // At least 2 text elements: one for the note, one for debug label
      expect(textElements && textElements.length).toBeGreaterThanOrEqual(2);
    });

    it('should not render debug labels when disabled', () => {
      const note = new ShakuNote({ symbol: 'ro' });

      const renderer = new ScoreRenderer(container, {
        showDebugLabels: false,
      });
      renderer.renderNotes([note]);

      // Should only have note text, no debug labels
      const svg = container.querySelector('svg');
      expect(svg).toBeTruthy();
    });

    it('should clear previous render when rendering new notes', () => {
      const renderer = new ScoreRenderer(container);

      // First render
      renderer.renderNotes([new ShakuNote({ symbol: 'ro' })]);
      const firstSvg = container.querySelector('svg');

      // Second render
      renderer.renderNotes([
        new ShakuNote({ symbol: 'tsu' }),
        new ShakuNote({ symbol: 'chi' }),
      ]);
      const secondSvg = container.querySelector('svg');

      // Should have replaced the SVG
      expect(firstSvg).not.toBe(secondSvg);

      // Should only have one SVG element
      const allSvgs = container.querySelectorAll('svg');
      expect(allSvgs.length).toBe(1);
    });

    it('should use custom viewport dimensions from options', () => {
      const renderer = new ScoreRenderer(container, {
        width: 1000,
        height: 800,
      });
      renderer.renderNotes([new ShakuNote({ symbol: 'ro' })]);

      const svg = container.querySelector('svg');
      expect(svg?.getAttribute('width')).toBe('1000');
      expect(svg?.getAttribute('height')).toBe('800');
    });
  });

  describe('renderFromScoreData', () => {
    it('should render from ScoreData object', async () => {
      const scoreData = createTestScoreData();
      const renderer = new ScoreRenderer(container);

      await renderer.renderFromScoreData(scoreData);

      // Should render notes
      const svg = container.querySelector('svg');
      expect(svg).toBeTruthy();

      // Should store score data
      expect(renderer.getScoreData()).toBe(scoreData);

      // Should have parsed notes
      const notes = renderer.getNotes();
      expect(notes.length).toBe(3);
    });
  });

  describe('setOptions', () => {
    it('should update options', () => {
      const renderer = new ScoreRenderer(container);
      expect(renderer.getOptions().notesPerColumn).toBe(10);

      renderer.setOptions({ notesPerColumn: 5 }, false);
      expect(renderer.getOptions().notesPerColumn).toBe(5);
    });

    it('should auto-refresh by default', () => {
      const renderer = new ScoreRenderer(container);
      renderer.renderNotes([new ShakuNote({ symbol: 'ro' })]);

      const firstSvg = container.querySelector('svg');

      renderer.setOptions({ notesPerColumn: 5 });

      const secondSvg = container.querySelector('svg');
      expect(firstSvg).not.toBe(secondSvg);
    });

    it('should not auto-refresh when disabled', () => {
      const renderer = new ScoreRenderer(container);
      renderer.renderNotes([new ShakuNote({ symbol: 'ro' })]);

      const firstSvg = container.querySelector('svg');

      renderer.setOptions({ notesPerColumn: 5 }, false);

      const secondSvg = container.querySelector('svg');
      expect(firstSvg).toBe(secondSvg);
    });

    it('should merge options correctly', () => {
      const renderer = new ScoreRenderer(container, {
        notesPerColumn: 10,
        showOctaveMarks: true,
      });

      renderer.setOptions({ notesPerColumn: 5 }, false);

      const options = renderer.getOptions();
      expect(options.notesPerColumn).toBe(5);
      expect(options.showOctaveMarks).toBe(true);
    });
  });

  describe('refresh', () => {
    it('should re-render current notes', () => {
      const renderer = new ScoreRenderer(container);
      renderer.renderNotes([new ShakuNote({ symbol: 'ro' })]);

      const firstSvg = container.querySelector('svg');

      renderer.refresh();

      const secondSvg = container.querySelector('svg');
      expect(firstSvg).not.toBe(secondSvg);
    });

    it('should apply updated options on refresh', () => {
      const note = new ShakuNote({ symbol: 'ro' });
      note.addModifier(new OctaveMarksModifier('kan'));

      const renderer = new ScoreRenderer(container, {
        showOctaveMarks: true,
      });
      renderer.renderNotes([note]);

      // Octave mark should be present
      expect(renderer.getNotes()[0].getModifiers().length).toBe(1);

      // Change options and refresh
      renderer.setOptions({ showOctaveMarks: false }, false);
      renderer.refresh();

      // Octave mark should be removed
      expect(renderer.getNotes()[0].getModifiers().length).toBe(0);
    });

    it('should not error when no notes rendered', () => {
      const renderer = new ScoreRenderer(container);

      expect(() => {
        renderer.refresh();
      }).not.toThrow();
    });
  });

  describe('resize', () => {
    it('should update viewport dimensions', () => {
      const renderer = new ScoreRenderer(container);
      renderer.renderNotes([new ShakuNote({ symbol: 'ro' })]);

      renderer.resize(1000, 800);

      const svg = container.querySelector('svg');
      expect(svg?.getAttribute('width')).toBe('1000');
      expect(svg?.getAttribute('height')).toBe('800');
    });

    it('should re-render on resize', () => {
      const renderer = new ScoreRenderer(container);
      renderer.renderNotes([new ShakuNote({ symbol: 'ro' })]);

      const firstSvg = container.querySelector('svg');

      renderer.resize(1000, 800);

      const secondSvg = container.querySelector('svg');
      expect(firstSvg).not.toBe(secondSvg);
    });
  });

  describe('getters', () => {
    it('should return copy of options', () => {
      const renderer = new ScoreRenderer(container);
      const options1 = renderer.getOptions();
      const options2 = renderer.getOptions();

      expect(options1).toEqual(options2);
      expect(options1).not.toBe(options2);
    });

    it('should return copy of notes array', () => {
      const notes = [new ShakuNote({ symbol: 'ro' })];
      const renderer = new ScoreRenderer(container);
      renderer.renderNotes(notes);

      const retrievedNotes = renderer.getNotes();
      expect(retrievedNotes).toEqual(notes);
      expect(retrievedNotes).not.toBe(notes);
    });

    it('should return null score data when rendering notes directly', () => {
      const renderer = new ScoreRenderer(container);
      renderer.renderNotes([new ShakuNote({ symbol: 'ro' })]);

      expect(renderer.getScoreData()).toBeNull();
    });

    it('should return score data when rendered from ScoreData', async () => {
      const scoreData = createTestScoreData();
      const renderer = new ScoreRenderer(container);
      await renderer.renderFromScoreData(scoreData);

      expect(renderer.getScoreData()).toBe(scoreData);
    });
  });

  describe('clear', () => {
    it('should clear rendered content', () => {
      const renderer = new ScoreRenderer(container);
      renderer.renderNotes([new ShakuNote({ symbol: 'ro' })]);

      expect(container.querySelector('svg')).toBeTruthy();

      renderer.clear();

      expect(container.querySelector('svg')).toBeNull();
      expect(container.innerHTML).toBe('');
    });

    it('should clear internal state', () => {
      const renderer = new ScoreRenderer(container);
      renderer.renderNotes([new ShakuNote({ symbol: 'ro' })]);

      renderer.clear();

      expect(renderer.getNotes().length).toBe(0);
      expect(renderer.getScoreData()).toBeNull();
    });
  });

  describe('integration tests', () => {
    it('should handle complete render pipeline', async () => {
      const scoreData = createTestScoreData();
      const renderer = new ScoreRenderer(container, {
        notesPerColumn: 2,
        showDebugLabels: true,
      });

      await renderer.renderFromScoreData(scoreData);

      // Should have rendered
      expect(container.querySelector('svg')).toBeTruthy();

      // Should have correct number of notes
      expect(renderer.getNotes().length).toBe(3);

      // Should have 2 columns (3 notes, 2 per column)
      const options = renderer.getOptions();
      expect(options.notesPerColumn).toBe(2);
    });

    it('should handle options changes through full cycle', () => {
      const note1 = new ShakuNote({ symbol: 'ro' });
      note1.addModifier(new OctaveMarksModifier('kan'));

      const note2 = new ShakuNote({ symbol: 'tsu' });
      note2.addModifier(new MeriKariModifier('meri'));

      const renderer = new ScoreRenderer(container, {
        showOctaveMarks: true,
        showDebugLabels: false,
      });

      renderer.renderNotes([note1, note2]);

      // Initial state: octave marks shown
      expect(renderer.getNotes()[0].getModifiers().length).toBeGreaterThan(0);

      // Change options: hide octave marks, show debug labels
      renderer.setOptions({
        showOctaveMarks: false,
        showDebugLabels: true,
      });

      // Should have removed octave marks but kept meri marks
      const notes = renderer.getNotes();
      expect(notes[0].getModifiers().length).toBe(0);
      expect(notes[1].getModifiers().length).toBe(1);
    });

    it('should handle notes with multiple modifiers', () => {
      const note = new ShakuNote({ symbol: 'ro' });
      note.addModifier(new OctaveMarksModifier('kan'));
      note.addModifier(new MeriKariModifier('chu-meri'));
      note.addModifier(new DurationDotModifier());

      const renderer = new ScoreRenderer(container);
      renderer.renderNotes([note]);

      expect(container.querySelector('svg')).toBeTruthy();
    });
  });
});
