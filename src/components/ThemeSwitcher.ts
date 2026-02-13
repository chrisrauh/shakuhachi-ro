/**
 * ThemeSwitcher - Toggle between light and dark themes
 * Uses class-based theme switching (.theme-light / .theme-dark)
 */

import { createElement, SunMoon } from 'lucide';

export class ThemeSwitcher {
  private container: HTMLElement;
  private currentTheme: 'light' | 'dark';

  constructor(containerId: string) {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(
        `ThemeSwitcher: container with id "${containerId}" not found`,
      );
    }
    this.container = container;

    // Always use system preference on first load
    const prefersDark = window.matchMedia(
      '(prefers-color-scheme: dark)',
    ).matches;
    this.currentTheme = prefersDark ? 'dark' : 'light';

    // Listen for system theme changes and auto-update
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', (e) => {
      this.currentTheme = e.matches ? 'dark' : 'light';
      this.applyTheme(this.currentTheme);
    });

    this.render();
    this.applyTheme(this.currentTheme);
  }

  private getIcon(): SVGElement {
    const icon = createElement(SunMoon);
    icon.setAttribute('width', '16');
    icon.setAttribute('height', '16');
    icon.setAttribute('stroke-width', '2');
    icon.style.display = 'block';
    return icon;
  }

  private render(): void {
    const button = document.createElement('button');
    button.id = 'theme-toggle';
    button.className = 'btn btn-icon';
    button.setAttribute('aria-label', 'Toggle theme');

    button.appendChild(this.getIcon());
    this.container.innerHTML = '';
    this.container.appendChild(button);

    button.addEventListener('click', () => {
      this.toggleTheme();
    });
  }

  private toggleTheme(): void {
    this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.applyTheme(this.currentTheme);
    // No localStorage - theme only persists for current session
  }

  private applyTheme(theme: 'light' | 'dark'): void {
    const html = document.documentElement;
    html.classList.remove('theme-light', 'theme-dark');
    html.classList.add(`theme-${theme}`);
  }
}
