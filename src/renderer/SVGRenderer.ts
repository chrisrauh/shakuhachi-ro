/**
 * SVGRenderer - Core SVG rendering context for shakuhachi notation
 *
 * Inspired by VexFlow's SVGContext architecture, this provides a clean API
 * for drawing primitives, managing groups, and applying transformations.
 */

const SVG_NS = 'http://www.w3.org/2000/svg';

interface Point {
  x: number;
  y: number;
}

export class SVGRenderer {
  private element: HTMLElement;
  private svg: SVGSVGElement;
  private width: number;
  private height: number;
  private groups: SVGGElement[] = [];
  private currentParent: SVGElement;

  /**
   * Creates a new SVG renderer
   * @param element - DOM element to append SVG to
   * @param width - SVG width
   * @param height - SVG height
   */
  constructor(element: HTMLElement, width: number = 800, height: number = 600) {
    this.element = element;
    this.width = width;
    this.height = height;

    // Create SVG element using proper namespace (VexFlow pattern)
    this.svg = document.createElementNS(SVG_NS, 'svg') as SVGSVGElement;
    this.svg.setAttribute('width', String(width));
    this.svg.setAttribute('height', String(height));
    this.svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

    // Set initial parent to root SVG
    this.currentParent = this.svg;

    // Append to container
    element.appendChild(this.svg);
  }

  /**
   * Rounds number to 3 decimal places (VexFlow precision standard)
   */
  private round(value: number): number {
    return +value.toFixed(3);
  }

  /**
   * Creates an SVG element with proper namespace
   */
  private create<K extends keyof SVGElementTagNameMap>(
    tagName: K
  ): SVGElementTagNameMap[K] {
    return document.createElementNS(SVG_NS, tagName);
  }

  /**
   * Adds an element to the current parent (group or root SVG)
   */
  private add(element: SVGElement): void {
    this.currentParent.appendChild(element);
  }

  /**
   * Draws text at the specified position
   * @param text - Text to render
   * @param x - X coordinate
   * @param y - Y coordinate
   * @param fontSize - Font size in pixels (default: 24)
   * @param fontFamily - Font family (default: 'Noto Sans JP, sans-serif')
   * @param fill - Fill color (default: '#000')
   * @param textAnchor - Text anchor (default: 'middle')
   * @param fontWeight - Font weight (default: 400)
   */
  drawText(
    text: string,
    x: number,
    y: number,
    fontSize: number = 24,
    fontFamily: string = 'Noto Sans JP, sans-serif',
    fill: string = '#000',
    textAnchor: 'start' | 'middle' | 'end' = 'middle',
    fontWeight: number | string = 400
  ): SVGTextElement {
    const textEl = this.create('text');
    textEl.setAttribute('x', String(this.round(x)));
    textEl.setAttribute('y', String(this.round(y)));
    textEl.setAttribute('font-size', String(fontSize));
    textEl.setAttribute('font-family', fontFamily);
    textEl.setAttribute('font-weight', String(fontWeight));
    textEl.setAttribute('fill', fill);
    textEl.setAttribute('text-anchor', textAnchor);
    textEl.textContent = text;

    this.add(textEl);
    return textEl;
  }

  /**
   * Draws a circle
   * @param x - Center X coordinate
   * @param y - Center Y coordinate
   * @param radius - Circle radius
   * @param fill - Fill color (optional)
   * @param stroke - Stroke color (optional)
   * @param strokeWidth - Stroke width (default: 1)
   */
  drawCircle(
    x: number,
    y: number,
    radius: number,
    fill?: string,
    stroke?: string,
    strokeWidth: number = 1
  ): SVGCircleElement {
    const circle = this.create('circle');
    circle.setAttribute('cx', String(this.round(x)));
    circle.setAttribute('cy', String(this.round(y)));
    circle.setAttribute('r', String(this.round(radius)));

    if (fill) {
      circle.setAttribute('fill', fill);
    } else {
      circle.setAttribute('fill', 'none');
    }

    if (stroke) {
      circle.setAttribute('stroke', stroke);
      circle.setAttribute('stroke-width', String(strokeWidth));
    }

    this.add(circle);
    return circle;
  }

