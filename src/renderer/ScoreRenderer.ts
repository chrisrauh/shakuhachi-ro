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
import { MusicXMLParser } from '../parser/MusicXMLParser';
import { ScoreParser } from '../parser/ScoreParser';
import { SVGRenderer } from './SVGRenderer';
import { ModifierConfigurator } from './ModifierConfigurator';
import { ColumnLayoutCalculator } from './ColumnLayoutCalculator';
import { mergeWithDefaults, type RenderOptions } from './RenderOptions';
import { OctaveMarksModifier } from '../modifiers/OctaveMarksModifier';
import { MeriKariModifier } from '../modifiers/MeriKariModifier';

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
  private options: Required<RenderOptions>;
  private renderer: SVGRenderer | null = null;
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
    this.options = mergeWithDefaults(options);

    // Set up ResizeObserver if autoResize is enabled
    if (this.options.autoResize) {
      this.setupResizeObserver();
    }
  }

  /**
   * Renders a score from a MusicXML URL
   *
   * @param url - URL to MusicXML file
   * @returns Promise that resolves when rendering is complete
   */
  async renderFromURL(url: string): Promise<void> {
    const scoreData = await MusicXMLParser.parseFromURL(url);
    this.currentScoreData = scoreData;
    await this.renderFromScoreData(scoreData);
  }

  /**
   * Renders a score from ScoreData object
   *
   * @param scoreData - Parsed score data
   */
  async renderFromScoreData(scoreData: ScoreData): Promise<void> {
    this.currentScoreData = scoreData;
    const notes = ScoreParser.parse(scoreData);
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
    const { width, height } = this.getViewportDimensions();
    this.renderer = new SVGRenderer(this.container, width, height);

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

        // Set note styling and position
        note.setFontSize(this.options.noteFontSize);
        note.setFontWeight(this.options.noteFontWeight);
        note.setPosition(x, y);
        note.render(this.renderer!);

        // Render debug label if enabled
        if (this.options.showDebugLabels) {
          this.renderDebugLabel(note, notePosition.noteIndex, x, y);
        }
      });
    });
  }

  /**
   * Renders a debug label for a note
   *
   * Shows note index, romanji, octave, and meri info
   *
   * @param note - ShakuNote to create label for
   * @param globalIndex - Global index of note in score
   * @param x - X position of note
   * @param y - Y position of note
   */
  private renderDebugLabel(
    note: ShakuNote,
    globalIndex: number,
    x: number,
    y: number,
  ): void {
    if (!this.renderer) return;

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

    this.renderer.drawText(
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
   * Uses explicit width/height from options if provided,
   * otherwise uses container dimensions
   *
   * @returns Width and height for SVG viewport
   */
  private getViewportDimensions(): { width: number; height: number } {
    if (this.options.width !== undefined && this.options.height !== undefined) {
      return {
        width: this.options.width,
        height: this.options.height,
      };
    }

    const rect = this.container.getBoundingClientRect();
    return {
      width: rect.width || 800,
      height: rect.height || 600,
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
    this.options = mergeWithDefaults({
      ...this.options,
      ...options,
    });

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
  getOptions(): Required<RenderOptions> {
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
    this.renderer = null;
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
