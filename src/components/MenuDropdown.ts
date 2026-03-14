export interface MenuItem {
  id: string;
  label: string;
  href?: string;
  action?: () => void;
  icon?: string;
}

interface ShowOptions {
  /** Position the dropdown fixed below this element (avatar use case). */
  anchor?: HTMLElement;
  /** Explicit fixed coordinates (mobile menu use case). */
  fixed?: { top: string; right: string };
  /** Non-interactive text shown above items (e.g. email address). */
  header?: string;
  /** Dim the page behind the dropdown with a semi-transparent overlay. */
  useOverlay?: boolean;
  /** Called when the dropdown closes for any reason. */
  onClose: () => void;
}

export class MenuDropdown {
  private el: HTMLElement | null = null;
  private overlay: HTMLElement | null = null;
  private onCloseCallback: (() => void) | null = null;
  private escapeListener: ((e: KeyboardEvent) => void) | null = null;
  private outsideClickListener: ((e: MouseEvent) => void) | null = null;

  private static stylesInjected = false;

  constructor() {
    MenuDropdown.injectStyles();
  }

  private static injectStyles(): void {
    if (MenuDropdown.stylesInjected) return;
    MenuDropdown.stylesInjected = true;

    const style = document.createElement('style');
    style.id = 'menu-dropdown-styles';
    style.textContent = `
      @keyframes menu-dropdown-appear {
        from { opacity: 0; transform: scale(0.95); }
        to   { opacity: 1; transform: scale(1);    }
      }

      .menu-dropdown {
        background: var(--page-background-color);
        border: var(--panel-border-width) solid var(--panel-border-color);
        border-radius: 6px;
        box-shadow: var(--shadow-large);
        z-index: 1000;
        min-width: 192px;
        padding: var(--spacing-2x-small);
        animation: 0.2s cubic-bezier(0.33, 1, 0.68, 1) menu-dropdown-appear;
      }

      .menu-dropdown-header {
        padding: var(--spacing-small) var(--spacing-medium);
        font-size: var(--font-size-x-small);
        color: var(--color-text-secondary);
        border-bottom: 1px solid var(--panel-border-color);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        box-sizing: border-box;
        margin: calc(-1 * var(--spacing-2x-small));
        margin-bottom: var(--spacing-2x-small);
      }

      .menu-dropdown-item {
        display: flex;
        align-items: center;
        gap: var(--spacing-x-small);
        width: 100%;
        padding: var(--spacing-x-small) var(--spacing-small);
        margin: 0;
        background: none;
        border: none;
        text-align: left;
        cursor: pointer;
        font-family: inherit;
        font-size: var(--font-size-small);
        font-weight: normal;
        line-height: inherit;
        color: var(--color-text-primary);
        transition: background var(--transition-fast);
        text-decoration: none;
        border-radius: 4px;
        box-sizing: border-box;
      }

      .menu-dropdown-item:hover {
        background: var(--panel-background-color);
      }

      .menu-dropdown-item-icon {
        width: 16px;
        height: 16px;
        flex-shrink: 0;
        color: var(--color-text-secondary);
      }

      .menu-dropdown-divider {
        height: 1px;
        background: var(--panel-border-color);
        margin: var(--spacing-2x-small) calc(-1 * var(--spacing-2x-small));
      }

      .menu-dropdown-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.3);
        z-index: 999;
        animation: 0.2s cubic-bezier(0.33, 1, 0.68, 1) menu-dropdown-appear;
      }

      /* Active state for mobile menu toggle when open */
      #mobile-menu-toggle.btn.btn-icon[aria-expanded="true"] {
        background: var(--color-bg-hover);
        border-color: var(--color-border-hover);
      }
    `;
    document.head.appendChild(style);
  }

  get isOpen(): boolean {
    return this.el !== null;
  }

  show(groups: MenuItem[][], options: ShowOptions): void {
    this.hide(); // close any existing dropdown first
    this.onCloseCallback = options.onClose;

    // Build dropdown container
    this.el = document.createElement('div');
    this.el.className = 'menu-dropdown';
    this.el.style.position = 'fixed';

    if (options.anchor) {
      const rect = options.anchor.getBoundingClientRect();
      this.el.style.top = `${rect.bottom + 4}px`;
      this.el.style.right = `${window.innerWidth - rect.right}px`;
    } else if (options.fixed) {
      this.el.style.top = options.fixed.top;
      this.el.style.right = options.fixed.right;
    }

    // Optional header (e.g. email — set via textContent to prevent XSS)
    if (options.header) {
      const header = document.createElement('div');
      header.className = 'menu-dropdown-header';
      header.textContent = options.header;
      this.el.appendChild(header);
    }

    // Groups of items
    groups.forEach((group, groupIndex) => {
      group.forEach((item) => {
        let el: HTMLButtonElement | HTMLAnchorElement;

        if (item.href) {
          const a = document.createElement('a');
          a.href = item.href;
          el = a;
        } else {
          const btn = document.createElement('button');
          btn.addEventListener('click', () => {
            item.action?.();
            this.hide();
          });
          el = btn;
        }

        el.className = 'menu-dropdown-item';

        if (item.icon) {
          const iconSpan = document.createElement('span');
          iconSpan.className = 'menu-dropdown-item-icon';
          iconSpan.innerHTML = item.icon;
          el.appendChild(iconSpan);
        }

        const labelSpan = document.createElement('span');
        labelSpan.textContent = item.label;
        el.appendChild(labelSpan);

        this.el!.appendChild(el);
      });

      if (groupIndex < groups.length - 1) {
        const divider = document.createElement('div');
        divider.className = 'menu-dropdown-divider';
        this.el!.appendChild(divider);
      }
    });

    // Optional overlay (dimming background — mobile menu style)
    if (options.useOverlay) {
      this.overlay = document.createElement('div');
      this.overlay.className = 'menu-dropdown-overlay';
      this.overlay.addEventListener('click', () => this.hide());
      document.body.appendChild(this.overlay);
    } else {
      // Close on outside click (avatar dropdown style)
      this.outsideClickListener = (e: MouseEvent) => {
        if (this.el && !this.el.contains(e.target as Node)) {
          this.hide();
        }
      };
      document.addEventListener('click', this.outsideClickListener);
    }

    document.body.appendChild(this.el);

    // Close on Escape
    this.escapeListener = (e: KeyboardEvent) => {
      if (e.key === 'Escape') this.hide();
    };
    document.addEventListener('keydown', this.escapeListener);
  }

  hide(): void {
    if (!this.el) return;

    this.el.remove();
    this.el = null;

    this.overlay?.remove();
    this.overlay = null;

    if (this.outsideClickListener) {
      document.removeEventListener('click', this.outsideClickListener);
      this.outsideClickListener = null;
    }

    if (this.escapeListener) {
      document.removeEventListener('keydown', this.escapeListener);
      this.escapeListener = null;
    }

    const cb = this.onCloseCallback;
    this.onCloseCallback = null;
    cb?.();
  }
}
