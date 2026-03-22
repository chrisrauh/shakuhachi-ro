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
    // Check if ResizeObserver is available (not available in some test environments)
    if (typeof ResizeObserver === 'undefined') {
      // Fallback for tests: render immediately
      this.render();
      return;
    }

    // Defer initial render until browser completes layout
    // At connectedCallback time, clientWidth/clientHeight are 0
    // ResizeObserver fires after layout, giving us correct dimensions
    let hasRendered = false;

    // Timeout fallback for environments where ResizeObserver doesn't fire
    // (e.g., some test environments, hidden containers)
    const timeoutId = window.setTimeout(() => {
      if (!hasRendered) {
        hasRendered = true;
        this.render();
      }
    }, 50);

    const observer = new ResizeObserver(() => {
      if (!hasRendered) {
        hasRendered = true;
        clearTimeout(timeoutId);
        this.render();
        observer.disconnect(); // Only needed for initial layout timing
      }
    });

    observer.observe(this);
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
  /**
   * Calculate intrinsic width for multi-column layout
   * @param columnCount - Number of columns to display
   * @returns Width in pixels needed to fit N columns
   */
  private calculateMultiColumnIntrinsicWidth(columnCount: number): number {
    const columnWidth = DEFAULT_RENDER_OPTIONS.columnWidth; // 100px
    const columnSpacing = DEFAULT_RENDER_OPTIONS.columnSpacing; // 35px
    const HORIZONTAL_PADDING = 20; // Safety margin per side

    // Total width = (N columns × width) + ((N-1) spacing) + padding
    const intrinsicWidth =
      columnCount * columnWidth +
      (columnCount - 1) * columnSpacing +
      HORIZONTAL_PADDING * 2;

    return intrinsicWidth;
  }

  /**
   * Calculate intrinsic height for multi-column layout
   * @param notes - All notes to be rendered
   * @param columnCount - Number of columns to distribute notes across
   * @returns Height in pixels needed for the TALLEST column
   *
   * Note: Different columns can have different heights if they contain
   * different numbers of duration-dotted notes (which add extra spacing).
   * We must calculate all columns and return the maximum height.
   */
  private calculateMultiColumnIntrinsicHeight(
    notes: ShakuNote[],
    columnCount: number,
  ): number {
    const notesPerColumn = Math.ceil(notes.length / columnCount);
    const topMargin = DEFAULT_RENDER_OPTIONS.topMargin; // 34px
    const verticalSpacing = DEFAULT_RENDER_OPTIONS.noteVerticalSpacing; // 44px
    const durationDotExtraSpacing =
      DEFAULT_RENDER_OPTIONS.durationDotExtraSpacing; // 12px
    const BOTTOM_PADDING = 20;

    let maxHeight = 0;

    // Calculate height for each column and find the tallest
    for (let col = 0; col < columnCount; col++) {
      let columnHeight = topMargin;

      // Notes for this column: from (col × notesPerColumn) to ((col + 1) × notesPerColumn)
      const startIdx = col * notesPerColumn;
      const endIdx = Math.min((col + 1) * notesPerColumn, notes.length);

      for (let i = startIdx; i < endIdx; i++) {
        const note = notes[i];
        const hasDurationDot = note
          .getModifiers()
          .some((mod) => mod instanceof DurationDotModifier);

        // Only add spacing between notes (not before first note)
        if (i > startIdx) {
          columnHeight += verticalSpacing;
        }
        if (hasDurationDot) {
          columnHeight += durationDotExtraSpacing;
        }
      }

      columnHeight += BOTTOM_PADDING;
      maxHeight = Math.max(maxHeight, columnHeight);
    }

    return maxHeight;
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
      let isExplicitColumnCount = false;
      let columnCount: number | undefined;
      let notesPerColumn: number | undefined;

      if (columns === 'auto') {
        // Auto mode: extrinsic sizing, auto-fit columns
        notesPerColumn = undefined; // Renderer will auto-calculate based on height
        isExplicitColumnCount = false;
      } else {
        // Explicit column count (1, 2, 3, 6, etc.): intrinsic sizing
        // All numeric values use the same algorithm
        notesPerColumn = Math.ceil(notes.length / columns);
        isExplicitColumnCount = true;
        columnCount = columns;
      }

      // Create container
      const container = document.createElement('div');
      container.className = 'shakuhachi-score-container';

      // Import Google Fonts stylesheet (includes all necessary unicode-range subsets)
      const fontImport = document.createElement('style');
      fontImport.textContent =
        '@import url("https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap");';

      // Create component styles
      const style = document.createElement('style');

      // For intrinsic sizing, set explicit width on :host to match SVG
      const hostWidth =
        isExplicitColumnCount && columnCount
          ? `width: ${this.calculateMultiColumnIntrinsicWidth(columnCount)}px;`
          : '';

      style.textContent = `
        :host {
          display: block;
          box-sizing: border-box;
          contain-intrinsic-size: 300px 150px;
          ${hostWidth}
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
      let width: number;
      let height: number;

      const widthAttr = this.getAttribute('width');
      const heightAttr = this.getAttribute('height');

      if (isExplicitColumnCount && columnCount) {
        // Intrinsic sizing for ALL numeric column values (1, 2, 3, 6, etc.)
        width = widthAttr
          ? parseInt(widthAttr)
          : this.calculateMultiColumnIntrinsicWidth(columnCount);

        height = heightAttr
          ? parseInt(heightAttr)
          : this.calculateMultiColumnIntrinsicHeight(notes, columnCount);
      } else {
        // Auto mode: extrinsic sizing
        width = widthAttr ? parseInt(widthAttr) : this.clientWidth;
        height = heightAttr ? parseInt(heightAttr) : this.clientHeight;

        // Defensive fallback
        if (width === 0 || height === 0) {
          width = width || 300;
          height = height || 150;
        }
      }

      // Build render options
      const renderOptions: any = {
        notesPerColumn,
        showDebugLabels: this.hasAttribute('debug'),
        autoResize: this.getAttribute('auto-resize') !== 'false',
        width,
        height,
        noteColor: 'var(--shakuhachi-note-color)',
        noteFontSize: DEFAULT_RENDER_OPTIONS.noteFontSize,
        noteFontWeight: DEFAULT_RENDER_OPTIONS.noteFontWeight,
        noteFontFamily: DEFAULT_RENDER_OPTIONS.noteFontFamily,
        noteVerticalSpacing: DEFAULT_RENDER_OPTIONS.noteVerticalSpacing,
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
