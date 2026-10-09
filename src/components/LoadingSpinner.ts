/**
 * Loading spinners: dots struck like notes, each snapping bright and growing
 * a little, then fading. They are timed the way a person plays, not like a
 * metronome: every hit lands a little early or late.
 *
 * - Standard (`buildSpinnerSVG`): three dots struck left to right, then a
 *   beat's rest. For a page or section that is loading.
 * - Compact (`buildCompactSpinnerSVG`): one dot struck every two beats. For
 *   buttons, through `ButtonLoadingState`.
 *
 * The SVG fixes only the proportions. Its size comes from CSS (`.spinner` in
 * components.css), so it can differ between desktop and mobile.
 *
 * Usage:
 *   const loadingState = new ButtonLoadingState(button);
 *   loadingState.show();   // Lay the compact spinner over the content
 *   loadingState.hide();   // Restore the content
 */

const BEAT = 0.36; // seconds from one hit to the next
const ATTACK = 0.06; // seconds a hit takes to reach full strength
const DECAY = 0.7; // seconds a hit takes to fade
const LOOSENESS = 0.1; // how far a hit may land early or late, in beats
const PASSES = 4; // passes written out, each timed differently, before the animation repeats
const REST_OPACITY = 0.2;
const SWELL = 1.25; // how much a dot grows when it is hit

// Each spinner's SVG styles are global to the page, and every spinner is timed
// differently, so each one names its classes and keyframes uniquely
let nextId = 0;

/**
 * When each dot is hit, in beats: the dots in turn from left to right, then a
 * beat's rest, played PASSES times. Every hit, and the length of every rest,
 * is nudged by up to LOOSENESS.
 */
export function humanHits(
  dots: number,
  random: () => number,
): { hits: number[][]; length: number } {
  const nudge = () => (random() * 2 - 1) * LOOSENESS;
  const hits: number[][] = Array.from({ length: dots }, () => []);
  let t = 0;
  for (let pass = 0; pass < PASSES; pass++) {
    for (let dot = 0; dot < dots; dot++) {
      hits[dot].push(Math.max(0, t + dot + nudge()));
    }
    t += dots + 1 + nudge();
  }
  return { hits, length: t };
}

const pct = (seconds: number, cycle: number) =>
  `${+((seconds / cycle) * 100).toFixed(3)}%`;

/** Keyframes for one dot: each hit snaps up, then fades before the next one */
function dotKeyframes(name: string, hits: number[], cycle: number): string {
  const rest = `opacity:${REST_OPACITY};transform:scale(1)`;
  let frames = hits[0] > 0 ? `0%{${rest}}` : '';
  hits.forEach((hit, i) => {
    const next = i + 1 < hits.length ? hits[i + 1] : cycle + hits[0];
    const fade = Math.min(DECAY, next - hit - ATTACK - 0.02);
    frames +=
      `${pct(hit, cycle)}{${rest};animation-timing-function:cubic-bezier(.2,0,.4,1)}` +
      `${pct(hit + ATTACK, cycle)}{opacity:1;transform:scale(${SWELL});animation-timing-function:cubic-bezier(0,0,.25,1)}` +
      `${pct(hit + ATTACK + fade, cycle)}{${rest}}`;
  });
  return `@keyframes ${name}{${frames}100%{${rest}}}`;
}

function buildDotsSVG(dots: number, className: string, random: () => number) {
  const id = `spinner-${nextId++}`;
  const { hits, length } = humanHits(dots, random);
  const cycle = length * BEAT;
  // Dots have a diameter of 2 and a gap of three quarters of a dot
  const pitch = 3.5;
  const width = 2 + pitch * (dots - 1);

  let style = `.${id}{fill:currentColor;opacity:${REST_OPACITY};transform-box:fill-box;transform-origin:center}`;
  let circles = '';
  for (let dot = 0; dot < dots; dot++) {
    const seconds = hits[dot].map((beats) => beats * BEAT);
    style += dotKeyframes(`${id}-${dot}`, seconds, cycle);
    style += `.${id}-${dot}{animation:${id}-${dot} ${+cycle.toFixed(3)}s linear infinite}`;
    circles += `<circle class="${id} ${id}-${dot}" cx="${1 + pitch * dot}" cy="1" r="1"/>`;
  }
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" class="${className}" viewBox="0 0 ${width} 2" overflow="visible" aria-hidden="true">` +
    `<style>${style}</style>${circles}</svg>`
  );
}

/** The standard spinner: three dots, for a page or section that is loading */
export function buildSpinnerSVG(random: () => number = Math.random): string {
  return buildDotsSVG(3, 'spinner', random);
}

/** The compact spinner: one dot, for buttons */
export function buildCompactSpinnerSVG(
  random: () => number = Math.random,
): string {
  return buildDotsSVG(1, 'spinner spinner-compact', random);
}

/**
 * Shows a spinner on a button while an action runs.
 *
 * The spinner is laid over the button's content rather than replacing it.
 * The content stays in place (hidden by `.btn-spinner ~ *` in components.css),
 * so the button keeps the width its own label gives it and doesn't jump.
 */
export class ButtonLoadingState {
  private button: HTMLElement;
  private originalDisabled: boolean;
  private spinner: HTMLElement | null = null;

  constructor(button: HTMLElement) {
    this.button = button;
    this.originalDisabled = (button as HTMLButtonElement).disabled || false;
  }

  show(): void {
    // Disable interaction
    if ('disabled' in this.button) {
      (this.button as HTMLButtonElement).disabled = true;
    }
    this.button.classList.add('loading');
    this.button.setAttribute('aria-busy', 'true');

    if (!this.spinner) {
      this.spinner = document.createElement('span');
      this.spinner.className = 'btn-spinner';
      this.spinner.setAttribute('aria-hidden', 'true');
      this.spinner.innerHTML = buildCompactSpinnerSVG();
      // First child, so the `.btn-spinner ~ *` rule hides everything after it
      this.button.prepend(this.spinner);
    }
  }

  hide(): void {
    this.spinner?.remove();
    this.spinner = null;
    this.button.classList.remove('loading');
    this.button.setAttribute('aria-busy', 'false');

    if ('disabled' in this.button) {
      (this.button as HTMLButtonElement).disabled = this.originalDisabled;
    }
  }
}
