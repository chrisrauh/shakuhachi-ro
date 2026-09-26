/**
 * NotationFontSwitcher - Toggle notation between sans and serif
 * Uses data-notation-font attribute on <html>, propagated to each
 * <shakuhachi-score> element's notation-font attribute
 * Inline script in head sets initial font from localStorage
 */

const STORAGE_KEY = 'notation-font';

type NotationFont = 'sans' | 'serif';

export class NotationFontSwitcher {
  private currentFont: NotationFont = 'sans';

  // Assigned before any other method can run — the constructor returns early
  // when the button is absent, and every other method is reachable only
  // through a listener registered after this point.
  private button!: HTMLButtonElement;

  constructor() {
    const button = document.getElementById(
      'notation-font-toggle',
    ) as HTMLButtonElement;
    if (!button) {
      return;
    }
    this.button = button;

    // Read font from DOM (already set by inline script in head)
    const currentAttr =
      document.documentElement.getAttribute('data-notation-font');
    this.currentFont = currentAttr === 'serif' ? 'serif' : 'sans';
    this.applyFont(this.currentFont);

    button.addEventListener('click', () => {
      this.toggleFont();
    });
  }

  private toggleFont(): void {
    this.currentFont = this.currentFont === 'sans' ? 'serif' : 'sans';
    this.applyFont(this.currentFont);

    try {
      localStorage.setItem(STORAGE_KEY, this.currentFont);
    } catch {
      // Private mode or blocked storage - font still applies for this page view
    }
  }

  private applyFont(font: NotationFont): void {
    document.documentElement.setAttribute('data-notation-font', font);
    // Names the state the click moves to; aria-label stays constant so screen
    // reader users are not re-announced on every toggle.
    this.button.title =
      font === 'sans'
        ? 'Switch notation to serif'
        : 'Switch notation to sans-serif';
    document.querySelectorAll('shakuhachi-score').forEach((el) => {
      el.setAttribute('notation-font', font);
    });
  }
}
