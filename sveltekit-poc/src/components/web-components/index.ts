/**
 * Web Components for Shakuhachi.ro
 *
 * These components are built with Lit and can be used in any framework
 * (SvelteKit, React, Vue, vanilla JS, etc.)
 */

export { MusicNote } from './music-note.js';
export { MusicEditor } from './music-editor.js';

// Auto-register all components when this module is imported
import './music-note.js';
import './music-editor.js';
