/**
 * Unit tests for SVGRenderer group management
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SVGRenderer } from './SVGRenderer';

describe('SVGRenderer groups', () => {
  let renderer: SVGRenderer;
  let svg: SVGSVGElement;

  beforeEach(() => {
    renderer = new SVGRenderer(document.createElement('div'), 100, 100);
    svg = renderer.getSVG();
  });

  it('draws into an open group and back into the root after closing it', () => {
    const group = renderer.openGroup('note', 'note-1');
    const inside = renderer.drawRect(0, 0, 1, 1);
    renderer.closeGroup();
    const outside = renderer.drawRect(0, 0, 1, 1);

    expect(group.parentNode).toBe(svg);
    expect(group.getAttribute('class')).toBe('note');
    expect(group.getAttribute('id')).toBe('note-1');
    expect(inside.parentNode).toBe(group);
    expect(outside.parentNode).toBe(svg);
  });

  it('nests groups and returns to the outer group when the inner one closes', () => {
    const outer = renderer.openGroup();
    const inner = renderer.openGroup();
    const deep = renderer.drawRect(0, 0, 1, 1);
    renderer.closeGroup();
    const shallow = renderer.drawRect(0, 0, 1, 1);
    renderer.closeGroup();

    expect(outer.parentNode).toBe(svg);
    expect(inner.parentNode).toBe(outer);
    expect(deep.parentNode).toBe(inner);
    expect(shallow.parentNode).toBe(outer);
  });

  it('places consecutive groups side by side, not nested', () => {
    const first = renderer.openGroup();
    renderer.closeGroup();
    const second = renderer.openGroup();
    renderer.closeGroup();

    expect(first.parentNode).toBe(svg);
    expect(second.parentNode).toBe(svg);
    expect(Array.from(svg.children)).toEqual([first, second]);
  });

  it('throws when closeGroup is called with no open group', () => {
    expect(() => renderer.closeGroup()).toThrow(/no groups are open/);

    renderer.openGroup();
    renderer.closeGroup();
    expect(() => renderer.closeGroup()).toThrow(/no groups are open/);
  });

  it('resets the group stack on clear()', () => {
    renderer.openGroup();
    renderer.clear();

    expect(() => renderer.closeGroup()).toThrow(/no groups are open/);
    expect(renderer.drawRect(0, 0, 1, 1).parentNode).toBe(svg);
  });
});
