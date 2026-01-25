/**
 * VerticalSystem - Handles vertical layout and multi-column arrangement
 *
 * Traditional shakuhachi notation is written vertically (top to bottom)
 * and read right to left. This class transforms horizontal formatted notes
 * into vertical columns following traditional conventions.
 *
 * Inspired by VexFlow's System architecture - uses SVG groups and transforms.
 */

import type { SVGRenderer } from './SVGRenderer';
import type { ShakuNote } from '../notes/ShakuNote';
import { Formatter, type FormatterOptions } from './Formatter';

/**
 * Options for vertical system rendering
 */
export interface VerticalSystemOptions {
  /** X position for the system (default: 100) */
  x?: number;

  /** Y position for the system (default: 50) */
  y?: number;

  /** Height of each vertical column (default: 500) */
  columnHeight?: number;

  /** Width between columns (default: 80) */
  columnSpacing?: number;

  /** Maximum notes per column (default: 20) */
  notesPerColumn?: number;

  /** Formatter options for horizontal spacing before rotation */
  formatterOptions?: FormatterOptions;
}

/**
 * VerticalSystem - renders notes in vertical columns (traditional shakuhachi layout)
 */
export class VerticalSystem {
  private x: number;
  private y: number;
  private columnHeight: number;
  private columnSpacing: number;
  private notesPerColumn: number;
  private formatter: Formatter;

  /**
   * Creates a new vertical system
   */
  constructor(options: VerticalSystemOptions = {}) {
    this.x = options.x ?? 100;
    this.y = options.y ?? 50;
    this.columnHeight = options.columnHeight ?? 500;
    this.columnSpacing = options.columnSpacing ?? 80;
    this.notesPerColumn = options.notesPerColumn ?? 20;

    // Create formatter for horizontal spacing before rotation
    this.formatter = new Formatter(options.formatterOptions);
  }

  /**
   * Renders notes in a single vertical column
   *
   * @param notes - Array of ShakuNote objects
   * @param renderer - SVGRenderer instance
   * @param columnX - X position for this column
   * @returns The SVG group element containing the column
   */
  renderColumn(
    notes: ShakuNote[],
    renderer: SVGRenderer,
    columnX: number = this.x
  ): SVGGElement {
    // Create a group for this column
    const columnGroup = renderer.openGroup('shaku-column');

    // Format notes horizontally first (this will be rotated to vertical)
    this.formatter.format(notes, 0, 0);

    // Render all notes in the group
    notes.forEach(note => note.render(renderer));

    // Close the group
    renderer.closeGroup();

    // Apply rotation transform to make it vertical
    // Rotate -90 degrees around origin, then translate to final position
    const transform = `translate(${columnX}, ${this.y}) rotate(-90)`;
    columnGroup.setAttribute('transform', transform);

    return columnGroup;
  }

  /**
   * Renders notes in multiple columns (right-to-left layout)
   *
   * @param notes - Array of all ShakuNote objects
   * @param renderer - SVGRenderer instance
   * @returns Array of SVG group elements (one per column)
   */
  renderColumns(notes: ShakuNote[], renderer: SVGRenderer): SVGGElement[] {
    if (notes.length === 0) {
      return [];
    }

    // Split notes into columns
    const columns: ShakuNote[][] = [];
    for (let i = 0; i < notes.length; i += this.notesPerColumn) {
      columns.push(notes.slice(i, i + this.notesPerColumn));
    }

    // Calculate starting X position (rightmost column)
    // For right-to-left layout, we start from the right
    const startX = this.x + (columns.length - 1) * this.columnSpacing;

    // Render columns from right to left
    const columnGroups: SVGGElement[] = [];
    columns.forEach((columnNotes, index) => {
      // Calculate X position (moving left as index increases)
      const columnX = startX - (index * this.columnSpacing);

      const group = this.renderColumn(columnNotes, renderer, columnX);
      columnGroups.push(group);
    });

    return columnGroups;
  }

  /**
   * Renders a single vertical column at a specific position (no multi-column logic)
   *
   * @param notes - Array of ShakuNote objects for this column
   * @param renderer - SVGRenderer instance
   * @param x - X position
   * @param y - Y position (optional, uses system default)
   * @returns The SVG group element
   */
  renderSingleColumn(
    notes: ShakuNote[],
    renderer: SVGRenderer,
    x: number,
    y?: number
  ): SVGGElement {
    const columnGroup = renderer.openGroup('shaku-column-single');

    // Format horizontally
    this.formatter.format(notes, 0, 0);

    // Render notes
    notes.forEach(note => note.render(renderer));

    renderer.closeGroup();

    // Transform: rotate and position
    const posY = y ?? this.y;
    const transform = `translate(${x}, ${posY}) rotate(-90)`;
    columnGroup.setAttribute('transform', transform);

    return columnGroup;
  }

  /**
   * Sets the column height
   */
  setColumnHeight(height: number): this {
    this.columnHeight = height;
    return this;
  }

  /**
   * Sets the column spacing
   */
  setColumnSpacing(spacing: number): this {
    this.columnSpacing = spacing;
    return this;
  }

  /**
   * Sets the notes per column
   */
  setNotesPerColumn(count: number): this {
    this.notesPerColumn = count;
    return this;
  }

  /**
   * Gets the column height
   */
  getColumnHeight(): number {
    return this.columnHeight;
  }

  /**
   * Gets the column spacing
   */
  getColumnSpacing(): number {
    return this.columnSpacing;
  }

  /**
   * Gets the notes per column
   */
  getNotesPerColumn(): number {
    return this.notesPerColumn;
  }

  /**
   * Gets the formatter used by this system
   */
  getFormatter(): Formatter {
    return this.formatter;
  }
}
