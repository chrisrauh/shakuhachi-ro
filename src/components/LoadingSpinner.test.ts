import { describe, it, expect, beforeEach } from 'vitest';
import { createSpinnerSVG, ButtonLoadingState } from './LoadingSpinner';

describe('createSpinnerSVG', () => {
  it('returns SVG markup with rotating animation', () => {
    const svg = createSpinnerSVG();
    expect(svg).toContain('<svg');
    expect(svg).toContain('stroke="currentColor"');
    expect(svg).toContain('<animateTransform');
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

  it('shows spinner with text content', () => {
    const state = new ButtonLoadingState(button);
    state.show('Deleting…');

    expect(button.innerHTML).toContain('Deleting…');
  });

  it('shows spinner with HTML content', () => {
    const state = new ButtonLoadingState(button);
    state.show('<span class="count">⋯</span>');

    expect(button.innerHTML).toContain('<span class="count">⋯</span>');
  });

  it('restores original content and state', () => {
    const state = new ButtonLoadingState(button);
    state.show('Loading…');
    state.hide();

    expect(button.innerHTML).toBe('<span>Original</span>');
    expect(button.disabled).toBe(false);
    expect(button.classList.contains('loading')).toBe(false);
    expect(button.getAttribute('aria-busy')).toBe('false');
  });

  it('preserves original disabled state', () => {
    button.disabled = true;
    const state = new ButtonLoadingState(button);
    state.show();
    state.hide();

    expect(button.disabled).toBe(true);
  });
});
