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
