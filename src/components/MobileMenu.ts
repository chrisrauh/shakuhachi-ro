export interface MenuItem {
  id: string;
  label: string;
  href?: string;
  action?: () => void; // For action items like theme toggle, auth
  icon?: string; // SVG icon path
  dividerAfter?: boolean; // Add divider after this item
}

export class MobileMenu {
  private container: HTMLElement;
  private items: MenuItem[] = [];
  private isOpen: boolean = false;
  private dropdown: HTMLElement | null = null;

  constructor(containerId: string) {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`MobileMenu: container "${containerId}" not found`);
    }
    this.container = container;
    this.addStyles();
    this.render();
    this.setupEventListeners();
  }

  public setItems(items: MenuItem[]): void {
    this.items = items;
  }

  private addStyles(): void {
    if (document.getElementById('mobile-menu-styles')) return;

    const style = document.createElement('style');
    style.id = 'mobile-menu-styles';
    style.textContent = `
      @keyframes mobile-menu-appear {
        from {
          opacity: 0;
          transform: scale(0.95);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }

      .mobile-menu-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.3);
        z-index: 999;
        animation: 0.2s cubic-bezier(0.33, 1, 0.68, 1) mobile-menu-appear;
      }

      .mobile-menu-dropdown {
        position: fixed;
        top: 48px;
        right: var(--spacing-medium);
        background: var(--page-background-color);
        border: var(--panel-border-width) solid var(--panel-border-color);
        border-radius: 6px;
        box-shadow: var(--shadow-large);
        z-index: 1000;
        min-width: 192px;
        padding: var(--spacing-2x-small) var(--spacing-x-small);
        animation: 0.2s cubic-bezier(0.33, 1, 0.68, 1) mobile-menu-appear;
      }

      .mobile-menu-item {
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
        color: var(--color-neutral-700);
        transition: background var(--transition-fast);
        text-decoration: none;
        border-radius: 4px;
        box-sizing: border-box;
      }

      .mobile-menu-item:hover {
        background: var(--panel-background-color);
      }

      .mobile-menu-item-icon {
        width: 16px;
        height: 16px;
        flex-shrink: 0;
        color: var(--color-neutral-600);
      }

      .mobile-menu-divider {
        height: 1px;
        background: var(--panel-border-color);
        margin: var(--spacing-2x-small) 0;
      }

      /* Active state for menu button when dropdown is open */
      #mobile-menu-toggle.btn.btn-icon[aria-expanded="true"] {
        background: var(--color-neutral-100);
        border-color: var(--color-neutral-400);
      }
    `;
    document.head.appendChild(style);
  }

  private render(): void {
    this.container.innerHTML = `
      <button id="mobile-menu-toggle" class="btn btn-icon" aria-label="Menu" aria-expanded="false">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>
        </svg>
      </button>
    `;

    const button = this.container.querySelector('#mobile-menu-toggle');
    button?.addEventListener('click', () => this.toggleMenu());
  }

  private toggleMenu(): void {
    this.isOpen = !this.isOpen;

    const button = this.container.querySelector('#mobile-menu-toggle');
    button?.setAttribute('aria-expanded', String(this.isOpen));

    if (this.isOpen) {
      this.showDropdown();
    } else {
      this.hideDropdown();
    }
  }

  private showDropdown(): void {
    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'mobile-menu-overlay';
    overlay.addEventListener('click', () => this.toggleMenu());

    // Create dropdown
    this.dropdown = document.createElement('div');
    this.dropdown.className = 'mobile-menu-dropdown';

    this.items.forEach((item) => {
      if (item.action) {
        // Action button (theme toggle, auth)
        const button = document.createElement('button');
        button.className = 'mobile-menu-item';

        // Add icon if provided
        if (item.icon) {
          const iconSpan = document.createElement('span');
          iconSpan.className = 'mobile-menu-item-icon';
          iconSpan.innerHTML = item.icon;
          button.appendChild(iconSpan);
        }

        const labelSpan = document.createElement('span');
        labelSpan.textContent = item.label;
        button.appendChild(labelSpan);

        button.addEventListener('click', () => {
          item.action!();
          this.toggleMenu(); // Close menu after action
        });
        this.dropdown!.appendChild(button);
      } else if (item.href) {
        // Navigation link
        const link = document.createElement('a');
        link.href = item.href;
        link.className = 'mobile-menu-item';

        // Add icon if provided
        if (item.icon) {
          const iconSpan = document.createElement('span');
          iconSpan.className = 'mobile-menu-item-icon';
          iconSpan.innerHTML = item.icon;
          link.appendChild(iconSpan);
        }

        const labelSpan = document.createElement('span');
        labelSpan.textContent = item.label;
        link.appendChild(labelSpan);

        this.dropdown!.appendChild(link);
      }

      // Add divider if specified
      if (item.dividerAfter) {
        const divider = document.createElement('div');
        divider.className = 'mobile-menu-divider';
        this.dropdown!.appendChild(divider);
      }
    });

    document.body.appendChild(overlay);
    document.body.appendChild(this.dropdown);
  }

  private hideDropdown(): void {
    document.querySelector('.mobile-menu-overlay')?.remove();
    this.dropdown?.remove();
    this.dropdown = null;
  }

  private setupEventListeners(): void {
    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.toggleMenu();
      }
    });
  }

  public destroy(): void {
    this.hideDropdown();
    this.container.innerHTML = '';
  }
}
