/**
 * User-Facing Strings for Platform UI Components
 *
 * Centralized string constants and factory functions for toasts, alerts, and UI feedback.
 * Includes error messages, success messages, warnings, and informational text.
 */

// Shared string factory functions for common patterns
export const STRING_FACTORIES = {
  /**
   * Component initialization error when DOM element not found
   * Used by: ScoreEditor, AuthComponents, ScoreLibrary, etc.
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
      loadError: (message: string) => `Error loading score: ${message}`,
      loadNotFound: 'Score not found',
      saveLoginRequired: 'Please sign in to save scores',
      saveValidationFailed: 'Please fix validation errors before saving',
      saveError: (message: string) => `Error saving score: ${message}`,
      autoSaveFailed: (message: string) => `Auto-save failed: ${message}`,
      createScoreFailed: 'Failed to create score. Please try again.',
      editPermissionDenied: 'You do not have permission to edit this score.',
    },

    ScoreDetailClient: {
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
    ScoreEditor: {
      invalidMusicXML: 'Invalid MusicXML format',
      invalidFormat: 'Invalid format',
    },
  },

  SUCCESS: {
    ScoreEditor: {
      scoreSaved: (isEditing: boolean) =>
        `Score ${isEditing ? 'updated' : 'created'} successfully!`,
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
        message: (fromFormat: string, toFormat: string) =>
          `Could not convert ${fromFormat} to ${toFormat}. Clear content and switch format?`,
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
