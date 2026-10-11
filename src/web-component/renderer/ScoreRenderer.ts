/**
 * ScoreRenderer - High-level API for rendering shakuhachi scores
 *
 * VexFlow-inspired architecture that integrates:
 * - RenderOptions for configuration
 * - ModifierConfigurator for modifier setup
 * - ColumnLayoutCalculator for layout
 * - SVGRenderer for drawing
 *
 * Provides simple, declarative API for rendering scores from various sources.
 */

import type { ScoreData } from '../types/ScoreData';
import type { ShakuNote } from '../notes/ShakuNote';
import { ScoreParser } from '../parser/ScoreParser';
import { SVGRenderer } from './SVGRenderer';
import type { RenderingBackend } from './RenderingBackend';
import { ModifierConfigurator } from './ModifierConfigurator';
import { ColumnLayoutCalculator } from './ColumnLayoutCalculator';
import {
  mergeWithDefaults,
  type RenderOptions,
  type ResolvedRenderOptions,
} from './RenderOptions';
import { OctaveMarksModifier } from '../modifiers/OctaveMarksModifier';
import { MeriKariModifier } from '../modifiers/MeriKariModifier';
import {
  meriKariReachLeft,
  octaveMarkReachRight,
} from '../modifiers/mark-geometry';

/**
 * Viewport used when the container measures zero, which happens while it is
 * hidden or not yet in the DOM. Rendering into a 0x0 viewport produces a blank
 * score, so a plausible size is substituted and corrected by the ResizeObserver
 * once the container is laid out.
 */
const DEFAULT_VIEWPORT = { width: 800, height: 600 } as const;

/**
 * Where a note is drawn, in the SVG's units, which are CSS pixels from its
 * top-left corner: the bounding box of the note and its marks, and the x of
 * the column's centre line it is drawn on.
 */
export interface NoteBox {
  x: number;
  y: number;
  width: number;
  height: number;
  /** The column line the note is drawn on. */
  centerX: number;
  /** The middle of the note's glyph ink, which marks are drawn around. */
  centerY: number;
  /**
   * A cell around the note for a highlight: centred on the glyph's ink and
   * the same size for every note, whatever its marks. See `noteCellSize`.
   */
  cell: { x: number; y: number; width: number; height: number };
}

/**
 * Where the middle of a kana's ink sits above its baseline, as a fraction of
 * the font size, measured on the notation fonts. Not the 0.4 the rest circle
 * uses, which is where it looks aligned to the characters beside it.
 */
const GLYPH_INK_CENTER_RATIO = 0.35;

/**
 * The gap kept between a note's cell and the next note's, and the room
 * around the marks inside it, as fractions of the font size (2px and 4px at
 * the default 32).
 */
const CELL_GAP_RATIO = 1 / 16;
const CELL_PADDING_RATIO = 1 / 8;

/**
 * The size of a note's cell. It's as tall as the distance between notes less
 * a gap, the most it can be without touching the next note's cell. It's wide
 * enough, with padding, for a meri mark on the left and an octave mark on the
 * right, whichever the note has. An octave mark, which reaches above the cell,
 * can rise past its top edge, as a dot can below.
 */
function noteCellSize(options: ResolvedRenderOptions): {
  width: number;
  height: number;
} {
  const reach = Math.max(
    meriKariReachLeft(options.meriKariFontSize),
    octaveMarkReachRight(options.octaveMarkFontSize),
  );
  return {
    width: Math.ceil(2 * (reach + options.noteFontSize * CELL_PADDING_RATIO)),
    height: options.noteVerticalSpacing - options.noteFontSize * CELL_GAP_RATIO,
  };
}

/**
 * ScoreRenderer - Main class for rendering shakuhachi notation
 *
 * Following VexFlow pattern:
 * - Constructor takes container element and options
 * - Provides multiple render methods for different data sources
 * - Manages SVG renderer lifecycle
 * - Handles responsive layout
 */
export class ScoreRenderer {
  private container: HTMLElement;
  /** The options as given, so ones left unset can follow those they derive from */
  private givenOptions: RenderOptions;
  private options: ResolvedRenderOptions;
  private currentNotes: ShakuNote[] = [];
  private currentScoreData: ScoreData | null = null;
  private resizeObserver?: ResizeObserver;

