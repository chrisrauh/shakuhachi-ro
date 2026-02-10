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
    this.container.innerHTML = `
      <button id="theme-toggle" aria-label="Toggle theme" style="
        background: var(--color-neutral-100);
        border: 1px solid var(--color-neutral-300);
        border-radius: var(--border-radius-medium);
        padding: var(--spacing-small);
        cursor: pointer;
        transition: background var(--transition-fast), border-color var(--transition-fast);
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
      ">
        <span id="theme-icon" style="font-size: 1.25rem;">${this.currentTheme === 'light' ? '🌙' : '☀️'}</span>
      </button>
    `;

    const button = this.container.querySelector('#theme-toggle');
    if (button) {
      button.addEventListener('click', () => {
        this.toggleTheme();
      });

      // Add hover effect
      button.addEventListener('mouseenter', () => {
        (button as HTMLElement).style.background = 'var(--color-neutral-200)';
        (button as HTMLElement).style.borderColor = 'var(--color-neutral-400)';
      });

      button.addEventListener('mouseleave', () => {
        (button as HTMLElement).style.background = 'var(--color-neutral-100)';
        (button as HTMLElement).style.borderColor = 'var(--color-neutral-300)';
      });
    }
  }

  private toggleTheme(): void {
    this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.applyTheme(this.currentTheme);
    localStorage.setItem('theme', this.currentTheme);

    // Update icon
    const icon = document.getElementById('theme-icon');
    if (icon) {
      icon.textContent = this.currentTheme === 'light' ? '🌙' : '☀️';
    }
  }

  private applyTheme(theme: 'light' | 'dark'): void {
    const html = document.documentElement;
    html.classList.remove('theme-light', 'theme-dark');
    html.classList.add(`theme-${theme}`);
  }
}