  /**
   * Draws a line
   * @param x1 - Start X coordinate
   * @param y1 - Start Y coordinate
   * @param x2 - End X coordinate
   * @param y2 - End Y coordinate
   * @param stroke - Stroke color (default: '#000')
   * @param strokeWidth - Stroke width (default: 1)
   */
  drawLine(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    stroke: string = '#000',
    strokeWidth: number = 1
  ): SVGLineElement {
    const line = this.create('line');
    line.setAttribute('x1', String(this.round(x1)));
    line.setAttribute('y1', String(this.round(y1)));
    line.setAttribute('x2', String(this.round(x2)));
    line.setAttribute('y2', String(this.round(y2)));
    line.setAttribute('stroke', stroke);
    line.setAttribute('stroke-width', String(strokeWidth));

    this.add(line);
    return line;
  }

  /**
   * Draws a path using SVG path data
   * @param pathData - SVG path data string (e.g., "M 10 10 L 20 20")
   * @param fill - Fill color (optional)
   * @param stroke - Stroke color (optional)
   * @param strokeWidth - Stroke width (default: 1)
   */
  drawPath(
    pathData: string,
    fill?: string,
    stroke?: string,
    strokeWidth: number = 1
  ): SVGPathElement {
    const path = this.create('path');
    path.setAttribute('d', pathData);

    if (fill) {
      path.setAttribute('fill', fill);
    } else {
      path.setAttribute('fill', 'none');
    }

    if (stroke) {
      path.setAttribute('stroke', stroke);
      path.setAttribute('stroke-width', String(strokeWidth));
    }

    this.add(path);
    return path;
  }

  /**
   * Opens a new SVG group (following VexFlow pattern)
   * Returns the actual SVG element for direct manipulation (transforms, animations, etc.)
   *
   * @param className - Optional CSS class name
   * @param id - Optional element ID
   * @returns The SVG group element
   */
  openGroup(className?: string, id?: string): SVGGElement {
    const group = this.create('g');

    if (className) {
      group.setAttribute('class', className);
    }

    if (id) {
      group.setAttribute('id', id);
    }

    // Add to current parent
    this.currentParent.appendChild(group);

    // Push to stack and update current parent
    this.groups.push(group);
    this.currentParent = group;

    return group;
  }

  /**
   * Closes the current group and returns to parent
   */
  closeGroup(): void {
    if (this.groups.length === 0) {
      console.warn('closeGroup() called but no groups are open');
      return;
    }

    // Pop current group
    this.groups.pop();

    // Restore parent (either previous group or root SVG)
    this.currentParent = this.groups.length > 0
      ? this.groups[this.groups.length - 1]
      : this.svg;
  }

  /**
   * Draws a rectangle
   * @param x - Top-left X coordinate
   * @param y - Top-left Y coordinate
   * @param width - Rectangle width
   * @param height - Rectangle height
   * @param fill - Fill color (optional)
   * @param stroke - Stroke color (optional)
   * @param strokeWidth - Stroke width (default: 1)
   */
  drawRect(
    x: number,
    y: number,
    width: number,
    height: number,
    fill?: string,
    stroke?: string,
    strokeWidth: number = 1
  ): SVGRectElement {
    const rect = this.create('rect');
    rect.setAttribute('x', String(this.round(x)));
    rect.setAttribute('y', String(this.round(y)));
    rect.setAttribute('width', String(this.round(width)));
    rect.setAttribute('height', String(this.round(height)));

    if (fill) {
      rect.setAttribute('fill', fill);
    } else {
      rect.setAttribute('fill', 'none');
    }

    if (stroke) {
      rect.setAttribute('stroke', stroke);
      rect.setAttribute('stroke-width', String(strokeWidth));
    }

    this.add(rect);
    return rect;
  }

  /**
   * Resizes the SVG canvas
   */
  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.svg.setAttribute('width', String(width));
    this.svg.setAttribute('height', String(height));
    this.svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  }

  /**
   * Clears all content from the SVG
   */
  clear(): void {
    // Remove all children
    while (this.svg.firstChild) {
      this.svg.removeChild(this.svg.firstChild);
    }

    // Reset group stack
    this.groups = [];
    this.currentParent = this.svg;
  }

  /**
   * Gets the root SVG element
   */
  getSVG(): SVGSVGElement {
    return this.svg;
  }

  /**
   * Gets the current dimensions
   */
  getSize(): { width: number; height: number } {
    return { width: this.width, height: this.height };
  }
}
