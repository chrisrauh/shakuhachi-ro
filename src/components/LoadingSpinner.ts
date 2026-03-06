/**
 * Loading spinner utility for button/link elements
 *
 * Usage:
 *   const loadingState = new ButtonLoadingState(button);
 *   loadingState.show();                      // Just spinner
 *   loadingState.show('Deleting…');           // Spinner + text
 *   loadingState.show('<span>...</span>');    // Spinner + HTML
 *
 *   // On error: restore original state
 *   loadingState.hide();
 */

export function createSpinnerSVG(): string {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="3" stroke-dasharray="15.7" stroke-dashoffset="0">
        <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>
      </circle>
    </svg>
  `.trim();
}

export class ButtonLoadingState {
  private button: HTMLElement;
  private originalContent: string;
  private originalDisabled: boolean;

  constructor(button: HTMLElement) {
    this.button = button;
    this.originalContent = button.innerHTML;
    this.originalDisabled = (button as HTMLButtonElement).disabled || false;
  }

  show(content?: string): void {
    // Disable interaction
    if ('disabled' in this.button) {
      (this.button as HTMLButtonElement).disabled = true;
    }
    this.button.classList.add('loading');
    this.button.setAttribute('aria-busy', 'true');

    // Update content
    const spinner = createSpinnerSVG();
    this.button.innerHTML = content ? `${spinner}\n${content}` : spinner;
  }

  hide(): void {
    this.button.innerHTML = this.originalContent;
    this.button.classList.remove('loading');
    this.button.setAttribute('aria-busy', 'false');

    if ('disabled' in this.button) {
      (this.button as HTMLButtonElement).disabled = this.originalDisabled;
    }
  }
}
