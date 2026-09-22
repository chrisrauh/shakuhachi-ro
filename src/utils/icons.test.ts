import { describe, it, expect, beforeEach } from 'vitest';
import { initIcons, renderIcon } from './icons';

/**
 * The createIcons registry only replaces elements carrying a matching
 * data-lucide attribute, so it must stay in sync with the names passed to
 * renderIcon(). An icon missing from the registry fails silently — the
 * placeholder <i> is simply left in the DOM.
 */
describe('initIcons', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('replaces every icon name the app renders via renderIcon', () => {
    const namesInUse = ['git-fork', 'circle-help', 'alert-circle'];
    document.body.innerHTML = namesInUse.map((n) => renderIcon(n)).join('');

    initIcons();

    expect(document.querySelectorAll('svg')).toHaveLength(namesInUse.length);
    expect(document.querySelectorAll('i[data-lucide]')).toHaveLength(0);
  });

  it('leaves placeholders for names that are not registered', () => {
    document.body.innerHTML = renderIcon('not-a-registered-icon');

    initIcons();

    expect(document.querySelectorAll('svg')).toHaveLength(0);
  });
});
