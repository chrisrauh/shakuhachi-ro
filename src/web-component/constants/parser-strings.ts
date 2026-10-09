/**
 * Parser and Validation Strings
 *
 * String constants and factory functions for score parsing and validation.
 * Part of the standalone renderer library.
 */

import { MERI_KARI, PITCH_STEPS } from '../types/ScoreData';

// Shared string factory functions for parser validation. Notes are numbered
// from 1, as people count them; callers pass the 0-based array index.
export const PARSER_STRING_FACTORIES = {
  invalidDuration: (duration: string) => `Invalid duration: ${duration}`,
  noteIndexError: (index: number, field: string) =>
    `Note ${index + 1} is missing ${field}`,
  noteIndexInvalid: (
    index: number,
    field: string,
    value: any,
    constraint: string,
  ) => `Note ${index + 1} has invalid ${field}: ${value}. ${constraint}`,
};

export const PARSER_STRINGS = {
  ERRORS: {
    ScoreParser: {
      scoreDataRequired: 'Score data is required',
      notesArrayRequired: 'Score notes must be an array',
      noteIndexPitchRequired: (index: number) =>
        PARSER_STRING_FACTORIES.noteIndexError(index, 'pitch'),
      noteIndexPitchWhenNotRest: (index: number) =>
        `Note ${index + 1} must have pitch when rest is not set`,
      noteIndexPitchStep: (index: number) =>
        PARSER_STRING_FACTORIES.noteIndexError(index, 'pitch.step'),
      noteIndexStepInvalid: (index: number, step: unknown) =>
        PARSER_STRING_FACTORIES.noteIndexInvalid(
          index,
          'pitch.step',
          step,
          `Must be one of: ${PITCH_STEPS.join(', ')}.`,
        ),
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
      noteIndexMeriKariInvalid: (index: number, meriKari: unknown) =>
        PARSER_STRING_FACTORIES.noteIndexInvalid(
          index,
          'meriKari',
          meriKari,
          `Must be one of: ${MERI_KARI.join(', ')}.`,
        ),
      restIndexDuration: (index: number) =>
        `Note ${index + 1} is a rest and is missing duration`,
      invalidJSON: (message: string) => `Invalid JSON: ${message}`,
      loadFailed: (message: string) => `Failed to load score: ${message}`,
      loadFailedFromURL: (message: string) =>
        `Failed to load score from URL: ${message}`,
    },

    ABCParser: {
      contentRequired: 'ABC notation content is required',
      unknownKey: (key: string) =>
        `The K: field's key, "${key}", isn't one ABC defines. Use a key such as D, Dm, D dorian or none.`,
      noNotesFound:
        'No notes found in ABC notation. Write the notes after the header fields, e.g. D F G A d.',
      unknownPitch: (pitch: string) =>
        `Unknown ABC pitch: "${pitch}". Valid pitches: D, F, G, A, C (uppercase/lowercase) with optional ^, _, =, ', or ,`,
      invalidDuration: (duration: string) =>
        PARSER_STRING_FACTORIES.invalidDuration(duration),
      loadFailed: (statusText: string) =>
        `Failed to load ABC file: ${statusText}`,
    },

    MusicXMLParser: {
      noteLocation: (measure: string, position: number) =>
        `Measure ${measure}, note ${position}`,
      outOfRange: (
        where: string,
        pitch: string,
        position: 'below' | 'above',
        range: string,
      ) =>
        `${where}: ${pitch} is ${position} the shakuhachi's range (${range})`,
      notInTable: (where: string, pitch: string) =>
        `${where}: ${pitch} has no shakuhachi fingering`,
      microtone: (where: string, letter: string, alter: number) =>
        `${where}: ${letter} is altered by ${alter} semitones, and microtones can't be imported`,
      invalidStep: (where: string) => `${where}: the pitch has no valid step`,
      noPitch: (where: string) =>
        `${where}: the note has no pitch (an unpitched note, such as percussion)`,
      chord: (where: string) =>
        `${where}: the note is part of a chord, and the shakuhachi plays one note at a time`,
      partNotChosen: (parts: number, shakuhachiParts: number) =>
        shakuhachiParts === 0
          ? `The file has ${parts} parts, and none is named shakuhachi, so it isn't clear which one to import. Name the shakuhachi part "Shakuhachi", or delete the other parts, in the source and import again.`
          : `The file has ${shakuhachiParts} parts named shakuhachi, so it isn't clear which one to import. Delete or rename all but one of them in the source and import again.`,
      multipleVoices: (measure: string) =>
        `Measure ${measure}: the part has more than one voice, and the shakuhachi plays one note at a time. Merge the voices into one, or delete the others, in the source and import again.`,
      timewise:
        "The file is timewise MusicXML, which can't be imported. Export it as partwise MusicXML (the usual kind) and import again.",
      unplayableNotes: (first: string, others: number) =>
        others === 0
          ? `${first}. Change or transpose it in the source and import again.`
          : `${first}, and ${others} other ${others === 1 ? 'note' : 'notes'} can't be imported either. Change or transpose them in the source and import again.`,
      loadFailed: (statusText: string) =>
        `Failed to load MusicXML file: ${statusText}`,
    },

    Serializer: {
      invalidFingering: (index: number, format: string) =>
        `Note ${index + 1} has a step, octave or meri/kari mark that isn't valid, so the score can't be converted to ${format}. Fix that note, or keep the score in its current format.`,
      unknownABCKey: (key: string) =>
        `The score's key, "${key}", isn't one ABC defines, so the score can't be converted to ABC. Change it to a key such as D, Dm or D dorian.`,
    },
  },
} as const;
