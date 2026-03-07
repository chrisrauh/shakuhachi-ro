/**
 * Loading spinner utility for button/link elements
 *
 * Usage:
 *   const loadingState = new ButtonLoadingState(button);
 *   loadingState.show();                      // Just spinner
 *   loadingState.show('Deleting…');           // Spinner + text
 *   loadingState.show('<span>...</span>');    // Spinner + HTML
 *
 *   // On error: restore original state
 *   loadingState.hide();
 */

export interface SpinnerParams {
  r?: number;
  gap?: number;
  strokeWidth?: number;
  duration?: number;
  fade?: number;
}

// Animation: Ri→Chi→Re→Tsu→Ro→Tsu→Re→Chi→Ri (8 equal steps, no pauses)
// H5 (thumb): always closed, static. H4–H1: animated via fill-opacity.
// Fingerings (top→bottom H5,H4,H3,H2,H1): ●=closed, ○=open
//   Ri:  ●○○●●
//   Chi: ●●○○○
//   Re:  ●●●○○
//   Tsu: ●●●●○
//   Ro:  ●●●●●
export function buildSpinnerSVG({
  r = 8,
  gap = 4,
  strokeWidth = 1.5,
  duration = 6,
  fade = 0.1,
}: SpinnerParams = {}): string {
  const d = r * 2;
  const step = d + gap;
  const h = d + step * 4;
  const f = fade / duration;
  const p = (v: number) => `${+(v * 100).toFixed(3)}%`;
  const [t1, t2, t3, t4, t5, t6, t7] = [1, 2, 3, 4, 5, 6, 7].map((n) => n / 8);
  const dur = `${duration}s`;
  const cy = (i: number) => r + step * i;

  // Each keyframe: hold at current state, then fade over `f` to next state.
  // H4, H2, H1 start/end closed and use cross-loop fades (pct(1-f)→100%).
  const style =
    `@keyframes sh-h4{0%,${p(t1)}{fill-opacity:0}${p(t1 + f)}{fill-opacity:1}${p(1 - f)}{fill-opacity:1}100%{fill-opacity:0}}` +
    `@keyframes sh-h3{0%,${p(t2)}{fill-opacity:0}${p(t2 + f)}{fill-opacity:1}${p(t7)}{fill-opacity:1}${p(t7 + f)},100%{fill-opacity:0}}` +
    `@keyframes sh-h2{0%,${p(t1)}{fill-opacity:1}${p(t1 + f)},${p(t3)}{fill-opacity:0}${p(t3 + f)},${p(t6)}{fill-opacity:1}${p(t6 + f)},${p(1 - f)}{fill-opacity:0}100%{fill-opacity:1}}` +
    `@keyframes sh-h1{0%,${p(t1)}{fill-opacity:1}${p(t1 + f)},${p(t4)}{fill-opacity:0}${p(t4 + f)},${p(t5)}{fill-opacity:1}${p(t5 + f)},${p(1 - f)}{fill-opacity:0}100%{fill-opacity:1}}` +
    `.sh-hole{fill:currentColor;stroke:currentColor;stroke-width:${strokeWidth}}` +
    `.sh-h4{fill-opacity:0;animation:sh-h4 ${dur} linear infinite}` +
    `.sh-h3{fill-opacity:0;animation:sh-h3 ${dur} linear infinite}` +
    `.sh-h2{animation:sh-h2 ${dur} linear infinite}` +
    `.sh-h1{animation:sh-h1 ${dur} linear infinite}`;

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${d}" height="${h}" viewBox="0 0 ${d} ${h}" overflow="visible">` +
    `<style>${style}</style>` +
    `<circle class="sh-hole" cx="${r}" cy="${cy(0)}" r="${r}"/>` +
    `<circle class="sh-hole sh-h4" cx="${r}" cy="${cy(1)}" r="${r}"/>` +
    `<circle class="sh-hole sh-h3" cx="${r}" cy="${cy(2)}" r="${r}"/>` +
    `<circle class="sh-hole sh-h2" cx="${r}" cy="${cy(3)}" r="${r}"/>` +
    `<circle class="sh-hole sh-h1" cx="${r}" cy="${cy(4)}" r="${r}"/>` +
    `</svg>`
  );
}

export function createSpinnerSVG(): string {
  return buildSpinnerSVG();
}

export class ButtonLoadingState {
  private button: HTMLElement;
  private originalContent: string;
  private originalDisabled: boolean;

  constructor(button: HTMLElement) {
    this.button = button;
    this.originalContent = button.innerHTML;
    this.originalDisabled = (button as HTMLButtonElement).disabled || false;
  }

  show(content?: string): void {
    // Disable interaction
    if ('disabled' in this.button) {
      (this.button as HTMLButtonElement).disabled = true;
    }
    this.button.classList.add('loading');
    this.button.setAttribute('aria-busy', 'true');

    // Update content
    const spinner = createSpinnerSVG();
    this.button.innerHTML = content ? `${spinner}\n${content}` : spinner;
  }

  hide(): void {
    this.button.innerHTML = this.originalContent;
    this.button.classList.remove('loading');
    this.button.setAttribute('aria-busy', 'false');

    if ('disabled' in this.button) {
      (this.button as HTMLButtonElement).disabled = this.originalDisabled;
    }
  }
}
