/**
 * RenderingBackend - The drawing primitives notes and modifiers draw with
 *
 * Notes, modifiers and debug labels depend on this interface rather than on
 * SVGRenderer, so they can draw to another backend or to a test double without
 * a DOM. It holds only the primitives they use; add one here when they need it.
 *
 * Colours are passed through as given. SVGRenderer accepts any SVG paint value,
 * including `var(--…)` references, which a non-SVG backend would have to
 * resolve itself (see #371).
 */
export interface RenderingBackend {
  drawText(
    text: string,
    x: number,
    y: number,
    fontSize?: number,
    fontFamily?: string,
    fill?: string,
    textAnchor?: 'start' | 'middle' | 'end',
    fontWeight?: number | string,
  ): void;

  drawCircle(
    x: number,
    y: number,
    radius: number,
    fill?: string,
    stroke?: string,
    strokeWidth?: number,
  ): void;

  drawLine(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    stroke?: string,
    strokeWidth?: number,
  ): void;
}
