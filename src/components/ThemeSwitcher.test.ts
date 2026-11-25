/**
 * Unit tests for ThemeSwitcher, and for the inline script in Layout.astro
 * that reads the saved theme before the page draws (#522)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ThemeSwitcher } from './ThemeSwitcher';

// jsdom has no matchMedia. This stands in for the system theme, and
// setSystemDark() changes it the way the OS does.
let systemDark = false;
let systemListeners: Array<(event: { matches: boolean }) => void> = [];

function setSystemDark(dark: boolean) {
  systemDark = dark;
  systemListeners.forEach((listener) => listener({ matches: dark }));
}

vi.stubGlobal('matchMedia', (query: string) => ({
  media: query,
  get matches() {
    return systemDark;
  },
  addEventListener: (
    _type: string,
    listener: (event: { matches: boolean }) => void,
  ) => {
    systemListeners.push(listener);
  },
}));

function theme() {
  return document.documentElement.getAttribute('data-theme');
}

function clickToggle() {
  document.getElementById('theme-toggle')!.click();
}

// The theme script in Layout.astro, run as the browser runs it
function runLayoutScript() {
  const layout = readFileSync(
    resolve(__dirname, '../layouts/Layout.astro'),
    'utf8',
  );
  const script = [
    ...layout.matchAll(/<script is:inline>([\s\S]*?)<\/script>/g),
  ].find(([, body]) => body.includes('data-theme'));
  new Function(script![1])();
}

beforeEach(() => {
  localStorage.clear();
  systemDark = false;
  systemListeners = [];
  document.documentElement.removeAttribute('data-theme');
  document.body.innerHTML = '<button id="theme-toggle"></button>';
});

describe('theme on page load', () => {
  it('follows the system when no theme is saved', () => {
    systemDark = true;
    runLayoutScript();
    expect(theme()).toBe('dark');
  });

  it('uses the saved theme over the system', () => {
    systemDark = true;
    localStorage.setItem('theme', 'light');
    runLayoutScript();
    expect(theme()).toBe('light');
  });

  it('ignores a saved value that is not a theme', () => {
    systemDark = true;
    localStorage.setItem('theme', 'sepia');
    runLayoutScript();
    expect(theme()).toBe('dark');
  });
});

describe('ThemeSwitcher', () => {
  it('keeps the chosen theme on the next page load', () => {
    systemDark = true;
    runLayoutScript();
    new ThemeSwitcher();
    clickToggle();
    expect(theme()).toBe('light');

    // Next page load
    document.documentElement.removeAttribute('data-theme');
    runLayoutScript();
    expect(theme()).toBe('light');
  });

  it('follows the system again when the reader picks the system theme', () => {
    systemDark = true;
    runLayoutScript();
    new ThemeSwitcher();
    clickToggle(); // light, saved
    clickToggle(); // dark, the same as the system

    expect(localStorage.getItem('theme')).toBeNull();
    setSystemDark(false);
    expect(theme()).toBe('light');
  });

  it('follows system changes when no theme is saved', () => {
    runLayoutScript();
    new ThemeSwitcher();
    setSystemDark(true);
    expect(theme()).toBe('dark');
  });

  it('keeps the chosen theme when the system changes', () => {
    runLayoutScript();
    new ThemeSwitcher();
    clickToggle(); // dark, saved
    setSystemDark(true);
    setSystemDark(false);
    expect(theme()).toBe('dark');
  });

  it('does nothing when the toggle button is absent', () => {
    document.body.innerHTML = '';
    expect(() => new ThemeSwitcher()).not.toThrow();
  });
});
