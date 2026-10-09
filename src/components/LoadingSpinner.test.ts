import { describe, it, expect, beforeEach } from 'vitest';
import {
  ButtonLoadingState,
  buildCompactSpinnerSVG,
  buildSpinnerSVG,
  humanHits,
} from './LoadingSpinner';

describe('humanHits', () => {
  it('without nudges, strikes the dots left to right, then rests a beat', () => {
    const { hits, length } = humanHits(3, () => 0.5);

    expect(hits).toEqual([
      [0, 4, 8, 12],
      [1, 5, 9, 13],
      [2, 6, 10, 14],
    ]);
    expect(length).toBe(16);
  });

  it('strikes a single dot every two beats', () => {
    expect(humanHits(1, () => 0.5)).toEqual({
      hits: [[0, 2, 4, 6]],
      length: 8,
    });
  });

  it('nudges hits slightly but keeps each pass moving forward', () => {
    let seed = 1;
    const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const { hits } = humanHits(3, random);

    hits.forEach((dotHits, dot) =>
      dotHits.forEach((t, pass) => {
        expect(Math.abs(t - (pass * 4 + dot))).toBeLessThanOrEqual(0.5);
        if (dot > 0) expect(t).toBeGreaterThan(hits[dot - 1][pass]);
      }),
    );
  });
});

describe('spinner SVGs', () => {
  it('draws three dots for the standard spinner and one for the compact', () => {
    const standard = new DOMParser().parseFromString(
      buildSpinnerSVG(),
      'image/svg+xml',
    ).documentElement;
    const compact = new DOMParser().parseFromString(
      buildCompactSpinnerSVG(),
      'image/svg+xml',
    ).documentElement;

    expect(standard.getAttribute('class')).toBe('spinner');
    expect(standard.querySelectorAll('circle')).toHaveLength(3);
    expect(compact.getAttribute('class')).toBe('spinner spinner-compact');
    expect(compact.querySelectorAll('circle')).toHaveLength(1);
  });

  // An SVG's <style> applies to the whole page, so two spinners timed
  // differently must not share class or keyframe names
  it('names each spinner apart from the others on the page', () => {
    const name = (svg: string) => svg.match(/@keyframes ([\w-]+)/)?.[1];

    expect(name(buildCompactSpinnerSVG())).not.toBe(
      name(buildCompactSpinnerSVG()),
    );
  });
});

describe('ButtonLoadingState', () => {
  let button: HTMLButtonElement;

  beforeEach(() => {
    button = document.createElement('button');
    button.innerHTML = '<span>Original</span>';
    button.disabled = false;
  });

  it('shows spinner without content', () => {
    const state = new ButtonLoadingState(button);
    state.show();

    expect(button.innerHTML).toContain('<svg');
    expect(button.disabled).toBe(true);
    expect(button.classList.contains('loading')).toBe(true);
    expect(button.getAttribute('aria-busy')).toBe('true');
  });

  it('restores original content and state', () => {
    const state = new ButtonLoadingState(button);
    state.show();
    state.hide();

    expect(button.innerHTML).toBe('<span>Original</span>');
    expect(button.disabled).toBe(false);
    expect(button.classList.contains('loading')).toBe(false);
    expect(button.getAttribute('aria-busy')).toBe('false');
  });

  it('keeps the original content in place so the button keeps its width', () => {
    const state = new ButtonLoadingState(button);
    state.show();

    // Content stays in the DOM (hidden by CSS) instead of being replaced,
    // so the button is still sized by its own label.
    expect(button.querySelector('span:not(.btn-spinner)')?.textContent).toBe(
      'Original',
    );
    expect(button.querySelector('.btn-spinner svg')).not.toBeNull();
    expect(
      button.querySelector('.btn-spinner')?.getAttribute('aria-hidden'),
    ).toBe('true');
  });

  it('can show and hide repeatedly without leaving spinners behind', () => {
    const state = new ButtonLoadingState(button);
    state.show();
    state.hide();
    state.show();
    state.hide();

    expect(button.querySelectorAll('.btn-spinner')).toHaveLength(0);
    expect(button.innerHTML).toBe('<span>Original</span>');
  });

  it('preserves original disabled state', () => {
    button.disabled = true;
    const state = new ButtonLoadingState(button);
    state.show();
    state.hide();

    expect(button.disabled).toBe(true);
  });
});
