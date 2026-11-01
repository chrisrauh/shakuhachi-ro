/**
 * User-Facing Strings for Platform UI Components
 *
 * Centralized string constants and factory functions for toasts, alerts, and UI feedback.
 * Includes error messages, success messages, warnings, and informational text.
 */

import type { ScoreDataFormat } from '../api/scores';

/** Each score format's name, as the editor shows it */
export const FORMAT_NAMES: Record<ScoreDataFormat, string> = {
  json: 'JSON',
  musicxml: 'MusicXML',
  abc: 'ABC',
};

/**
 * The line under the source view for a format that is only a view: what a
 * score pasted in that format loses when it is saved as JSON (#459, #464).
 */
export const FORMAT_NOT_KEPT: Partial<Record<ScoreDataFormat, string>> = {
  musicxml:
    "Saved as JSON. Bar lines, time and key signatures, lyrics, other parts and layout aren't kept.",
  abc: "Saved as JSON. Bar lines, the time signature, chord symbols, slurs, decorations and comments aren't kept, and repeats are written out.",
};

// Shared string factory functions for common patterns
export const STRING_FACTORIES = {
  /**
   * Component initialization error when DOM element not found
   * Used by: AuthComponents, ScoreLibrary, etc.
   */
  containerNotFound: (containerId: string) =>
    `Container with id "${containerId}" not found`,

  /**
   * Generic API error with dynamic message
   */
  apiError: (operation: string, message: string) =>
    `Error ${operation}: ${message}`,
};

export const STRINGS = {
  ERRORS: {
    ScoreEditor: {
      saveLoginRequired: 'Please sign in to save scores',
      saveValidationFailed: 'Please fix validation errors before saving',
      saveError: (message: string) => `Error saving score: ${message}`,
      autoSaveFailed: (message: string) => `Auto-save failed: ${message}`,
      createScoreFailed: 'Failed to create score. Please try again.',
      editPermissionDenied: 'You do not have permission to edit this score.',
    },

    ScoreDetailClient: {
      parseError: 'Failed to load score data',
      forkLoginRequired: 'Please sign in to fork this score',
      forkError: (message: string) => `Error forking score: ${message}`,
      forkFailed: 'Failed to fork score',
      deleteError: (message: string) => `Error deleting score: ${message}`,
    },

    FormatConverter: {
      unsupportedInput: (format: string) =>
        `Unsupported input format: ${format}`,
      unsupportedOutput: (format: string) =>
        `Unsupported output format: ${format}`,
    },
  },

  VALIDATION: {
    scoreInput: {
      invalidMusicXML: 'Invalid MusicXML format',
      invalidFormat: 'Invalid format',
      formatSwitchFailed: (format: ScoreDataFormat, reason: string) =>
        `Can't switch to ${FORMAT_NAMES[format]}. ${reason}`.trim(),
    },
  },

  WARNINGS: {
    ScoreEditor: {
      autosaveRestoreFailed:
        'Could not restore auto-saved draft. Starting with a blank score.',
    },
  },

  DIALOGS: {
    ScoreDetailClient: {
      deleteScore: {
        title: 'Delete score',
        message: (title: string) => `Delete '${title}'? This cannot be undone.`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
      },
      forkScore: {
        title: 'Fork score',
        message: (title: string) =>
          `Fork '${title}'? This creates your own editable copy.`,
        confirmText: 'Fork',
        cancelText: 'Cancel',
      },
    },
  },
} as const;
