import { describe, it, expect, beforeEach } from 'vitest';
import { ButtonLoadingState } from './LoadingSpinner';

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

  it('preserves original disabled state', () => {
    button.disabled = true;
    const state = new ButtonLoadingState(button);
    state.show();
    state.hide();

    expect(button.disabled).toBe(true);
  });
});
