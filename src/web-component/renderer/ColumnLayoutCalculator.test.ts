/**
 * Unit tests for ColumnLayoutCalculator
 */

import { describe, it, expect } from 'vitest';
import { ColumnLayoutCalculator } from './ColumnLayoutCalculator';
import { ShakuNote } from '../notes/ShakuNote';
import { DurationDotModifier } from '../modifiers/DurationDotModifier';
import { OctaveMarksModifier } from '../modifiers/OctaveMarksModifier';
import { mergeWithDefaults } from './RenderOptions';

describe('ColumnLayoutCalculator', () => {
  describe('calculateLayout', () => {
    it('should calculate layout for single column', () => {
      const notes = [
        new ShakuNote({ symbol: 'ro' }),
        new ShakuNote({ symbol: 'tsu' }),
        new ShakuNote({ symbol: 'chi' }),
      ];

      const options = mergeWithDefaults({
        notesPerColumn: 10,
        columnWidth: 100,
        columnSpacing: 35,
        topMargin: 50,
        noteVerticalSpacing: 44,
      });

      const layout = ColumnLayoutCalculator.calculateLayout(
        notes,
        800,
        600,
        options,
      );

      // Should have 1 column
      expect(layout.totalColumns).toBe(1);
      expect(layout.columns.length).toBe(1);

      // Check first column
      const col = layout.columns[0];
      expect(col.columnIndex).toBe(0);
      expect(col.noteStartIndex).toBe(0);
      expect(col.noteEndIndex).toBe(3);
      expect(col.notePositions.length).toBe(3);
    });

    it('should calculate layout for multiple columns with height-based breaking', () => {
      // Create 25 notes
      // With topMargin=34, spacing=44, height=600:
      // Available: 566px, fits ~12 notes per column
      // Expected: 3 columns (12 + 12 + 1)
      const notes = Array.from(
        { length: 25 },
        () => new ShakuNote({ symbol: 'ro' }),
      );

      const options = mergeWithDefaults({
        columnWidth: 100,
        columnSpacing: 35,
      });

      const layout = ColumnLayoutCalculator.calculateLayout(
        notes,
        800,
        600,
        options,
      );

      // Should have 3 columns based on height
      expect(layout.totalColumns).toBe(3);
      expect(layout.columns.length).toBe(3);

      // Check column note ranges (approximately 12 notes per column)
      expect(layout.columns[0].noteStartIndex).toBe(0);
      expect(layout.columns[0].noteEndIndex).toBe(12);

      expect(layout.columns[1].noteStartIndex).toBe(12);
      expect(layout.columns[1].noteEndIndex).toBe(24);

      expect(layout.columns[2].noteStartIndex).toBe(24);
      expect(layout.columns[2].noteEndIndex).toBe(25);
    });

    it('should position columns right-to-left', () => {
      // With 15 notes, defaults (topMargin=34, spacing=44, height=600):
      // Should create 2 columns (12 + 3)
      const notes = Array.from(
        { length: 15 },
        () => new ShakuNote({ symbol: 'ro' }),
      );

      const options = mergeWithDefaults({
        columnWidth: 100,
        columnSpacing: 35,
      });

      const layout = ColumnLayoutCalculator.calculateLayout(
        notes,
        800,
        600,
        options,
      );

      // 2 columns needed
      expect(layout.totalColumns).toBe(2);

      // First column (index 0) should be rightmost
      // Second column (index 1) should be leftmost
      const col0 = layout.columns[0];
      const col1 = layout.columns[1];

      // Column 1 should be to the left of column 0
      expect(col1.xPosition).toBeLessThan(col0.xPosition);

      // Distance between columns should equal columnWidth + columnSpacing
      const distance = col0.xPosition - col1.xPosition;
      expect(distance).toBe(options.columnWidth + options.columnSpacing);
    });

    it('should center columns horizontally', () => {
      const notes = Array.from(
        { length: 5 },
        () => new ShakuNote({ symbol: 'ro' }),
      );

      const svgWidth = 800;
      const options = mergeWithDefaults({
        columnWidth: 100,
        columnSpacing: 35,
      });

      const layout = ColumnLayoutCalculator.calculateLayout(
        notes,
        svgWidth,
        600,
        options,
      );

      // Single column: should be centered
      // actualTotalWidth = 1 * 100 + 0 * 35 = 100
      // startX = (800 - 100) / 2 + 100 / 2 = 350 + 50 = 400
      expect(layout.startX).toBe(400);
      expect(layout.columns[0].xPosition).toBe(400);
    });

    it('should calculate note Y positions with vertical spacing', () => {
      const notes = [
        new ShakuNote({ symbol: 'ro' }),
        new ShakuNote({ symbol: 'tsu' }),
        new ShakuNote({ symbol: 'chi' }),
      ];

      const options = mergeWithDefaults({
        topMargin: 50,
        noteVerticalSpacing: 44,
      });

      const layout = ColumnLayoutCalculator.calculateLayout(
        notes,
        800,
        600,
        options,
      );

      const positions = layout.columns[0].notePositions;

      // First note at startY
      expect(positions[0].y).toBe(50);

      // Second note at startY + verticalSpacing
      expect(positions[1].y).toBe(50 + 44);

      // Third note at startY + 2 * verticalSpacing
      expect(positions[2].y).toBe(50 + 88);
    });

    it('should add extra spacing for notes with duration dots', () => {
      const note1 = new ShakuNote({ symbol: 'ro' });
      const note2 = new ShakuNote({ symbol: 'tsu' });
      note2.addModifier(new DurationDotModifier()); // Add duration dot
      const note3 = new ShakuNote({ symbol: 'chi' });

      const notes = [note1, note2, note3];

      const options = mergeWithDefaults({
        topMargin: 50,
        noteVerticalSpacing: 44,
        durationDotExtraSpacing: 12,
      });

      const layout = ColumnLayoutCalculator.calculateLayout(
        notes,
        800,
        600,
        options,
      );

      const positions = layout.columns[0].notePositions;

      // First note at startY
      expect(positions[0].y).toBe(50);

      // Second note at startY + verticalSpacing
      expect(positions[1].y).toBe(50 + 44);

      // Third note has extra spacing because note2 has duration dot
      // y = 50 + 44 + (44 + 12) = 150
      expect(positions[2].y).toBe(50 + 44 + 44 + 12);
    });

    it('should handle notes that exactly fill columns', () => {
      // With defaults (topMargin=34, spacing=44, height=600), 12 notes fit per column
      // Create exactly 24 notes (2 full columns)
      const notes = Array.from(
        { length: 24 },
        () => new ShakuNote({ symbol: 'ro' }),
      );

      const options = mergeWithDefaults({});

      const layout = ColumnLayoutCalculator.calculateLayout(
        notes,
        800,
        600,
        options,
      );

      // Should have exactly 2 columns
      expect(layout.totalColumns).toBe(2);
      expect(layout.columns.length).toBe(2);

      // Each column should have 12 notes
      expect(
        layout.columns[0].noteEndIndex - layout.columns[0].noteStartIndex,
      ).toBe(12);
      expect(
        layout.columns[1].noteEndIndex - layout.columns[1].noteStartIndex,
      ).toBe(12);
    });

    it('should handle single note', () => {
      const notes = [new ShakuNote({ symbol: 'ro' })];

      const options = mergeWithDefaults({
        topMargin: 50,
      });

      const layout = ColumnLayoutCalculator.calculateLayout(
        notes,
        800,
        600,
        options,
      );

      expect(layout.totalColumns).toBe(1);
      expect(layout.columns[0].notePositions.length).toBe(1);
      expect(layout.columns[0].notePositions[0].noteIndex).toBe(0);
      expect(layout.columns[0].notePositions[0].y).toBe(50);
    });

    it('should handle empty notes array', () => {
      const notes: ShakuNote[] = [];

      const options = mergeWithDefaults({});

      const layout = ColumnLayoutCalculator.calculateLayout(
        notes,
        800,
        600,
        options,
      );

      // No notes = 0 columns
      expect(layout.totalColumns).toBe(0);
      expect(layout.columns.length).toBe(0);
    });

    it('should preserve noteIndex in positions', () => {
      // With defaults, 12 notes per column. 15 notes = 2 columns (12 + 3)
      const notes = Array.from(
        { length: 15 },
        () => new ShakuNote({ symbol: 'ro' }),
      );

      const options = mergeWithDefaults({});

      const layout = ColumnLayoutCalculator.calculateLayout(
        notes,
        800,
        600,
        options,
      );

      // First column: notes 0-11
      const col0Positions = layout.columns[0].notePositions;
      expect(col0Positions[0].noteIndex).toBe(0);
      expect(col0Positions[11].noteIndex).toBe(11);

      // Second column: notes 12-14
      const col1Positions = layout.columns[1].notePositions;
      expect(col1Positions[0].noteIndex).toBe(12);
      expect(col1Positions[2].noteIndex).toBe(14);
    });

    it('should use custom column width and spacing', () => {
      // With defaults, 12 notes per column. 24 notes = 2 columns
      const notes = Array.from(
        { length: 24 },
        () => new ShakuNote({ symbol: 'ro' }),
      );

      const options = mergeWithDefaults({
        columnWidth: 150,
        columnSpacing: 50,
      });

      const layout = ColumnLayoutCalculator.calculateLayout(
        notes,
        1000,
        600,
        options,
      );

      expect(layout.columnWidth).toBe(150);
      expect(layout.columnSpacing).toBe(50);

      // Distance between columns should be 150 + 50 = 200
      const distance =
        layout.columns[0].xPosition - layout.columns[1].xPosition;
      expect(distance).toBe(200);
    });

    it('should handle different viewport widths', () => {
      const notes = Array.from(
        { length: 5 },
        () => new ShakuNote({ symbol: 'ro' }),
      );

      const options = mergeWithDefaults({
        columnWidth: 100,
        columnSpacing: 35,
      });

      // Narrow viewport
      const layout1 = ColumnLayoutCalculator.calculateLayout(
        notes,
        400,
        600,
        options,
      );

      // Wide viewport
      const layout2 = ColumnLayoutCalculator.calculateLayout(
        notes,
        1200,
        600,
        options,
      );

      // Both should have same number of columns (height is same)
      expect(layout1.totalColumns).toBe(layout2.totalColumns);

      // But different startX (centering)
      expect(layout1.startX).toBeLessThan(layout2.startX);
    });

    it('should handle notes with mixed modifiers', () => {
      const note1 = new ShakuNote({ symbol: 'ro' });
      note1.addModifier(new OctaveMarksModifier('kan'));

      const note2 = new ShakuNote({ symbol: 'tsu' });
      note2.addModifier(new DurationDotModifier());

      const note3 = new ShakuNote({ symbol: 'chi' });
      note3.addModifier(new OctaveMarksModifier('otsu'));
      note3.addModifier(new DurationDotModifier());

      const notes = [note1, note2, note3];

      const options = mergeWithDefaults({
        topMargin: 50,
        noteVerticalSpacing: 44,
        durationDotExtraSpacing: 12,
      });

      const layout = ColumnLayoutCalculator.calculateLayout(
        notes,
        800,
        600,
        options,
      );

      const positions = layout.columns[0].notePositions;

      // Note1: no duration dot, no extra spacing
      expect(positions[0].y).toBe(50);

      // Note2: has duration dot, extra spacing added after
      expect(positions[1].y).toBe(50 + 44);

      // Note3: positioned after note2's extra spacing
      expect(positions[2].y).toBe(50 + 44 + 44 + 12);
    });

    it('should calculate column count based on available height', () => {
      const testCases = [
        { noteCount: 1, svgHeight: 600, expectedColumns: 1 },
        { noteCount: 12, svgHeight: 600, expectedColumns: 1 }, // Exactly fits
        { noteCount: 13, svgHeight: 600, expectedColumns: 2 }, // Needs 2nd column
        { noteCount: 24, svgHeight: 600, expectedColumns: 2 }, // Exactly 2 columns
        { noteCount: 25, svgHeight: 600, expectedColumns: 3 }, // Needs 3rd column
        { noteCount: 10, svgHeight: 300, expectedColumns: 2 }, // Shorter height = more columns
        { noteCount: 10, svgHeight: 1000, expectedColumns: 1 }, // Taller height = fewer columns
      ];

      testCases.forEach(({ noteCount, svgHeight, expectedColumns }) => {
        const notes = Array.from(
          { length: noteCount },
          () => new ShakuNote({ symbol: 'ro' }),
        );

        const options = mergeWithDefaults({});

        const layout = ColumnLayoutCalculator.calculateLayout(
          notes,
          800,
          svgHeight,
          options,
        );

        expect(layout.totalColumns).toBe(expectedColumns);
      });
    });

    it('should handle large number of columns', () => {
      // 100 notes with default height (600px, ~12 notes/column) = ~9 columns
      const notes = Array.from(
        { length: 100 },
        () => new ShakuNote({ symbol: 'ro' }),
      );

      const options = mergeWithDefaults({
        columnWidth: 100,
        columnSpacing: 35,
      });

      const layout = ColumnLayoutCalculator.calculateLayout(
        notes,
        2000,
        600,
        options,
      );

      // Should have 9 columns (100/12 ≈ 8.33, rounded up)
      expect(layout.totalColumns).toBe(9);
      expect(layout.columns.length).toBe(9);

      // Last column should have remaining notes (100 - 8*12 = 4)
      const lastColumn = layout.columns[8];
      expect(lastColumn.noteEndIndex - lastColumn.noteStartIndex).toBe(4);
    });
  });
});
