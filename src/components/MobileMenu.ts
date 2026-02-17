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
      .mobile-menu-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.3);
        z-index: 999;
      }

      .mobile-menu-dropdown {
        position: fixed;
        top: 48px;
        right: var(--spacing-medium);
        background: var(--panel-background-color);
        border: var(--panel-border-width) solid var(--panel-border-color);
        border-radius: 6px;
        box-shadow: var(--shadow-large);
        z-index: 1000;
        min-width: 192px;
        padding: var(--spacing-2x-small) 0;
      }

      .mobile-menu-item {
        width: 100%;
        padding: var(--spacing-x-small) var(--spacing-small);
        background: none;
        border: none;
        text-align: left;
        cursor: pointer;
        font-size: var(--font-size-small);
        color: var(--color-neutral-700);
        transition: background var(--transition-fast);
        display: flex;
        align-items: center;
        gap: var(--spacing-x-small);
        text-decoration: none;
      }

      .mobile-menu-item:hover {
        background: var(--color-neutral-100);
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
