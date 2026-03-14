import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MenuDropdown } from './MenuDropdown';
import type { MenuItem } from './MenuDropdown';

const twoGroups: MenuItem[][] = [
  [{ id: 'a', label: 'Item A', action: () => {} }],
  [{ id: 'b', label: 'Item B', href: '/b' }],
];

describe('MenuDropdown', () => {
  let dropdown: MenuDropdown;

  beforeEach(() => {
    document.body.innerHTML = '';
    dropdown = new MenuDropdown();
  });

  afterEach(() => {
    dropdown.hide();
  });

  it('isOpen is false before show()', () => {
    expect(dropdown.isOpen).toBe(false);
  });

  it('isOpen is true after show()', () => {
    dropdown.show(twoGroups, { onClose: () => {} });
    expect(dropdown.isOpen).toBe(true);
  });

  it('isOpen is false after hide()', () => {
    dropdown.show(twoGroups, { onClose: () => {} });
    dropdown.hide();
    expect(dropdown.isOpen).toBe(false);
  });

  it('renders items with .menu-dropdown-item class', () => {
    dropdown.show(twoGroups, { onClose: () => {} });
    expect(document.querySelectorAll('.menu-dropdown-item')).toHaveLength(2);
  });

  it('renders one divider between two groups', () => {
    dropdown.show(twoGroups, { onClose: () => {} });
    expect(document.querySelectorAll('.menu-dropdown-divider')).toHaveLength(1);
  });

  it('renders no divider for a single group', () => {
    dropdown.show([twoGroups[0]], { onClose: () => {} });
    expect(document.querySelectorAll('.menu-dropdown-divider')).toHaveLength(0);
  });

  it('renders header text when provided', () => {
    dropdown.show(twoGroups, { header: 'user@example.com', onClose: () => {} });
    const header = document.querySelector('.menu-dropdown-header');
    expect(header).not.toBeNull();
    expect(header!.textContent).toBe('user@example.com');
  });

  it('renders no header when not provided', () => {
    dropdown.show(twoGroups, { onClose: () => {} });
    expect(document.querySelector('.menu-dropdown-header')).toBeNull();
  });

  it('creates overlay when useOverlay is true', () => {
    dropdown.show(twoGroups, { useOverlay: true, onClose: () => {} });
    expect(document.querySelector('.menu-dropdown-overlay')).not.toBeNull();
  });

  it('creates no overlay when useOverlay is false', () => {
    dropdown.show(twoGroups, { useOverlay: false, onClose: () => {} });
    expect(document.querySelector('.menu-dropdown-overlay')).toBeNull();
  });

  it('calls onClose when hide() is called', () => {
    let closed = false;
    dropdown.show(twoGroups, {
      onClose: () => {
        closed = true;
      },
    });
    dropdown.hide();
    expect(closed).toBe(true);
  });

  it('onClose is called only once even if hide() is called twice', () => {
    let count = 0;
    dropdown.show(twoGroups, { onClose: () => count++ });
    dropdown.hide();
    dropdown.hide(); // second call must be a no-op
    expect(count).toBe(1);
  });

  it('action items call the action when clicked then close', () => {
    let clicked = false;
    const groups: MenuItem[][] = [
      [{ id: 'x', label: 'Click me', action: () => (clicked = true) }],
    ];
    dropdown.show(groups, { onClose: () => {} });
    (
      document.querySelector('.menu-dropdown-item') as HTMLButtonElement
    ).click();
    expect(clicked).toBe(true);
    expect(dropdown.isOpen).toBe(false);
  });

  it('link items render as <a> elements', () => {
    const groups: MenuItem[][] = [[{ id: 'x', label: 'Go', href: '/go' }]];
    dropdown.show(groups, { onClose: () => {} });
    expect(document.querySelector('.menu-dropdown-item')?.tagName).toBe('A');
  });

  it('removes dropdown from DOM after hide()', () => {
    dropdown.show(twoGroups, { onClose: () => {} });
    dropdown.hide();
    expect(document.querySelector('.menu-dropdown')).toBeNull();
  });
});
