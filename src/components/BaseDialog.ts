/**
 * Shared base class for modal dialogs.
 *
 * Manages overlay visibility, Escape-to-close, click-outside-to-close,
 * and focus save/restore. Subclasses look up their own overlay element
 * and pass it to openOverlay().
 *
 * Markup must pre-exist in the document before instantiation (HTML-first pattern).
 * The overlay uses the `hidden` attribute for visibility.
 * The inner dialog element must have: role="dialog" aria-modal="true" tabindex="-1"
 */
export abstract class BaseDialog {
  private overlay: HTMLElement | null = null;
  private escapeHandler: ((e: KeyboardEvent) => void) | null = null;
  private clickHandler: ((e: MouseEvent) => void) | null = null;
  private previousFocus: HTMLElement | null = null;

  /**
   * Shows the overlay and wires dismiss behavior.
   * @param overlay - The overlay backdrop element (toggled via `hidden` attribute)
   * @param onDismiss - Called when dismissed via Escape or click-outside (not via confirm/cancel buttons)
   */
  protected openOverlay(overlay: HTMLElement, onDismiss?: () => void): void {
    this.previousFocus = document.activeElement as HTMLElement | null;
    this.overlay = overlay;
    this.overlay.hidden = false;

    this.clickHandler = (e: MouseEvent) => {
      if (e.target === this.overlay) {
        onDismiss?.();
        this.closeOverlay();
      }
    };
    this.escapeHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onDismiss?.();
        this.closeOverlay();
      }
    };

    this.overlay.addEventListener('click', this.clickHandler);
    document.addEventListener('keydown', this.escapeHandler);

    // Move focus into the dialog for keyboard/screen reader accessibility
    const dialogEl = this.overlay.querySelector<HTMLElement>('[role="dialog"]');
    dialogEl?.focus();
  }

  /**
   * Hides the overlay and cleans up all event handlers.
   * Restores focus to the element focused before the dialog opened.
   */
  protected closeOverlay(): void {
    if (this.overlay) {
      this.overlay.hidden = true;
      if (this.clickHandler) {
        this.overlay.removeEventListener('click', this.clickHandler);
        this.clickHandler = null;
      }
      this.overlay = null;
    }
    if (this.escapeHandler) {
      document.removeEventListener('keydown', this.escapeHandler);
      this.escapeHandler = null;
    }
    this.previousFocus?.focus();
    this.previousFocus = null;
  }
}
