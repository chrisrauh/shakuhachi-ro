import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BaseDialog } from './BaseDialog';

// Concrete subclass for testing — BaseDialog is abstract
class TestDialog extends BaseDialog {
  open(overlay: HTMLElement, onDismiss?: () => void): void {
    this.openOverlay(overlay, onDismiss);
  }
  close(): void {
    this.closeOverlay();
  }
}

describe('BaseDialog', () => {
  let overlay: HTMLElement;
  let dialogEl: HTMLElement;
  let dialog: TestDialog;

  beforeEach(() => {
    overlay = document.createElement('div');
    dialogEl = document.createElement('div');
    dialogEl.setAttribute('role', 'dialog');
    dialogEl.setAttribute('tabindex', '-1');
    overlay.appendChild(dialogEl);
    overlay.hidden = true;
    document.body.appendChild(overlay);
    dialog = new TestDialog();
  });

  afterEach(() => {
    overlay.remove();
  });

  it('shows overlay when opened', () => {
    dialog.open(overlay);
    expect(overlay.hidden).toBe(false);
  });

  it('hides overlay when closed', () => {
    dialog.open(overlay);
    dialog.close();
    expect(overlay.hidden).toBe(true);
  });

  it('closes on Escape key', () => {
    dialog.open(overlay);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(overlay.hidden).toBe(true);
  });

  it('calls onDismiss when Escape is pressed', () => {
    const onDismiss = vi.fn();
    dialog.open(overlay, onDismiss);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it('closes on click outside (on overlay element itself)', () => {
    dialog.open(overlay);
    overlay.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(overlay.hidden).toBe(true);
  });

  it('calls onDismiss on click outside', () => {
    const onDismiss = vi.fn();
    dialog.open(overlay, onDismiss);
    overlay.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it('does not close on click inside the dialog content', () => {
    dialog.open(overlay);
    dialogEl.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(overlay.hidden).toBe(false);
  });

  it('does not call onDismiss on click inside the dialog content', () => {
    const onDismiss = vi.fn();
    dialog.open(overlay, onDismiss);
    dialogEl.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('removes Escape handler after close — subsequent Escape does nothing', () => {
    dialog.open(overlay);
    dialog.close();
    // If handler were still attached, this would toggle hidden back to false
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(overlay.hidden).toBe(true);
  });

  it('restores focus to the previously focused element on close', () => {
    const btn = document.createElement('button');
    document.body.appendChild(btn);
    btn.focus();

    dialog.open(overlay);
    dialog.close();

    expect(document.activeElement).toBe(btn);
    btn.remove();
  });
});