  /**
   * Creates a new ScoreRenderer
   *
   * @param container - DOM element to render into
   * @param options - Optional render configuration
   */
  constructor(container: HTMLElement, options: RenderOptions = {}) {
    this.container = container;
    this.givenOptions = options;
    this.options = mergeWithDefaults(options);

    // Set up ResizeObserver if autoResize is enabled
    if (this.options.autoResize) {
      this.setupResizeObserver();
    }
  }

  /**
   * Renders a score from ScoreData object
   *
   * Synchronous: all the work happens here, so a caller's try/catch sees any
   * error. As an async method its errors became rejected promises, which the
   * web component's try/catch never saw.
   *
   * @param scoreData - Parsed score data
   */
  renderFromScoreData(scoreData: ScoreData): void {
    this.currentScoreData = scoreData;
    const notes = ScoreParser.parse(scoreData, this.options.noteColor);
    this.renderNotes(notes);
  }

  /**
   * Renders an array of ShakuNote objects
   *
   * This is the core rendering method that:
   * 1. Creates SVG renderer
   * 2. Configures modifiers
   * 3. Calculates layout
   * 4. Renders notes at calculated positions
   * 5. Optionally renders debug labels
   *
   * @param notes - Array of ShakuNote objects to render
   */
  renderNotes(notes: ShakuNote[]): void {
    this.currentNotes = notes;

    // Clear container and create new SVG renderer
    this.container.innerHTML = '';

    // Get viewport dimensions
    const { width, height } = this.getViewportDimensions();

    const renderer = new SVGRenderer(this.container, width, height);

    // Configure modifiers based on options
    ModifierConfigurator.configureModifiers(notes, this.options);

    // Calculate layout
    const layout = ColumnLayoutCalculator.calculateLayout(
      notes,
      width,
      height,
      this.options,
    );

    // Render each column
    layout.columns.forEach((columnInfo) => {
      const columnNotes = notes.slice(
        columnInfo.noteStartIndex,
        columnInfo.noteEndIndex,
      );

      // Render notes at their calculated positions
      columnInfo.notePositions.forEach((notePosition, index) => {
        const note = columnNotes[index];
        const x = columnInfo.xPosition;
        const y = notePosition.y;

        // Set note styling
        note.setFontSize(this.options.noteFontSize);
        note.setFontWeight(this.options.noteFontWeight);
        note.setFontFamily(this.options.noteFontFamily);
        note.render(renderer, x, y, {
          distanceToNext: notePosition.nextY - y,
          noteFontSize: this.options.noteFontSize,
          noteSpacing: this.options.noteVerticalSpacing,
          dotSpacing: this.options.durationDotExtraSpacing,
        });

        // Render debug label if enabled
        if (this.options.showDebugLabels) {
          this.renderDebugLabel(renderer, note, notePosition.noteIndex, x, y);
        }
      });
    });
  }

  /**
   * Renders a debug label for a note
   *
   * Shows note index, romanji, octave, and meri info
   *
   * @param renderer - Backend to draw into
   * @param note - ShakuNote to create label for
   * @param globalIndex - Global index of note in score
   * @param x - X position of note
   * @param y - Y position of note
   */
  private renderDebugLabel(
    renderer: RenderingBackend,
    note: ShakuNote,
    globalIndex: number,
    x: number,
    y: number,
  ): void {
    const symbolInfo = note.getSymbolInfo();
    const isRest = !symbolInfo;
    const romanji = isRest ? 'rest' : symbolInfo?.romaji || 'unknown';

    // Check for octave modifier
    const octaveModifier = note
      .getModifiers()
      .find((m) => m instanceof OctaveMarksModifier) as
      | OctaveMarksModifier
      | undefined;
    const octave = octaveModifier ? `(${octaveModifier.getRegister()})` : '';

    // Check for meri modifier
    const meriModifier = note
      .getModifiers()
      .find((m) => m instanceof MeriKariModifier) as
      | MeriKariModifier
      | undefined;
    const meriInfo = meriModifier ? meriModifier.getType() : '';

    const label = `${globalIndex + 1} ${romanji} ${octave} ${meriInfo}`.trim();

    renderer.drawText(
      label,
      x + this.options.debugLabelOffsetX,
      y + this.options.debugLabelOffsetY,
      this.options.debugLabelFontSize,
      this.options.debugLabelFontFamily,
      this.options.debugLabelColor,
      'start', // Left-aligned text
    );
  }

