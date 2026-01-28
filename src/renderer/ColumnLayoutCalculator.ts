/**
 * ColumnLayoutCalculator - Calculates column layout and note positioning
 *
 * Separates layout calculation logic from rendering, following
 * Single Responsibility Principle. Extracts layout logic from
 * index.html to make it reusable and testable.
 */

import type { ShakuNote } from '../notes/ShakuNote';
import type { RenderOptions } from './RenderOptions';
import { DurationDotModifier } from '../modifiers/DurationDotModifier';

/**
 * Position of a note within a column
 */
export interface NotePosition {
  /** Index of note in original notes array */
  noteIndex: number;
  /** Y coordinate for this note */
  y: number;
}

/**
 * Information about a single column
 */
export interface ColumnInfo {
  /** Zero-based column index (0 = first/rightmost column) */
  columnIndex: number;
  /** X coordinate for this column's center */
  xPosition: number;
  /** Index of first note in this column (inclusive) */
  noteStartIndex: number;
  /** Index after last note in this column (exclusive) */
  noteEndIndex: number;
  /** Y positions for each note in this column */
  notePositions: NotePosition[];
}

/**
 * Complete layout information for multi-column score
 */
export interface ColumnLayout {
  /** Total number of columns needed */
  totalColumns: number;
  /** Starting X position (leftmost column center) */
  startX: number;
  /** Starting Y position (top margin) */
  startY: number;
  /** Width allocated for each column */
  columnWidth: number;
  /** Horizontal spacing between columns */
  columnSpacing: number;
  /** Information for each column */
  columns: ColumnInfo[];
}

/**
 * ColumnLayoutCalculator handles column layout and note positioning
 * calculations based on render options.
 *
 * Following "Separation of Concerns" - layout calculation is
 * separate from modifier configuration and rendering.
 */
export class ColumnLayoutCalculator {
  /**
   * Calculates complete column layout for a score
   *
   * This method:
   * 1. Determines how many columns are needed
   * 2. Calculates horizontal centering (startX)
   * 3. Calculates column positions (right-to-left layout)
   * 4. Calculates vertical positions for each note
   * 5. Handles extra spacing for duration dots
   *
   * @param notes - Array of ShakuNote objects to lay out
   * @param svgWidth - Width of SVG viewport
   * @param svgHeight - Height of SVG viewport
   * @param options - Render options specifying layout configuration
   * @returns Complete layout information
   */
  static calculateLayout(
    notes: ShakuNote[],
    svgWidth: number,
    svgHeight: number,
    options: Required<RenderOptions>
  ): ColumnLayout {
    // Extract layout parameters from options
    const columnWidth = options.columnWidth;
    const columnSpacing = options.columnSpacing;
    const notesPerColumn = options.notesPerColumn;
    const startY = options.topMargin;
    const verticalSpacing = options.noteVerticalSpacing;

    // Calculate number of columns needed
    const totalColumns = Math.ceil(notes.length / notesPerColumn);

    // Calculate starting X position (center the score horizontally)
    const actualTotalWidth =
      totalColumns * columnWidth + (totalColumns - 1) * columnSpacing;
    const startX = (svgWidth - actualTotalWidth) / 2 + columnWidth / 2;

    // Calculate layout for each column
    const columns: ColumnInfo[] = [];
    for (let col = 0; col < totalColumns; col++) {
      columns.push(
        this.calculateColumnLayout(
          col,
          totalColumns,
          startX,
          startY,
          columnWidth,
          columnSpacing,
          notesPerColumn,
          verticalSpacing,
          notes,
          options
        )
      );
    }

    return {
      totalColumns,
      startX,
      startY,
      columnWidth,
      columnSpacing,
      columns,
    };
  }

  /**
   * Calculates layout for a single column
   *
   * @param col - Zero-based column index
   * @param totalColumns - Total number of columns
   * @param startX - Starting X position (leftmost column)
   * @param startY - Starting Y position (top margin)
   * @param columnWidth - Width of each column
   * @param columnSpacing - Spacing between columns
   * @param notesPerColumn - Maximum notes per column
   * @param verticalSpacing - Vertical spacing between notes
   * @param notes - All notes in the score
   * @param options - Render options
   * @returns Column layout information
   */
  private static calculateColumnLayout(
    col: number,
    totalColumns: number,
    startX: number,
    startY: number,
    columnWidth: number,
    columnSpacing: number,
    notesPerColumn: number,
    verticalSpacing: number,
    notes: ShakuNote[],
    options: Required<RenderOptions>
  ): ColumnInfo {
    // Calculate column X position (reverse order: rightmost is first)
    const xPosition =
      startX + (totalColumns - 1 - col) * (columnWidth + columnSpacing);

    // Calculate note range for this column
    const noteStartIndex = col * notesPerColumn;
    const noteEndIndex = Math.min(noteStartIndex + notesPerColumn, notes.length);

    // Calculate Y positions for each note in this column
    const notePositions = this.calculateNotePositions(
      noteStartIndex,
      noteEndIndex,
      startY,
      verticalSpacing,
      notes,
      options
    );

    return {
      columnIndex: col,
      xPosition,
      noteStartIndex,
      noteEndIndex,
      notePositions,
    };
  }

  /**
   * Calculates Y positions for notes in a column
   *
   * @param startIndex - Index of first note (inclusive)
   * @param endIndex - Index after last note (exclusive)
   * @param startY - Starting Y position
   * @param verticalSpacing - Base vertical spacing between notes
   * @param notes - All notes in the score
   * @param options - Render options
   * @returns Array of note positions
   */
  private static calculateNotePositions(
    startIndex: number,
    endIndex: number,
    startY: number,
    verticalSpacing: number,
    notes: ShakuNote[],
    options: Required<RenderOptions>
  ): NotePosition[] {
    const positions: NotePosition[] = [];
    let currentY = startY;

    for (let i = startIndex; i < endIndex; i++) {
      const note = notes[i];

      // Record this note's position
      positions.push({
        noteIndex: i,
        y: currentY,
      });

      // Calculate spacing to next note
      // If this note has a duration dot, add extra spacing
      const hasDurationDot = note
        .getModifiers()
        .some((mod) => mod instanceof DurationDotModifier);

      const extraSpacing = hasDurationDot ? options.durationDotExtraSpacing : 0;
      currentY += verticalSpacing + extraSpacing;
    }

    return positions;
  }
}
