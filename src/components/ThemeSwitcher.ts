/**
 * ThemeSwitcher - Toggle between light and dark themes
 * Uses data-theme attribute for theme control
 *
 * The site follows the system theme until the reader picks the other one.
 * That choice is saved and wins over the system until the reader toggles
 * again. Picking the theme the system shows deletes the choice, so the site
 * follows the system again (#522).
 *
 * The inline script in Layout.astro reads the saved choice before the page
 * draws. It uses the same storage key.
 */

type Theme = 'light' | 'dark';

const STORAGE_KEY = 'theme';

function savedTheme(): Theme | null {
  try {
    const theme = localStorage.getItem(STORAGE_KEY);
    return theme === 'light' || theme === 'dark' ? theme : null;
  } catch {
    // Private mode or blocked storage - follow the system
    return null;
  }
}

export class ThemeSwitcher {
  private currentTheme: Theme = 'light';
  private systemDark = window.matchMedia('(prefers-color-scheme: dark)');

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

    // Follow system changes, unless the reader has chosen a theme
    this.systemDark.addEventListener('change', () => {
      if (savedTheme()) {
        return;
      }
      this.currentTheme = this.systemTheme();
      this.applyTheme(this.currentTheme);
    });
  }

  private systemTheme(): Theme {
    return this.systemDark.matches ? 'dark' : 'light';
  }

  private toggleTheme(): void {
    this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.applyTheme(this.currentTheme);

    try {
      if (this.currentTheme === this.systemTheme()) {
        localStorage.removeItem(STORAGE_KEY);
      } else {
        localStorage.setItem(STORAGE_KEY, this.currentTheme);
      }
    } catch {
      // Private mode or blocked storage - theme still applies for this page view
    }
  }

  private applyTheme(theme: Theme): void {
    const html = document.documentElement;
    html.setAttribute('data-theme', theme);
    // Names the state the click moves to; aria-label stays constant so screen
    // reader users are not re-announced on every toggle.
    this.button.title =
      theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode';
  }
}
