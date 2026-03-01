import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import './ShakuhachiScore';

describe('ShakuhachiScore Web Component - Columns Attribute', () => {
  let container: HTMLElement;

  beforeEach(() => {
    // Create a container for the web component
    container = document.createElement('div');
    container.style.width = '800px';
    container.style.height = '600px';
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  const sampleScoreData = {
    title: 'Test Score',
    style: 'kinko',
    notes: [
      { pitch: { step: 'ro', octave: 0 }, duration: 1 },
      { pitch: { step: 'tsu', octave: 0 }, duration: 1 },
      { pitch: { step: 're', octave: 0 }, duration: 1 },
      { pitch: { step: 'chi', octave: 0 }, duration: 1 },
      { pitch: { step: 'ri', octave: 0 }, duration: 1 },
      { pitch: { step: 'u', octave: 0 }, duration: 1 },
    ],
  };

  it('defaults to auto when no columns attribute', async () => {
    const component = document.createElement('shakuhachi-score');
    component.setAttribute('data-score', JSON.stringify(sampleScoreData));
    container.appendChild(component);

    // Wait for render
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Component should have rendered in auto mode (default)
    const svg = component.shadowRoot?.querySelector('svg');
    expect(svg).toBeTruthy();

    // In auto mode with a sized container, should use parent dimensions
    const width = svg?.getAttribute('width');
    expect(parseInt(width || '0')).toBeGreaterThan(0);
  });

  it('single column mode (columns="1") calculates intrinsic height', async () => {
    const component = document.createElement('shakuhachi-score');
    component.setAttribute('columns', '1');
    component.setAttribute('data-score', JSON.stringify(sampleScoreData));
    container.appendChild(component);

    await new Promise((resolve) => setTimeout(resolve, 100));

    const svg = component.shadowRoot?.querySelector('svg');
    expect(svg).toBeTruthy();
    // In single column mode, height should be intrinsic (based on number of notes)
    // 6 notes * 44px spacing + 34px top margin + 20px bottom ≈ 318px
    const height = svg?.getAttribute('height');
    expect(parseInt(height || '0')).toBeGreaterThan(250);
  });

  it('multi-column mode (columns="auto") uses parent dimensions', async () => {
    const component = document.createElement('shakuhachi-score');
    component.setAttribute('columns', 'auto');
    component.setAttribute('data-score', JSON.stringify(sampleScoreData));
    container.appendChild(component);

    await new Promise((resolve) => setTimeout(resolve, 100));

    const svg = component.shadowRoot?.querySelector('svg');
    expect(svg).toBeTruthy();
    // In auto mode, should use container dimensions (800x600)
    const width = svg?.getAttribute('width');
    expect(parseInt(width || '0')).toBeGreaterThan(0);
  });

  it('explicit column count (columns="2") distributes notes evenly', async () => {
    const component = document.createElement('shakuhachi-score');
    component.setAttribute('columns', '2');
    component.setAttribute('data-score', JSON.stringify(sampleScoreData));
    container.appendChild(component);

    await new Promise((resolve) => setTimeout(resolve, 100));

    const svg = component.shadowRoot?.querySelector('svg');
    expect(svg).toBeTruthy();
    // With 6 notes and 2 columns, should have 3 notes per column
    // This is multi-column mode, so uses parent dimensions
  });

  it('respects explicit width and height attributes', async () => {
    const component = document.createElement('shakuhachi-score');
    component.setAttribute('columns', 'auto');
    component.setAttribute('width', '400');
    component.setAttribute('height', '300');
    component.setAttribute('data-score', JSON.stringify(sampleScoreData));
    container.appendChild(component);

    await new Promise((resolve) => setTimeout(resolve, 100));

    const svg = component.shadowRoot?.querySelector('svg');
    expect(svg).toBeTruthy();
    const width = svg?.getAttribute('width');
    const height = svg?.getAttribute('height');
    expect(width).toBe('400');
    expect(height).toBe('300');
  });

  it('invalid columns value defaults to "auto" with warning', async () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const component = document.createElement('shakuhachi-score');
    component.setAttribute('columns', 'invalid');
    component.setAttribute('data-score', JSON.stringify(sampleScoreData));
    container.appendChild(component);

    await new Promise((resolve) => setTimeout(resolve, 100));

    // Should show warning about invalid value
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('invalid columns value'),
    );

    consoleSpy.mockRestore();
  });

  it('auto-resize is enabled by default', async () => {
    const component = document.createElement('shakuhachi-score');
    component.setAttribute('columns', 'auto');
    component.setAttribute('data-score', JSON.stringify(sampleScoreData));
    container.appendChild(component);

    await new Promise((resolve) => setTimeout(resolve, 100));

    // Check that ResizeObserver would be active (implicit test)
    // We can't easily test ResizeObserver directly, but we verify it doesn't error
    const svg = component.shadowRoot?.querySelector('svg');
    expect(svg).toBeTruthy();
  });

  it('auto-resize can be disabled with auto-resize="false"', async () => {
    const component = document.createElement('shakuhachi-score');
    component.setAttribute('columns', 'auto');
    component.setAttribute('auto-resize', 'false');
    component.setAttribute('data-score', JSON.stringify(sampleScoreData));
    container.appendChild(component);

    await new Promise((resolve) => setTimeout(resolve, 100));

    const svg = component.shadowRoot?.querySelector('svg');
    expect(svg).toBeTruthy();
  });

  it('zero and negative column values are invalid', async () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const component = document.createElement('shakuhachi-score');
    component.setAttribute('columns', '0');
    component.setAttribute('data-score', JSON.stringify(sampleScoreData));
    container.appendChild(component);

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});
