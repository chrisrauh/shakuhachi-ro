/**
 * Unit tests for NotationFontSwitcher
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { NotationFontSwitcher } from './NotationFontSwitcher';

describe('NotationFontSwitcher', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.setAttribute('data-notation-font', 'sans');
    document.body.innerHTML = `
      <button id="notation-font-toggle"></button>
      <shakuhachi-score id="a"></shakuhachi-score>
      <shakuhachi-score id="b"></shakuhachi-score>
    `;
  });

  it('applies the initial font from the document to score elements', () => {
    document.documentElement.setAttribute('data-notation-font', 'serif');
    new NotationFontSwitcher();

    document.querySelectorAll('shakuhachi-score').forEach((el) => {
      expect(el.getAttribute('notation-font')).toBe('serif');
    });
  });

  it('toggles every score element and the document on click', () => {
    new NotationFontSwitcher();
    document.getElementById('notation-font-toggle')!.click();

    expect(document.documentElement.dataset.notationFont).toBe('serif');
    document.querySelectorAll('shakuhachi-score').forEach((el) => {
      expect(el.getAttribute('notation-font')).toBe('serif');
    });
  });

  it('persists the choice to localStorage', () => {
    new NotationFontSwitcher();
    document.getElementById('notation-font-toggle')!.click();

    expect(localStorage.getItem('notation-font')).toBe('serif');
  });

  it('does nothing when the toggle button is absent', () => {
    document.body.innerHTML = '';
    expect(() => new NotationFontSwitcher()).not.toThrow();
  });
});
