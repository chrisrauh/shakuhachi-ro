import { BaseDialog } from './BaseDialog';

export interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

export class ConfirmDialog extends BaseDialog {
  private overlayEl: HTMLElement;
  private confirmBtn: HTMLButtonElement;
  private cancelBtn: HTMLButtonElement;

  constructor() {
    super();
    const overlay = document.getElementById('confirm-dialog-overlay');
    const confirmBtn = document.getElementById('confirm-dialog-confirm');
    const cancelBtn = document.getElementById('confirm-dialog-cancel');

    if (!overlay || !confirmBtn || !cancelBtn) {
      throw new Error(
        'ConfirmDialog: required elements (#confirm-dialog-overlay, #confirm-dialog-confirm, #confirm-dialog-cancel) not found',
      );
    }

    this.overlayEl = overlay;
    this.confirmBtn = confirmBtn as HTMLButtonElement;
    this.cancelBtn = cancelBtn as HTMLButtonElement;
  }

  public show(options: ConfirmDialogOptions): void {
    // Populate dynamic content — textContent is inherently XSS-safe
    const titleEl = document.getElementById('confirm-dialog-title');
    const messageEl = document.getElementById('confirm-dialog-message');
    if (titleEl) titleEl.textContent = options.title;
    if (messageEl) messageEl.textContent = options.message;

    // Update button labels — target .btn-text span to preserve text-box-trim wrapper
    const confirmText = this.confirmBtn.querySelector('.btn-text');
    const cancelText = this.cancelBtn.querySelector('.btn-text');
    if (confirmText) confirmText.textContent = options.confirmText ?? 'Confirm';
    if (cancelText) cancelText.textContent = options.cancelText ?? 'Cancel';

    // Wire per-call callbacks via .onclick (replaces previous handler, no accumulation)
    this.confirmBtn.onclick = () => {
      options.onConfirm();
      this.closeOverlay();
    };
    this.cancelBtn.onclick = () => {
      options.onCancel?.();
      this.closeOverlay();
    };

    this.openOverlay(this.overlayEl, () => options.onCancel?.());
  }
}
