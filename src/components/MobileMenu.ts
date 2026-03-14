import { STRING_FACTORIES } from '../constants/strings';
import { MenuDropdown } from './MenuDropdown';
import type { MenuItem } from './MenuDropdown';
export type { MenuItem } from './MenuDropdown';

export class MobileMenu {
  private container: HTMLElement;
  private groups: MenuItem[][] = [];
  private isOpen: boolean = false;
  private menuDropdown: MenuDropdown;

  constructor(containerId: string) {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(STRING_FACTORIES.containerNotFound(containerId));
    }
    this.container = container;
    this.menuDropdown = new MenuDropdown();
    this.render();
  }

  public setItems(groups: MenuItem[][]): void {
    this.groups = groups;
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
      this.menuDropdown.hide();
    }
  }

  private showDropdown(): void {
    const button = this.container.querySelector(
      '#mobile-menu-toggle',
    ) as HTMLElement;
    this.menuDropdown.show(this.groups, {
      anchor: button,
      useOverlay: true,
      onClose: () => {
        this.isOpen = false;
        button?.setAttribute('aria-expanded', 'false');
      },
    });
  }

  public destroy(): void {
    this.menuDropdown.hide();
    this.container.innerHTML = '';
  }
}
