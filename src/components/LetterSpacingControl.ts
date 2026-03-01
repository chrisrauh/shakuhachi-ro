import { Pane } from 'tweakpane';

interface LetterSpacingSettings {
  letterSpacing: number; // in em units
}

export class LetterSpacingControl {
  private pane: Pane;
  private settings: LetterSpacingSettings;
  private readonly STORAGE_KEY = 'shakuhachi-dev-letter-spacing';

  constructor(containerId: string) {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container element with id "${containerId}" not found`);
    }

    this.settings = this.loadSettings();

    // Initialize Tweakpane
    this.pane = new Pane({
      title: 'Letter Spacing',
      container,
    });

    // Add slider control
    this.pane
      .addBinding(this.settings, 'letterSpacing', {
        label: 'Spacing',
        min: -0.1,
        max: 0.15,
        step: 0.001,
      })
      .on('change', () => {
        this.applyLetterSpacing();
        this.saveSettings();
      });

    // Add reset button
    this.pane
      .addButton({
        title: 'Reset to Normal',
      })
      .on('click', () => {
        this.settings.letterSpacing = 0;
        this.pane.refresh();
        this.applyLetterSpacing();
        this.saveSettings();
      });

    // Apply initial value
    this.applyLetterSpacing();
  }

  private loadSettings(): LetterSpacingSettings {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load letter spacing settings:', error);
    }
    return { letterSpacing: 0 };
  }

  private saveSettings(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.settings));
    } catch (error) {
      console.warn('Failed to save letter spacing settings:', error);
    }
  }

  private applyLetterSpacing(): void {
    const value =
      this.settings.letterSpacing === 0
        ? 'normal'
        : `${this.settings.letterSpacing}em`;
    document.body.style.setProperty('--letter-spacing-override', value);
  }

  public destroy(): void {
    this.pane.dispose();
  }
}
