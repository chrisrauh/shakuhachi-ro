/**
 * Convenience functions for quick score rendering
 *
 * Simple one-line functions that wrap ScoreRenderer for common use cases.
 * Following VexFlow pattern of providing both class-based and functional APIs.
 */

import { ScoreRenderer } from './ScoreRenderer';
import type { RenderOptions } from './RenderOptions';
import type { ScoreData } from '../types/ScoreData';

/**
 * Renders a score from a MusicXML URL into a container element
 *
 * One-line convenience function that creates a ScoreRenderer and
 * calls renderFromURL().
 *
 * @param container - DOM element to render into
 * @param url - URL to MusicXML file
 * @param options - Optional render configuration
 * @returns ScoreRenderer instance for further manipulation
 *
 * @example
 * ```typescript
 * // Simple usage
 * await renderScoreFromURL(
 *   document.getElementById('score-container'),
 *   '/data/Akatombo.musicxml'
 * );
 *
 * // With options
 * const renderer = await renderScoreFromURL(
 *   container,
 *   '/data/Akatombo.musicxml',
 *   { showOctaveMarks: false, notesPerColumn: 8 }
 * );
 * ```
 */
export async function renderScoreFromURL(
  container: HTMLElement,
  url: string,
  options?: RenderOptions
): Promise<ScoreRenderer> {
  const renderer = new ScoreRenderer(container, options);
  await renderer.renderFromURL(url);
  return renderer;
}

/**
 * Renders a score from ScoreData into a container element
 *
 * One-line convenience function that creates a ScoreRenderer and
 * calls renderFromScoreData().
 *
 * @param container - DOM element to render into
 * @param scoreData - Parsed score data object
 * @param options - Optional render configuration
 * @returns ScoreRenderer instance for further manipulation
 *
 * @example
 * ```typescript
 * const scoreData = {
 *   title: 'My Score',
 *   style: 'kinko',
 *   notes: [
 *     { pitch: { step: 'ro', octave: 0 }, duration: 1 },
 *     { pitch: { step: 'tsu', octave: 0 }, duration: 1 }
 *   ]
 * };
 *
 * const renderer = await renderScore(container, scoreData);
 * ```
 */
export async function renderScore(
  container: HTMLElement,
  scoreData: ScoreData,
  options?: RenderOptions
): Promise<ScoreRenderer> {
  const renderer = new ScoreRenderer(container, options);
  await renderer.renderFromScoreData(scoreData);
  return renderer;
}
