/**
 * ThemeSwitcher - Toggle between light and dark themes
 * Uses data-theme attribute for theme control
 * Inline script in head sets initial theme from system preference
 */

export class ThemeSwitcher {
  private currentTheme: 'light' | 'dark' = 'light';

  constructor() {
    const button = document.getElementById('theme-toggle') as HTMLButtonElement;
    if (!button) {
      return;
    }

    // Read theme from DOM (already set by inline script in head)
    const currentAttr = document.documentElement.getAttribute('data-theme');
    this.currentTheme = currentAttr === 'dark' ? 'dark' : 'light';

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
  }
}
