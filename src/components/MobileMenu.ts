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

    const button = this.container.querySelector('#mobile-menu-toggle');
    button?.addEventListener('click', () => this.toggleMenu());
  }

  public setItems(groups: MenuItem[][]): void {
    this.groups = groups;
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
