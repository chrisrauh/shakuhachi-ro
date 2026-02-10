/**
 * ThemeSwitcher - Toggle between light and dark themes
 * Uses class-based theme switching (.theme-light / .theme-dark)
 */

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

  private render(): void {
    const moonIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 14px; height: 14px; display: block;"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
    const sunIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 14px; height: 14px; display: block;"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;

    this.container.innerHTML = `
      <button id="theme-toggle" aria-label="Toggle theme" style="
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
      ">
        ${this.currentTheme === 'light' ? moonIcon : sunIcon}
      </button>
    `;

    const button = this.container.querySelector('#theme-toggle');
    if (button) {
      button.addEventListener('click', () => {
        this.toggleTheme();
      });

      // Add hover effect matching other buttons
      button.addEventListener('mouseenter', () => {
        (button as HTMLElement).style.background = 'var(--color-neutral-300)';
      });

      button.addEventListener('mouseleave', () => {
        (button as HTMLElement).style.background = 'var(--color-neutral-200)';
      });
    }
  }

  private toggleTheme(): void {
    this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.applyTheme(this.currentTheme);
    localStorage.setItem('theme', this.currentTheme);

    // Update icon
    const button = document.getElementById('theme-toggle');
    if (button) {
      const moonIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 14px; height: 14px; display: block;"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
      const sunIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 14px; height: 14px; display: block;"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
      button.innerHTML = this.currentTheme === 'light' ? moonIcon : sunIcon;
    }
  }

  private applyTheme(theme: 'light' | 'dark'): void {
    const html = document.documentElement;
    html.classList.remove('theme-light', 'theme-dark');
    html.classList.add(`theme-${theme}`);
  }
}