  /**
   * Gets viewport dimensions for rendering
   *
   * Uses explicit width/height from options if provided, otherwise the
   * container's measured size, falling back to DEFAULT_VIEWPORT when it is zero.
   *
   * @returns Width and height for SVG viewport
   */
  private getViewportDimensions(): { width: number; height: number } {
    const rect = this.container.getBoundingClientRect();

    return {
      width:
        this.options.width !== undefined
          ? this.options.width
          : rect.width || DEFAULT_VIEWPORT.width,
      height:
        this.options.height !== undefined
          ? this.options.height
          : rect.height || DEFAULT_VIEWPORT.height,
    };
  }

  /**
   * Re-renders the current score with current options
   *
   * Useful after changing options via setOptions()
   */
  refresh(): void {
    if (this.currentNotes.length > 0) {
      this.renderNotes(this.currentNotes);
    }
  }

  /**
   * Updates render options and optionally re-renders
   *
   * @param options - New options to merge with current options
   * @param autoRefresh - Whether to automatically re-render (default: true)
   */
  setOptions(options: RenderOptions, autoRefresh: boolean = true): void {
    this.givenOptions = { ...this.givenOptions, ...options };
    this.options = mergeWithDefaults(this.givenOptions);

    if (autoRefresh) {
      this.refresh();
    }
  }

  /**
   * Resizes the SVG viewport and re-renders
   *
   * @param width - New width
   * @param height - New height
   */
  resize(width: number, height: number): void {
    this.setOptions({ width, height }, true);
  }

  /**
   * Gets the current render options
   *
   * @returns Current options
   */
  getOptions(): ResolvedRenderOptions {
    return { ...this.options };
  }

  /**
   * Gets the current notes being rendered
   *
   * @returns Array of ShakuNote objects
   */
  getNotes(): ShakuNote[] {
    return [...this.currentNotes];
  }

  /**
   * Where each note of the last render was drawn, in the order of the notes
   *
   * @returns One NoteBox per note; index i is the score's note i
   */
  getNoteBoxes(): NoteBox[] {
    const { width, height } = noteCellSize(this.options);
    return this.currentNotes.map((note) => {
      const { x, y } = note.getPosition();
      const centerY = y - this.options.noteFontSize * GLYPH_INK_CENTER_RATIO;
      return {
        ...note.getBBox(),
        centerX: x,
        centerY,
        cell: { x: x - width / 2, y: centerY - height / 2, width, height },
      };
    });
  }

  /**
   * Gets the current score data (if loaded from URL or ScoreData)
   *
   * @returns ScoreData or null if rendering notes directly
   */
  getScoreData(): ScoreData | null {
    return this.currentScoreData;
  }

  /**
   * Clears the rendered score
   */
  clear(): void {
    this.container.innerHTML = '';
    this.currentNotes = [];
    this.currentScoreData = null;
  }

  /**
   * Sets up ResizeObserver to monitor container size changes
   * @private
   */
  private setupResizeObserver(): void {
    // Check if ResizeObserver is available (not available in some test environments)
    if (typeof ResizeObserver === 'undefined') {
      return;
    }

    this.resizeObserver = new ResizeObserver(() => {
      this.handleResize();
    });

    this.resizeObserver.observe(this.container);
  }

  /**
   * Handles resize events by triggering re-render
   * @private
   */
  private handleResize(): void {
    if (this.currentNotes.length > 0) {
      this.renderNotes(this.currentNotes);
    }
  }

  /**
   * Cleans up resources (ResizeObserver)
   * Call this when disposing of the ScoreRenderer
   */
  destroy(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }
}
