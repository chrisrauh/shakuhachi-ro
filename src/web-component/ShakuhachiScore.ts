/**
 * Web Component for embeddable shakuhachi score rendering
 *
 * Usage:
 *   <script src="/embed/shakuhachi-score.js"></script>
 *   <shakuhachi-score data-score='{"title":"...","notes":[...]}'></shakuhachi-score>
 *
 * Features:
 *   - Automatic intrinsic sizing (no manual width/height needed)
 *   - Theme support via CSS custom properties
 *   - Shadow DOM for style isolation
 *   - Error handling with visible feedback
 *
 * CSS Custom Properties:
 *   --shakuhachi-note-color: Color of notes and lines (default: #000)
 *   --shakuhachi-note-font-size: Font size of notes (default: 28px)
 *   --shakuhachi-note-font-weight: Font weight of notes (default: 400)
 *   --shakuhachi-note-font-family: Font family (default: 'Noto Sans JP', sans-serif)
 *   --shakuhachi-note-vertical-spacing: Vertical spacing between notes (default: 44px)
 */

import { ScoreRenderer } from './renderer/ScoreRenderer';
import { ScoreParser } from './parser/ScoreParser';
import { DEFAULT_RENDER_OPTIONS } from './renderer/RenderOptions';
import type { ScoreData } from './types/ScoreData';
import type { ShakuNote } from './notes/ShakuNote';
import { DurationDotModifier } from './modifiers/DurationDotModifier';
import type { Modifier } from './modifiers/Modifier';

class ShakuhachiScore extends HTMLElement {
  private renderer: ScoreRenderer | null = null;
  private shadow: ShadowRoot;

  static get observedAttributes() {
    return ['data-score', 'columns', 'auto-resize'];
  }

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback(
    _name: string,
    oldValue: string | null,
    newValue: string | null,
  ) {
    // Only re-render if the element is connected and the value actually changed
    if (this.isConnected && oldValue !== newValue) {
      this.render();
    }
  }

  disconnectedCallback() {
    if (this.renderer) {
      this.renderer.destroy();
      this.renderer = null;
    }
  }

  /**
   * Public method to force re-render (useful for theme changes)
   */
  public forceRender() {
    this.render();
  }

