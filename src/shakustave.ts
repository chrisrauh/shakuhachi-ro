// [VexFlow](https://vexflow.com) - Copyright (c) Mohit Muthanna 2010.
// MIT License
//
// ShakuStave - A stave for shakuhachi notation (no staff lines)

import { Stave, StaveOptions } from './stave';

export interface ShakuStaveOptions extends StaveOptions {
  /** Whether to draw a bounding box (top and bottom lines with left/right borders) */
  bounded?: boolean;
}

/**
 * ShakuStave - A specialized stave for shakuhachi notation
 *
 * Unlike traditional Western music notation, shakuhachi notation doesn't use
 * the full five staff lines. This class extends Stave to support two styles:
 *
 * 1. **Blank style** (default): No visible lines or borders - just horizontal space
 * 2. **Bounded style**: Top and bottom lines with left/right borders creating a box
 *
 * @example
 * ```typescript
 * // Blank style (no lines)
 * const shakuStave = new ShakuStave(10, 40, 750);
 *
 * // Bounded style (box with top/bottom lines and borders)
 * const shakuStave = new ShakuStave(10, 40, 750, { bounded: true });
 *
 * shakuStave.setContext(context).draw();
 * ```
 */
export class ShakuStave extends Stave {
  private isBounded: boolean;

  /**
   * Create a new ShakuStave
   * @param x - X position of the stave
   * @param y - Y position of the stave
   * @param width - Width of the stave
   * @param options - Optional stave configuration
   */
  constructor(x: number, y: number, width: number, options?: ShakuStaveOptions) {
    const isBounded = options?.bounded ?? false;

    // Configure based on bounded style
    // For both styles, we keep 1 line at the center for note positioning
    const shakuOptions: StaveOptions = {
      ...options,
      num_lines: 1, // Always 1 center line for positioning
      left_bar: isBounded, // Show bars only if bounded
      right_bar: isBounded,
      spacing_between_lines_px: 20, // Height above/below the center line
      line_config: [{ visible: false }], // Center line is always invisible
    };

    super(x, y, width, shakuOptions);

    this.isBounded = isBounded;
  }

  /**
   * Override draw to handle both bounded and blank styles
   */
  draw(): this {
    const ctx = this.checkContext();
    this.setRendered();

    this.applyStyle();
    ctx.openGroup('shakustave', this.getAttribute('id'));
    if (!this.formatted) this.format();

    // For bounded style, draw the top and bottom lines
    if (this.isBounded) {
      const centerY = this.getYForLine(0);
      const boxHeight = this.options.spacing_between_lines_px * 2; // Total height of the box
      const topY = centerY - this.options.spacing_between_lines_px;
      const bottomY = centerY + this.options.spacing_between_lines_px;
      const x = this.x;
      const width = this.width;

      // Draw top line
      ctx.beginPath();
      ctx.moveTo(x, topY);
      ctx.lineTo(x + width, topY);
      ctx.stroke();

      // Draw bottom line
      ctx.beginPath();
      ctx.moveTo(x, bottomY);
      ctx.lineTo(x + width, bottomY);
      ctx.stroke();
    }
    // For blank style, don't draw any lines

    ctx.closeGroup();
    this.restoreStyle();

    // Draw the modifiers (including left/right bars for bounded style)
    for (let i = 0; i < this.modifiers.length; i++) {
      const modifier = this.modifiers[i];
      if (typeof modifier.draw === 'function') {
        modifier.applyStyle(ctx);
        modifier.draw(this, this.getModifierXShift(i));
        modifier.restoreStyle(ctx);
      }
    }

    // Don't draw measure numbers for shakuhachi notation

    return this;
  }

  /**
   * Get the vertical center position of this stave
   * This is where shakuhachi notes should be positioned
   */
  getYForCenter(): number {
    // Both styles use the center line (line 0) for positioning
    return this.getYForLine(0);
  }
}

