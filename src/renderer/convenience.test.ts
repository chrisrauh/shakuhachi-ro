/**
 * Tests for convenience functions
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderScoreFromURL, renderScore } from './convenience';
import { ScoreRenderer } from './ScoreRenderer';
import type { ScoreData } from '../types/ScoreData';

// Mock MusicXMLParser to avoid actual file loading
vi.mock('../parser/MusicXMLParser', () => ({
  MusicXMLParser: {
    parseFromURL: vi.fn(async (url: string) => ({
      title: 'Test Score',
      composer: 'Test Composer',
      style: 'kinko' as const,
      notes: [
        { pitch: { step: 'ro' as const, octave: 0 }, duration: 1 },
        { pitch: { step: 'tsu' as const, octave: 0 }, duration: 1 },
      ],
    })),
  },
}));

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

describe('Convenience Functions', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = createMockContainer();
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe('renderScoreFromURL', () => {
    it('should render score from URL', async () => {
      const renderer = await renderScoreFromURL(
        container,
        '/data/test.musicxml'
      );

      expect(renderer).toBeInstanceOf(ScoreRenderer);
      expect(container.querySelector('svg')).toBeTruthy();
    });

    it('should render with default options', async () => {
      const renderer = await renderScoreFromURL(
        container,
        '/data/test.musicxml'
      );

      const options = renderer.getOptions();
      expect(options.showOctaveMarks).toBe(true);
      expect(options.notesPerColumn).toBe(10);
    });

    it('should render with custom options', async () => {
      const renderer = await renderScoreFromURL(
        container,
        '/data/test.musicxml',
        {
          showOctaveMarks: false,
          notesPerColumn: 5,
          showDebugLabels: true,
        }
      );

      const options = renderer.getOptions();
      expect(options.showOctaveMarks).toBe(false);
      expect(options.notesPerColumn).toBe(5);
      expect(options.showDebugLabels).toBe(true);
    });

    it('should return ScoreRenderer instance', async () => {
      const renderer = await renderScoreFromURL(
        container,
        '/data/test.musicxml'
      );

      // Should be able to call renderer methods
      expect(typeof renderer.refresh).toBe('function');
      expect(typeof renderer.setOptions).toBe('function');
      expect(typeof renderer.resize).toBe('function');
    });

    it('should allow further manipulation of renderer', async () => {
      const renderer = await renderScoreFromURL(
        container,
        '/data/test.musicxml'
      );

      // Should be able to change options
      renderer.setOptions({ notesPerColumn: 3 }, false);
      expect(renderer.getOptions().notesPerColumn).toBe(3);
    });

    it('should render notes from parsed URL', async () => {
      const renderer = await renderScoreFromURL(
        container,
        '/data/test.musicxml'
      );

      const notes = renderer.getNotes();
      expect(notes.length).toBeGreaterThan(0);
    });

    it('should store score data', async () => {
      const renderer = await renderScoreFromURL(
        container,
        '/data/test.musicxml'
      );

      const scoreData = renderer.getScoreData();
      expect(scoreData).toBeTruthy();
      expect(scoreData?.title).toBe('Test Score');
    });
  });

  describe('renderScore', () => {
    it('should render score from ScoreData', async () => {
      const scoreData = createTestScoreData();
      const renderer = await renderScore(container, scoreData);

      expect(renderer).toBeInstanceOf(ScoreRenderer);
      expect(container.querySelector('svg')).toBeTruthy();
    });

    it('should render with default options', async () => {
      const scoreData = createTestScoreData();
      const renderer = await renderScore(container, scoreData);

      const options = renderer.getOptions();
      expect(options.showOctaveMarks).toBe(true);
      expect(options.notesPerColumn).toBe(10);
    });

    it('should render with custom options', async () => {
      const scoreData = createTestScoreData();
      const renderer = await renderScore(container, scoreData, {
        showOctaveMarks: false,
        notesPerColumn: 8,
        noteColor: '#333',
      });

      const options = renderer.getOptions();
      expect(options.showOctaveMarks).toBe(false);
      expect(options.notesPerColumn).toBe(8);
      expect(options.noteColor).toBe('#333');
    });

    it('should return ScoreRenderer instance', async () => {
      const scoreData = createTestScoreData();
      const renderer = await renderScore(container, scoreData);

      // Should be able to call renderer methods
      expect(typeof renderer.refresh).toBe('function');
      expect(typeof renderer.setOptions).toBe('function');
      expect(typeof renderer.clear).toBe('function');
    });

    it('should allow further manipulation of renderer', async () => {
      const scoreData = createTestScoreData();
      const renderer = await renderScore(container, scoreData);

      // Should be able to resize
      renderer.resize(1000, 800);
      const svg = container.querySelector('svg');
      expect(svg?.getAttribute('width')).toBe('1000');
    });

    it('should render correct number of notes', async () => {
      const scoreData = createTestScoreData();
      const renderer = await renderScore(container, scoreData);

      const notes = renderer.getNotes();
      expect(notes.length).toBe(3);
    });

    it('should store score data', async () => {
      const scoreData = createTestScoreData();
      const renderer = await renderScore(container, scoreData);

      const storedData = renderer.getScoreData();
      expect(storedData).toBe(scoreData);
    });

    it('should handle score with single note', async () => {
      const scoreData: ScoreData = {
        title: 'Single Note',
        style: 'kinko',
        notes: [{ pitch: { step: 'ro', octave: 0 }, duration: 1 }],
      };

      const renderer = await renderScore(container, scoreData);
      expect(renderer.getNotes().length).toBe(1);
    });
  });

  describe('convenience functions integration', () => {
    it('should work with both URL and ScoreData', async () => {
      // Render from URL
      const renderer1 = await renderScoreFromURL(
        container,
        '/data/test.musicxml'
      );
      const svg1 = container.querySelector('svg');
      expect(svg1).toBeTruthy();

      // Clear and render from ScoreData
      renderer1.clear();
      const scoreData = createTestScoreData();
      const renderer2 = await renderScore(container, scoreData);
      const svg2 = container.querySelector('svg');
      expect(svg2).toBeTruthy();
    });

    it('should create independent renderers', async () => {
      const container1 = createMockContainer();
      const container2 = createMockContainer();

      try {
        const renderer1 = await renderScoreFromURL(
          container1,
          '/data/test1.musicxml',
          { notesPerColumn: 5 }
        );

        const scoreData = createTestScoreData();
        const renderer2 = await renderScore(container2, scoreData, {
          notesPerColumn: 10,
        });

        // Should have different options
        expect(renderer1.getOptions().notesPerColumn).toBe(5);
        expect(renderer2.getOptions().notesPerColumn).toBe(10);

        // Changes to one shouldn't affect the other
        renderer1.setOptions({ notesPerColumn: 3 }, false);
        expect(renderer1.getOptions().notesPerColumn).toBe(3);
        expect(renderer2.getOptions().notesPerColumn).toBe(10);
      } finally {
        document.body.removeChild(container1);
        document.body.removeChild(container2);
      }
    });

    it('should allow chaining operations after creation', async () => {
      const scoreData = createTestScoreData();
      const renderer = await renderScore(container, scoreData, {
        showOctaveMarks: true,
      });

      // Should be able to update and refresh
      renderer.setOptions({ showOctaveMarks: false });

      // Should be able to get updated state
      expect(renderer.getOptions().showOctaveMarks).toBe(false);
    });
  });
});
