/**
 * Parser and Validation Strings
 *
 * String constants and factory functions for score parsing and validation.
 * Part of the standalone renderer library.
 */

// Shared string factory functions for parser validation
export const PARSER_STRING_FACTORIES = {
  invalidDuration: (duration: string) => `Invalid duration: ${duration}`,
  noteIndexError: (index: number, field: string) =>
    `Note at index ${index} is missing ${field}`,
  noteIndexInvalid: (
    index: number,
    field: string,
    value: any,
    constraint: string,
  ) => `Note at index ${index} has invalid ${field}: ${value}. ${constraint}`,
};

export const PARSER_STRINGS = {
  ERRORS: {
    ScoreParser: {
      scoreDataRequired: 'Score data is required',
      notesArrayRequired: 'Score notes must be an array',
      notesEmptyArray: 'Score must contain at least one note',
      noteIndexPitchRequired: (index: number) =>
        PARSER_STRING_FACTORIES.noteIndexError(index, 'pitch'),
      noteIndexPitchWhenNotRest: (index: number) =>
        `Note at index ${index} must have pitch when rest is not set`,
      noteIndexPitchStep: (index: number) =>
        PARSER_STRING_FACTORIES.noteIndexError(index, 'pitch.step'),
      noteIndexPitchOctave: (index: number) =>
        PARSER_STRING_FACTORIES.noteIndexError(index, 'pitch.octave'),
      noteIndexDuration: (index: number) =>
        PARSER_STRING_FACTORIES.noteIndexError(index, 'duration'),
      noteIndexOctaveInvalid: (index: number, octave: number) =>
        PARSER_STRING_FACTORIES.noteIndexInvalid(
          index,
          'octave',
          octave,
          'Must be 0-2.',
        ),
      noteIndexDurationInvalid: (index: number, duration: number) =>
        PARSER_STRING_FACTORIES.noteIndexInvalid(
          index,
          'duration',
          duration,
          'Must be > 0.',
        ),
      restIndexDuration: (index: number) =>
        `Rest at index ${index} is missing duration`,
      invalidJSON: (message: string) => `Invalid JSON: ${message}`,
      loadFailed: (message: string) => `Failed to load score: ${message}`,
      loadFailedFromURL: (message: string) =>
        `Failed to load score from URL: ${message}`,
    },

    ABCParser: {
      contentRequired: 'ABC notation content is required',
      keyFieldRequired: 'ABC notation must include K: (key) field',
      noNotesFound:
        'No notes found in ABC notation. Ensure K: field is followed by note data.',
      unknownPitch: (pitch: string) =>
        `Unknown ABC pitch: "${pitch}". Valid pitches: D, F, G, A, C (uppercase/lowercase) with optional ^, _, =, ', or ,`,
      invalidDuration: (duration: string) =>
        PARSER_STRING_FACTORIES.invalidDuration(duration),
      loadFailed: (statusText: string) =>
        `Failed to load ABC file: ${statusText}`,
    },

    MusicXMLParser: {
      loadFailed: (statusText: string) =>
        `Failed to load MusicXML file: ${statusText}`,
    },
  },
} as const;