  /**
   * Parse score data from data-score attribute or textContent
   * Priority: data-score attribute > textContent
   * Returns null if no data is available (not an error - component may not be ready yet)
   */
  private parseScoreData(): ScoreData | null {
    // Try data-score attribute first
    const dataScore = this.getAttribute('data-score');
    if (dataScore) {
      try {
        return JSON.parse(dataScore);
      } catch (error) {
        throw new Error(
          `Invalid JSON in data-score attribute: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    }

    // Fallback to textContent
    const content = this.textContent?.trim();
    if (content) {
      try {
        return JSON.parse(content);
      } catch (error) {
        throw new Error(
          `Invalid JSON in textContent: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    }

    // No data available yet - not an error, component may still be initializing
    return null;
  }

  /**
   * Parse columns attribute
   * Returns 'auto' for auto-detection or a positive number for explicit column count
   */
  private parseColumnsAttribute(): 'auto' | number {
    const columnsAttr = this.getAttribute('columns');

    // Default to auto when no attribute present
    if (!columnsAttr) {
      return 'auto';
    }

    // Parse columns value
    if (columnsAttr === 'auto') return 'auto';

    const num = parseInt(columnsAttr);
    if (!isNaN(num) && num > 0) {
      return num;
    }

    console.warn(
      `shakuhachi-score: invalid columns value "${columnsAttr}". ` +
        'Use "auto" or a positive number. Defaulting to "auto".',
    );
    return 'auto';
  }

  /**
   * Calculate intrinsic width based on note modifiers
   * Algorithm ensures all modifiers (meri, octave) are visible without clipping
   *
   * Note: This is available via the `intrinsic-width` attribute but not used by default
   * for single-column mode (which uses container width for better layout flexibility)
   *
   * Calculation:
   *   - Meri marks extend left: offsetX = -22px, width ≈ 13px → ~35px extent
   *   - Octave marks extend right: offsetX = 18px, width ≈ 10px → ~28px extent
   *   - Note width: fontSize * 0.8 ≈ 22px (Japanese characters)
   *   - Horizontal padding: 20px total (10px each side)
   *
   * Total: maxLeftExtent + noteWidth + maxRightExtent + padding
   *        = ~35px + 22px + 28px + 20px = ~105px (when both modifiers present)
   *        = ~62px (minimal, no modifiers)
   */
  private calculateIntrinsicWidth(notes: ShakuNote[]): number {
    let maxLeftExtent = 0; // Furthest left any modifier extends
    let maxRightExtent = 0; // Furthest right any modifier extends

    // Scan all notes for modifiers
    notes.forEach((note) => {
      const modifiers = note.getModifiers();

      // Meri/Kari marks (left of note)
      // offsetX = -22px, fontSize = 14px, width ≈ 13px (fontSize * 0.8 + margin)
      const meriMod = modifiers.find(
        (m: Modifier) => m.constructor.name === 'MeriKariModifier',
      );
      if (meriMod) {
        const extent = 22 + 13; // abs(offsetX) + width
        maxLeftExtent = Math.max(maxLeftExtent, extent); // ~35px
      }

      // Octave marks (right/above note)
      // offsetX = 18px, fontSize = 12px, width ≈ 10px (fontSize * 0.8)
      const octaveMod = modifiers.find(
        (m: Modifier) => m.constructor.name === 'OctaveMarksModifier',
      );
      if (octaveMod) {
        const extent = 18 + 10; // offsetX + width
        maxRightExtent = Math.max(maxRightExtent, extent); // ~28px
      }
    });

    // Base note width (Japanese characters are roughly 0.8 * fontSize)
    const noteFontSize = DEFAULT_RENDER_OPTIONS.noteFontSize; // 28px
    const noteWidth = noteFontSize * 0.8; // ~22px

    // Total width with safety padding
    const HORIZONTAL_PADDING = 10; // Safety margin per side
    const intrinsicWidth =
      maxLeftExtent + // ~35px (if meri present), 0 otherwise
      noteWidth + // ~22px
      maxRightExtent + // ~28px (if octave present), 0 otherwise
      HORIZONTAL_PADDING * 2; // 20px

    return Math.ceil(intrinsicWidth); // ~62-105px depending on modifiers
  }

  /**
   * Calculate intrinsic height using single-column logic
   * Matches ScoreRenderer.calculateSingleColumnHeight() algorithm
   *
   * Calculation:
   *   - Start with topMargin (34px)
   *   - For each note: add noteVerticalSpacing (44px)
   *   - If note has duration dot: add durationDotExtraSpacing (12px)
   *   - Add bottom padding (20px) for last note's modifiers
   */
  private calculateIntrinsicHeight(notes: ShakuNote[]): number {
    let height = DEFAULT_RENDER_OPTIONS.topMargin; // 34px

    notes.forEach((note) => {
      const hasDurationDot = note
        .getModifiers()
        .some((mod) => mod instanceof DurationDotModifier);

      const noteHeight =
        DEFAULT_RENDER_OPTIONS.noteVerticalSpacing +
        (hasDurationDot ? DEFAULT_RENDER_OPTIONS.durationDotExtraSpacing : 0);

      height += noteHeight;
    });

    height += 20; // Bottom padding

    // Allow attribute override
    const heightAttr = this.getAttribute('height');
    if (heightAttr) {
      return parseInt(heightAttr);
    }

    return height;
  }

  /**
   * Read CSS custom properties for theming
   * Falls back to defaults if not specified
   */
  private getThemeOptions(): {
    noteColor: string;
    noteFontSize: number;
    noteFontWeight: number;
    noteFontFamily: string;
    noteVerticalSpacing: number;
  } {
    const computedStyle = getComputedStyle(this);

    return {
      noteColor:
        computedStyle.getPropertyValue('--shakuhachi-note-color').trim() ||
        '#000',
      noteFontSize:
        parseInt(
          computedStyle.getPropertyValue('--shakuhachi-note-font-size'),
        ) || 28,
      noteFontWeight:
        parseInt(
          computedStyle.getPropertyValue('--shakuhachi-note-font-weight'),
        ) || 400,
      noteFontFamily:
        computedStyle
          .getPropertyValue('--shakuhachi-note-font-family')
          .trim() || 'Noto Sans JP, sans-serif',
      noteVerticalSpacing:
        parseInt(
          computedStyle.getPropertyValue('--shakuhachi-note-vertical-spacing'),
        ) || 44,
    };
  }

  /**
   * Render the shakuhachi score
   * Creates shadow DOM with styles and ScoreRenderer instance
   */
  private render() {
    try {
      const scoreData = this.parseScoreData();

      // No data available yet - wait for attribute to be set
      if (!scoreData) {
        return;
      }

      // Parse notes to calculate dimensions
      const notes = ScoreParser.parse(scoreData);
      const columns = this.parseColumnsAttribute();

      // Determine layout mode
      let isSingleColumn: boolean;
      let notesPerColumn: number | undefined;

      if (columns === 'auto') {
        // Auto mode: multi-column layout, let renderer calculate based on dimensions
        isSingleColumn = false;
        notesPerColumn = undefined; // Renderer will auto-calculate
      } else if (columns === 1) {
        // Single column: all notes, intrinsic height
        isSingleColumn = true;
        notesPerColumn = undefined;
      } else {
        // Explicit column count: multi-column with distribution
        isSingleColumn = false;
        notesPerColumn = Math.ceil(notes.length / columns);
      }

      // Get theme options
      const themeOptions = this.getThemeOptions();

      // Create container
      const container = document.createElement('div');
      container.className = 'shakuhachi-score-container';

      // Import Google Fonts stylesheet (includes all necessary unicode-range subsets)
      const fontImport = document.createElement('style');
      fontImport.textContent =
        '@import url("https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap");';

      // Create component styles
      const style = document.createElement('style');
      style.textContent = `
        :host {
          display: block;
          box-sizing: border-box;
          contain-intrinsic-size: 300px 150px;
          --shakuhachi-note-color: #000;
          --shakuhachi-note-font-size: 28px;
          --shakuhachi-note-font-weight: 400;
          --shakuhachi-note-font-family: 'Noto Sans JP', sans-serif;
          --shakuhachi-note-vertical-spacing: 44px;
        }
        .shakuhachi-score-container {
          overflow: visible;
          width: 100%;
          height: 100%;
        }
      `;

      this.shadow.innerHTML = '';
      this.shadow.appendChild(fontImport);
      this.shadow.appendChild(style);
      this.shadow.appendChild(container);

      // Calculate dimensions
      let width: number | undefined;
      let height: number | undefined;

      if (isSingleColumn) {
        // Single column: calculate intrinsic height from content
        height = this.calculateIntrinsicHeight(notes);

        // Width from attribute or auto-detect
        const widthAttr = this.getAttribute('width');
        if (widthAttr) {
          width = parseInt(widthAttr);
        } else if (this.hasAttribute('intrinsic-width')) {
          width = this.calculateIntrinsicWidth(notes);
        } else {
          const rect = this.getBoundingClientRect();
          width = rect.width > 0 ? rect.width : 300;
        }
      } else {
        // Multi-column: use host dimensions from parent
        const widthAttr = this.getAttribute('width');
        const heightAttr = this.getAttribute('height');

        // Use explicit attributes if provided, otherwise read from element
        width = widthAttr ? parseInt(widthAttr) : this.clientWidth || 300;
        height = heightAttr ? parseInt(heightAttr) : this.clientHeight || 150;
      }

      // Build render options
      const renderOptions: any = {
        singleColumn: isSingleColumn,
        notesPerColumn,
        showDebugLabels: this.hasAttribute('debug'),
        autoResize: this.getAttribute('auto-resize') !== 'false',
        width,
        height,
        ...themeOptions,
      };

      // Render using ScoreRenderer
      this.renderer = new ScoreRenderer(container, renderOptions);

      this.renderer.renderFromScoreData(scoreData);
    } catch (error) {
      this.renderError(error as Error);
    }
  }

  /**
   * Render error message
   * Following VexTab pattern: visible error + console logging
   */
  private renderError(error: Error) {
    const errorDiv = document.createElement('div');
    errorDiv.textContent = `Error: ${error.message}`;
    errorDiv.style.cssText =
      'color: #ef4444; font-family: system-ui; font-size: 14px;';

    this.shadow.innerHTML = '';
    this.shadow.appendChild(errorDiv);

    // Always log full error for debugging
    console.error('shakuhachi-score rendering error:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Register custom element
customElements.define('shakuhachi-score', ShakuhachiScore);

export { ShakuhachiScore };
