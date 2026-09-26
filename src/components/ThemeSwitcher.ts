/**
 * ThemeSwitcher - Toggle between light and dark themes
 * Uses data-theme attribute for theme control
 * Inline script in head sets initial theme from system preference
 */

export class ThemeSwitcher {
  private currentTheme: 'light' | 'dark' = 'light';

  // Assigned before any other method can run — the constructor returns early
  // when the button is absent, and every other method is reachable only
  // through a listener registered after this point.
  private button!: HTMLButtonElement;

  constructor() {
    const button = document.getElementById('theme-toggle') as HTMLButtonElement;
    if (!button) {
      return;
    }
    this.button = button;

    // Read theme from DOM (already set by inline script in head)
    const currentAttr = document.documentElement.getAttribute('data-theme');
    this.currentTheme = currentAttr === 'dark' ? 'dark' : 'light';
    // Sets the initial title; re-applying the current theme is idempotent
    this.applyTheme(this.currentTheme);

    button.addEventListener('click', () => {
      this.toggleTheme();
    });

    // Listen for system preference changes
    window
      .matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', (e) => {
        this.currentTheme = e.matches ? 'dark' : 'light';
        this.applyTheme(this.currentTheme);
      });
  }

  private toggleTheme(): void {
    this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.applyTheme(this.currentTheme);
    // No localStorage - theme only persists for current session
  }

  private applyTheme(theme: 'light' | 'dark'): void {
    const html = document.documentElement;
    html.setAttribute('data-theme', theme);
    // Names the state the click moves to; aria-label stays constant so screen
    // reader users are not re-announced on every toggle.
    this.button.title =
      theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode';
  }
}
