/**
 * ThemeSwitcher - Toggle between light and dark themes
 * Uses class-based theme switching (.theme-light / .theme-dark)
 */

import { createElement, Moon, Sun } from 'lucide';

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

    // Check localStorage or system preference
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const prefersDark = window.matchMedia(
      '(prefers-color-scheme: dark)',
    ).matches;
    this.currentTheme = savedTheme || (prefersDark ? 'dark' : 'light');

    this.render();
    this.applyTheme(this.currentTheme);
  }

  private getIcon(theme: 'light' | 'dark'): SVGElement {
    const iconData = theme === 'light' ? Moon : Sun;
    const icon = createElement(iconData);
    icon.setAttribute('width', '16');
    icon.setAttribute('height', '16');
    icon.setAttribute('stroke-width', '2');
    icon.style.display = 'block';
    return icon;
  }

  private render(): void {
    const button = document.createElement('button');
    button.id = 'theme-toggle';
    button.setAttribute('aria-label', 'Toggle theme');
    button.style.cssText = `
      padding: var(--spacing-x-small) var(--spacing-small);
      cursor: pointer;
      background: var(--color-neutral-200);
      border: var(--input-border-width) solid var(--color-neutral-300);
      border-radius: var(--border-radius-medium);
      color: var(--color-neutral-700);
      font-size: var(--font-size-small);
      transition: background var(--transition-fast);
      display: flex;
      align-items: center;
      justify-content: center;
      line-height: 0;
    `;

    button.appendChild(this.getIcon(this.currentTheme));
    this.container.innerHTML = '';
    this.container.appendChild(button);

    button.addEventListener('click', () => {
      this.toggleTheme();
    });

    // Add hover effect matching other buttons
    button.addEventListener('mouseenter', () => {
      button.style.background = 'var(--color-neutral-300)';
    });

    button.addEventListener('mouseleave', () => {
      button.style.background = 'var(--color-neutral-200)';
    });
  }

  private toggleTheme(): void {
    this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.applyTheme(this.currentTheme);
    localStorage.setItem('theme', this.currentTheme);

    // Update icon
    const button = document.getElementById('theme-toggle');
    if (button) {
      button.innerHTML = '';
      button.appendChild(this.getIcon(this.currentTheme));
    }
  }

  private applyTheme(theme: 'light' | 'dark'): void {
    const html = document.documentElement;
    html.classList.remove('theme-light', 'theme-dark');
    html.classList.add(`theme-${theme}`);
  }
}
