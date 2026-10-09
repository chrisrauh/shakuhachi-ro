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
      renderError: 'Failed to display score',
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
    },
  },

  WARNINGS: {
    ScoreEditor: {
      autosaveRestoreFailed:
        'Could not restore auto-saved draft. Starting with a blank score.',
    },
  },

  DIALOGS: {
    ScoreEditor: {
      formatConversionFailed: {
        title: 'Format Conversion Failed',
        message: (
          fromFormat: ScoreDataFormat,
          toFormat: ScoreDataFormat,
          reason: string,
        ) =>
          `Could not convert ${FORMAT_NAMES[fromFormat]} to ${FORMAT_NAMES[toFormat]}. ${reason ? `${reason.replace(/\.?$/, '.')} ` : ''}Clear content and switch format?`,
        confirmText: 'Clear and Switch',
        cancelText: 'Keep Current Format',
      },
    },

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
