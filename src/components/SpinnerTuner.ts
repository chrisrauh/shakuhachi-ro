import { Pane } from 'tweakpane';
import { BEAT, PAUSE, buildSpinnerSVG } from './LoadingSpinner';

/**
 * A panel for trying the standard spinner's speed, size and pause in place.
 * The library page loads it only with `?loading`, which also holds the page
 * in its loading state. Changes last until the page reloads; the shipped
 * values are the defaults in LoadingSpinner.ts and the tokens in theme.css.
 */
export function showSpinnerTuner(container: HTMLElement): void {
  const root = document.documentElement;
  const rem = parseFloat(getComputedStyle(root).fontSize);
  const params = {
    beat: BEAT * 1000,
    pause: PAUSE * 1000,
    size:
      parseFloat(
        getComputedStyle(root).getPropertyValue('--size-spinner-dot'),
      ) * rem,
  };

  const redraw = () => {
    const svg = container.querySelector('svg.spinner');
    if (svg) {
      svg.outerHTML = buildSpinnerSVG({
        beat: params.beat / 1000,
        pause: params.pause / 1000,
      });
    }
  };

  const pane = new Pane({ title: 'Spinner' });
  pane
    .addBinding(params, 'beat', {
      label: 'beat (ms)',
      min: 150,
      max: 800,
      step: 10,
    })
    .on('change', redraw);
  pane
    .addBinding(params, 'pause', {
      label: 'pause (ms)',
      min: 0,
      max: 2000,
      step: 10,
    })
    .on('change', redraw);
  pane
    .addBinding(params, 'size', {
      label: 'dot (px)',
      min: 4,
      max: 16,
      step: 1,
    })
    .on('change', ({ value }) =>
      root.style.setProperty('--size-spinner-dot', `${value / rem}rem`),
    );
}
