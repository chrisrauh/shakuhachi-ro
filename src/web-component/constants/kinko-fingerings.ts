/**
 * Kinko-ryū fingering table for a D shakuhachi (1.8 shaku)
 *
 * Every fingering in Koga's chart (Masayuki Koga, "Shakuhachi: Japanese
 * Bamboo Flute", vol. II, pp. 107–108), transcribed in
 * reference/fingering-charts/koga-inventory.md. Each row gives the written
 * Western note, the holes and the chin position. Named fingerings also give
 * what a score writes for them: character, register and accidental. Unnamed rows
 * are alternative fingerings for their pitch, kept for fingering diagrams.
 *
 * MusicXML and ABC import and export all read this table. Import gives each
 * pitch its default fingering; export writes each named fingering as its
 * pitch, so our own files read back exactly. Meri and kari only approximate
 * Western pitches, and players choose fingerings by school, piece and
 * context, so an imported score is a starting point its author corrects.
 * Community review of the table is #423.
 */

import {
  ACCIDENTALS,
  CHARACTERS,
  type Accidental,
  type Character,
} from '../types/ScoreData';
import { kinkoMap, pitchToMidi } from './kinko-symbols';

/** What a score writes for a fingering */
export interface WrittenFingering {
  character: Character;
  /** 0 otsu, 1 kan, 2 daikan */
  register: number;
  accidental?: Accidental;
}

export interface Fingering {
  /** Column number in Koga's chart. Absent for a row from another chart */
  koga?: number;
  /** The chart a row comes from, where it isn't Koga's */
  source?: string;
  /** Written Western note, e.g. 'C#5' */
  pitch: string;
  /**
   * Holes in the order players count them: front holes 1 (nearest the
   * bottom of the flute) to 4, then the back (thumb) hole 5. ● closed,
   * ○ open, ◐ half, ◕ mostly and ◔ slightly covered. Charts draw the holes
   * top to bottom, so read a chart from the bottom up to compare (#509)
   */
  holes: string;
  /**
   * How far the chin lowers (meri) or raises (kari) the pitch. Undefined
   * where no chart says. Not always the written mark: u is played meri.
   */
  chin?: Accidental | 'neutral';
  /** What a score writes. Absent for Koga's unnamed alternatives */
  written?: WrittenFingering;
  /** The fingering import gives this pitch. One per pitch */
  default?: true;
  /**
   * How sure the transcription is: how clearly the row was read, and whether
   * other charts agree. For the community review in #423
   */
  confidence: 'high' | 'medium' | 'low';
  /** Why that confidence */
  why: string;
}

/**
 * Koga's 84 fingerings, in his order, then fingerings other charts name
 * where Koga doesn't, then other charts' holes for fingerings Koga names. A
 * fingering with several rows has several sets of holes, all at one pitch. Chin positions come from Koga's
 * "Meri" and "Kari" labels (vol. I, pp. 37 and 39), from the name, or are
 * inferred; the inventory says which. #76 is unnamed in Koga and takes its
 * name, re meri in daikan, from the Nyokai-An chart.
 */
// prettier-ignore
export const FINGERINGS: readonly Fingering[] = [
  { koga: 1, pitch: 'C4', holes: '●●●●●', chin: 'dai-meri', written: { character: 'ro', register: 0, accidental: 'dai-meri' }, default: true, confidence: 'high', why: "Clear in Koga's chart; every chart gives all holes closed for ro's meri forms" },
  { koga: 2, pitch: 'C#4', holes: '●●●●●', chin: 'meri', written: { character: 'ro', register: 0, accidental: 'meri' }, default: true, confidence: 'high', why: "Clear in Koga's chart (図, ro meri). Nyokai-An names C♯ ro chu-meri; schools differ on the name, not the holes" },
  { koga: 3, pitch: 'D4', holes: '●●●●●', chin: 'neutral', written: { character: 'ro', register: 0 }, default: true, confidence: 'high', why: "Clear in Koga's chart; Koga's p37 shows the same holes" },
  { koga: 4, pitch: 'D4', holes: '◕●●●●', chin: 'dai-meri', written: { character: 'tsu', register: 0, accidental: 'dai-meri' }, confidence: 'high', why: "Clear in Koga's chart; Nyokai-An gives the same holes and pitch" },
  { koga: 5, pitch: 'D#4', holes: '◕●●●●', chin: 'meri', written: { character: 'tsu', register: 0, accidental: 'meri' }, default: true, confidence: 'high', why: "Clear in Koga's chart; Koga's p37 shows the same holes" },
  { koga: 6, pitch: 'E4', holes: '◐●●●●', chin: 'chu-meri', written: { character: 'tsu', register: 0, accidental: 'chu-meri' }, default: true, confidence: 'high', why: "Clear in Koga's chart; Koga's p37 shows the same holes" },
  { koga: 7, pitch: 'F4', holes: '○●●●●', chin: 'neutral', written: { character: 'tsu', register: 0 }, default: true, confidence: 'high', why: "Clear in Koga's chart; Koga's p37 shows the same holes" },
  { koga: 8, pitch: 'F4', holes: '◔◐●●●', chin: 'dai-meri', written: { character: 're', register: 0, accidental: 'dai-meri' }, confidence: 'high', why: "Clear in Koga's chart; Nyokai-An gives the same holes at F, but calls it re meri" },
  { koga: 9, pitch: 'F#4', holes: '○◐●●●', chin: 'meri', written: { character: 're', register: 0, accidental: 'meri' }, default: true, confidence: 'high', why: "Clear in Koga's chart; Koga's p39 shows the same holes" },
  { koga: 10, pitch: 'G4', holes: '○○●●●', chin: 'neutral', written: { character: 're', register: 0 }, default: true, confidence: 'high', why: "Clear in Koga's chart; Koga's p37 shows the same holes" },
  { koga: 11, pitch: 'G4', holes: '○○◐●●', chin: 'meri', written: { character: 'u', register: 0, accidental: 'meri' }, confidence: 'high', why: "Clear in Koga's chart; Nyokai-An lists the same holes for u meri" },
  { koga: 12, pitch: 'G#4', holes: '●●○●●', chin: 'meri', written: { character: 'u', register: 0 }, default: true, confidence: 'high', why: "Clear in Koga's chart; Koga's p39 shows the same holes" },
  { koga: 13, pitch: 'G#4', holes: '○○◕●●', chin: undefined, confidence: 'high', why: "Unnamed in Koga; Nyokai-An gives similar holes for u at A♭4" },
  { koga: 14, pitch: 'G#4', holes: '○●◕●●', chin: undefined, confidence: 'high', why: "Unnamed in Koga; Nyokai-An gives similar holes for u at A♭4" },
  { koga: 15, pitch: 'G#4', holes: '●●◔●●', chin: undefined, confidence: 'medium', why: "Unnamed in Koga and in no other chart; pitch from Koga's grouping, and partial covers read from a photo" },
  { koga: 16, pitch: 'A4', holes: '○○○●●', chin: 'neutral', written: { character: 'chi', register: 0 }, default: true, confidence: 'high', why: "Clear in Koga's chart; Koga's p37 shows the same holes" },
  { koga: 17, pitch: 'A4', holes: '○○○◕●', chin: 'meri', confidence: 'medium', why: "Unnamed in Koga and in no other chart; pitch from Koga's grouping, and partial covers read from a photo" },
  { koga: 18, pitch: 'A4', holes: '●○○●●', chin: undefined, confidence: 'medium', why: "Unnamed in Koga and in no other chart; pitch from Koga's grouping, and partial covers read from a photo" },
  { koga: 19, pitch: 'A#4', holes: '○○○◕●', chin: 'meri', written: { character: 'ri', register: 0, accidental: 'meri' }, default: true, confidence: 'high', why: "Clear in Koga's chart; Koga's p37 shows the same holes" },
  { koga: 20, pitch: 'A#4', holes: '●●○◕●', chin: undefined, confidence: 'high', why: "Unnamed in Koga; Nyokai-An and fingchart6 give these holes for ri meri at B♭4" },
  { koga: 21, pitch: 'B4', holes: '○○○◔●', chin: 'chu-meri', written: { character: 'ri', register: 0, accidental: 'chu-meri' }, default: true, confidence: 'medium', why: "Clear in Koga's chart, but Koga's p39 and Nyokai-An give ●●○◔● for ri chu-meri; both are stored" },
  { koga: 22, pitch: 'B4', holes: '●●○○●', chin: 'meri', confidence: 'medium', why: "Unnamed in Koga; its pitch, B4, follows from the C5 note being over the next column, across the row break" },
  { koga: 23, pitch: 'C5', holes: '●●○○●', chin: 'neutral', written: { character: 'ri', register: 0 }, default: true, confidence: 'high', why: "Clear in Koga's chart; Koga's p37 shows the same holes" },
  { koga: 24, pitch: 'C5', holes: '●○○○◐', chin: undefined, confidence: 'medium', why: "Unnamed in Koga and in no other chart; pitch from Koga's grouping, and partial covers read from a photo" },
  { koga: 25, pitch: 'C5', holes: '○○○○●', chin: undefined, confidence: 'medium', why: "Unnamed in Koga and in no other chart; pitch from Koga's grouping, and partial covers read from a photo" },
  { koga: 26, pitch: 'C#5', holes: '●●○○◐', chin: 'meri', written: { character: 'go-no-hi', register: 0, accidental: 'meri' }, confidence: 'high', why: "Clear in Koga's chart; shak-fingering agrees. Nyokai-An names these holes go no hi meri at C instead" },
  { koga: 27, pitch: 'C#5', holes: '○●●○○', chin: undefined, confidence: 'medium', why: "Unnamed in Koga and in no other chart; pitch from Koga's grouping, and partial covers read from a photo" },
  { koga: 28, pitch: 'C#5', holes: '○○○○○', chin: undefined, confidence: 'medium', why: "Unnamed in Koga; same holes as #32 a semitone higher, so the chin must make the difference" },
  { koga: 29, pitch: 'C#5', holes: '●●●●●', chin: 'meri', written: { character: 'ro', register: 1, accidental: 'meri' }, default: true, confidence: 'high', why: "Clear in Koga's chart; same holes as otsu ro meri, which every chart agrees on" },
  { koga: 30, pitch: 'D5', holes: '●●●●●', chin: 'neutral', written: { character: 'ro', register: 1 }, default: true, confidence: 'high', why: "Clear in Koga's chart; Koga's p37 shows the same holes" },
  { koga: 31, pitch: 'D5', holes: '●●○○○', chin: 'neutral', written: { character: 'go-no-hi', register: 0 }, confidence: 'high', why: "Clear in Koga's chart; Koga's p39 shows the same holes" },
  { koga: 32, pitch: 'D5', holes: '○○○○○', chin: undefined, confidence: 'medium', why: "Unnamed in Koga; same holes as #28 a semitone lower" },
  { koga: 33, pitch: 'D5', holes: '◕●●●●', chin: 'dai-meri', written: { character: 'tsu', register: 1, accidental: 'dai-meri' }, confidence: 'high', why: "Koga's holes, unnamed there; Nyokai-An names them tsu dai-meri at D5" },
  { koga: 34, pitch: 'D#5', holes: '◕●●●●', chin: 'meri', written: { character: 'tsu', register: 1, accidental: 'meri' }, default: true, confidence: 'high', why: "Clear in Koga's chart; Koga's p37 shows the same holes" },
  { koga: 35, pitch: 'D#5', holes: '◕●●●◐', chin: undefined, confidence: 'medium', why: "Unnamed in Koga and in no other chart; pitch from Koga's grouping, and partial covers read from a photo" },
  { koga: 36, pitch: 'D#5', holes: '●●●○○', chin: 'kari', written: { character: 'ro', register: 1, accidental: 'kari' }, confidence: 'high', why: "Koga's holes, unnamed there; Nyokai-An and shak-fingering name them ro kari at E♭5" },
  { koga: 37, pitch: 'E5', holes: '◐●●●●', chin: 'chu-meri', written: { character: 'tsu', register: 1, accidental: 'chu-meri' }, default: true, confidence: 'high', why: "Clear in Koga's chart; Koga's p37 shows the same holes" },
  { koga: 38, pitch: 'E5', holes: '○●●●●', chin: 'chu-meri', written: { character: 'tsu', register: 1, accidental: 'chu-meri' }, confidence: 'high', why: "Koga's holes, unnamed there; Nyokai-An lists them as tsu chu-meri in both octaves" },
  { koga: 39, pitch: 'F5', holes: '○●●●●', chin: 'neutral', written: { character: 'tsu', register: 1 }, default: true, confidence: 'high', why: "Clear in Koga's chart; Koga's p37 shows the same holes" },
  { koga: 40, pitch: 'F5', holes: '◐◕●●●', chin: undefined, confidence: 'high', why: "Unnamed in Koga; Nyokai-An gives these holes at F (its re meri)" },
  { koga: 41, pitch: 'F#5', holes: '○◐●●●', chin: 'meri', written: { character: 're', register: 1, accidental: 'meri' }, default: true, confidence: 'high', why: "Clear in Koga's chart; Koga's p39 shows the same holes" },
  { koga: 42, pitch: 'F#5', holes: '●○●●●', chin: 'chu-meri', written: { character: 'ni-no-re', register: 1 }, confidence: 'medium', why: "Koga's holes, unnamed there; only the B.C. chart names them, ni no re at G♭5" },
  { koga: 43, pitch: 'G5', holes: '○○●●●', chin: 'neutral', written: { character: 're', register: 1 }, default: true, confidence: 'high', why: "Clear in Koga's chart; Koga's p37 shows the same holes" },
  { koga: 44, pitch: 'G5', holes: '○●◐●●', chin: undefined, confidence: 'medium', why: "Unnamed in Koga and in no other chart; pitch from Koga's grouping, and partial covers read from a photo" },
  { koga: 45, pitch: 'G#5', holes: '○○◐●●', chin: 'meri', written: { character: 'chi', register: 1, accidental: 'meri' }, default: true, confidence: 'high', why: "Clear in Koga's chart; Koga's p39 shows the same holes" },
  { koga: 46, pitch: 'G#5', holes: '○●○●●', chin: undefined, confidence: 'low', why: "Unnamed in Koga at A♭5, but Nyokai-An places these holes at G5 (ichi san no u)" },
  { koga: 47, pitch: 'G#5', holes: '○○◔●●', chin: undefined, confidence: 'medium', why: "Unnamed in Koga and in no other chart; pitch from Koga's grouping, and partial covers read from a photo" },
  { koga: 48, pitch: 'G#5', holes: '○●◔●●', chin: undefined, confidence: 'medium', why: "Unnamed in Koga and in no other chart; pitch from Koga's grouping, and partial covers read from a photo" },
  { koga: 49, pitch: 'A5', holes: '○○○●●', chin: 'neutral', written: { character: 'chi', register: 1 }, default: true, confidence: 'high', why: "Clear in Koga's chart; Koga's p37 shows the same holes" },
  { koga: 50, pitch: 'A5', holes: '●●○●●', chin: 'kari', confidence: 'high', why: "Unnamed in Koga; the B.C. chart gives these holes at A5" },
  { koga: 51, pitch: 'A5', holes: '○○○◕●', chin: 'meri', confidence: 'medium', why: "Unnamed in Koga and in no other chart; pitch from Koga's grouping, and partial covers read from a photo" },
  { koga: 52, pitch: 'A#5', holes: '○○○◕●', chin: 'meri', written: { character: 'hi', register: 1, accidental: 'meri' }, default: true, confidence: 'high', why: "Clear in Koga's chart; Koga's p37 shows the same holes" },
  { koga: 53, pitch: 'A#5', holes: '●●○●●', chin: 'kari', written: { character: 'san-no-u', register: 1 }, confidence: 'high', why: "Clear in Koga's chart; Koga's p39 shows the same holes" },
  { koga: 54, pitch: 'A#5', holes: '●●○◕●', chin: undefined, confidence: 'high', why: "Unnamed in Koga; Nyokai-An gives these holes for hi meri at B♭5" },
  { koga: 55, pitch: 'A#5', holes: '●○○◕●', chin: undefined, confidence: 'high', why: "Unnamed in Koga; Nyokai-An gives these holes for hi meri at B♭5" },
  { koga: 56, pitch: 'B5', holes: '●●○◔●', chin: 'chu-meri', written: { character: 'hi', register: 1, accidental: 'chu-meri' }, default: true, confidence: 'high', why: "Clear in Koga's chart; Koga's p39 shows the same holes" },
  { koga: 57, pitch: 'B5', holes: '●●○○●', chin: 'meri', confidence: 'medium', why: "Unnamed in Koga and in no other chart; pitch from Koga's grouping, and partial covers read from a photo" },
  { koga: 58, pitch: 'B5', holes: '○○○○●', chin: undefined, confidence: 'medium', why: "Unnamed in Koga and in no other chart; pitch from Koga's grouping, and partial covers read from a photo" },
  { koga: 59, pitch: 'B5', holes: '●●●○●', chin: 'meri', written: { character: 'yon-no-hi', register: 1 }, confidence: 'medium', why: "Koga's holes, unnamed there; only the B.C. chart names them, yon no hi at B5" },
  { koga: 60, pitch: 'C6', holes: '●●○○●', chin: 'neutral', written: { character: 'hi', register: 1 }, default: true, confidence: 'high', why: "Clear in Koga's chart; Koga's p37 shows the same holes" },
  { koga: 61, pitch: 'C6', holes: '●○○○●', chin: 'neutral', written: { character: 'hi', register: 1 }, confidence: 'high', why: "Koga's holes, unnamed there; Nyokai-An and fingchart6 list them as hi" },
  { koga: 62, pitch: 'C6', holes: '●●○○◐', chin: 'meri', confidence: 'medium', why: "Unnamed in Koga and in no other chart; pitch from Koga's grouping, and partial covers read from a photo" },
  { koga: 63, pitch: 'C#6', holes: '●●○○◐', chin: 'meri', written: { character: 'go-no-hi', register: 1, accidental: 'meri' }, default: true, confidence: 'high', why: "Clear in Koga's chart; shak-fingering agrees" },
  { koga: 64, pitch: 'C#6', holes: '○○○○◐', chin: undefined, confidence: 'medium', why: "Unnamed in Koga; its pitch, D♭6, follows from the first D6 note being further along, across the row break" },
  { koga: 65, pitch: 'C#6', holes: '○●○○●', chin: undefined, confidence: 'medium', why: "Unnamed in Koga; its pitch, D♭6, follows from the first D6 note being further along, across the row break" },
  { koga: 66, pitch: 'D6', holes: '●●●●◐', chin: 'meri', written: { character: 'go-no-ha', register: 1 }, confidence: 'high', why: "Clear in Koga's chart; Koga's p37 shows the same holes" },
  { koga: 67, pitch: 'D6', holes: '●●○○○', chin: 'neutral', written: { character: 'go-no-hi', register: 1 }, default: true, confidence: 'high', why: "Clear in Koga's chart; Koga's p39 shows the same holes" },
  { koga: 68, pitch: 'D6', holes: '●○○○○', chin: 'neutral', written: { character: 'go-no-hi', register: 1 }, confidence: 'high', why: "Koga's holes, unnamed there; Nyokai-An and fingchart6 list them as go no hi" },
  { koga: 69, pitch: 'D#6', holes: '●●○●○', chin: 'meri', written: { character: 'san-no-ha', register: 1 }, default: true, confidence: 'medium', why: "Clear in Koga's chart; Nyokai-An agrees, but Koga's own p39 half covers the thumb" },
  { koga: 70, pitch: 'D#6', holes: '●○◐●◐', chin: undefined, confidence: 'medium', why: "Unnamed in Koga and in no other chart; pitch from Koga's grouping, and partial covers read from a photo" },
  { koga: 71, pitch: 'D#6', holes: '●○●○○', chin: undefined, written: { character: 'ni-shi-go-no-ha', register: 1 }, confidence: 'high', why: "Clear in Koga's chart; Nyokai-An gives the same holes and pitch" },
  { koga: 72, pitch: 'E6', holes: '○○○●●', chin: 'kari', written: { character: 'shi-no-ha', register: 1 }, default: true, confidence: 'medium', why: "Clear in Koga's chart, but Koga's p39 half covers the thumb, and Nyokai-An and fingchart6 give ●○○●○" },
  { koga: 73, pitch: 'E6', holes: '○○○●○', chin: undefined, confidence: 'medium', why: "Unnamed in Koga and in no other chart; pitch from Koga's grouping, and partial covers read from a photo" },
  { koga: 74, pitch: 'E6', holes: '●○○●◐', chin: undefined, confidence: 'medium', why: "Unnamed in Koga and in no other chart; pitch from Koga's grouping, and partial covers read from a photo" },
  { koga: 75, pitch: 'F6', holes: '●○○●●', chin: 'neutral', written: { character: 'tsu', register: 2 }, default: true, confidence: 'medium', why: "Clear in Koga's chart, but Nyokai-An (○●●●●) and shak-fingering (◐●●●●) give other holes" },
  { koga: 76, pitch: 'F#6', holes: '○●●●●', chin: 'meri', written: { character: 're', register: 2, accidental: 'meri' }, default: true, confidence: 'high', why: "Koga's holes, unnamed there; Nyokai-An and shak-fingering both name them re meri in daikan" },
  { koga: 77, pitch: 'G6', holes: '○○●●●', chin: 'neutral', written: { character: 're', register: 2 }, default: true, confidence: 'high', why: "Clear in Koga's chart; Nyokai-An or shak-fingering gives the same holes" },
  { koga: 78, pitch: 'G#6', holes: '○○●○●', chin: 'meri', written: { character: 'chi', register: 2, accidental: 'meri' }, default: true, confidence: 'high', why: "Clear in Koga's chart; Nyokai-An or shak-fingering gives the same holes" },
  { koga: 79, pitch: 'A6', holes: '●●●○●', chin: 'neutral', written: { character: 'chi', register: 2 }, default: true, confidence: 'high', why: "Clear in Koga's chart; Nyokai-An or shak-fingering gives the same holes" },
  { koga: 80, pitch: 'A#6', holes: '●●○●○', chin: 'meri', written: { character: 'hi', register: 2, accidental: 'meri' }, default: true, confidence: 'medium', why: "Clear in Koga's chart, but Nyokai-An and shak-fingering both give ○●●●○" },
  { koga: 81, pitch: 'B6', holes: '○○○●○', chin: 'chu-meri', written: { character: 'hi', register: 2, accidental: 'chu-meri' }, default: true, confidence: 'high', why: "Clear in Koga's chart; Nyokai-An or shak-fingering gives the same holes" },
  { koga: 82, pitch: 'C7', holes: '●○●●●', chin: 'neutral', written: { character: 'hi', register: 2 }, default: true, confidence: 'high', why: "Clear in Koga's chart; Nyokai-An or shak-fingering gives the same holes" },
  { koga: 83, pitch: 'D7', holes: '●●○○●', chin: 'neutral', written: { character: 'ha', register: 2 }, default: true, confidence: 'high', why: "Clear in Koga's chart; Nyokai-An or shak-fingering gives the same holes" },
  { koga: 84, pitch: 'D7', holes: '○○○○○', chin: undefined, confidence: 'medium', why: "Unnamed in Koga; all holes open" },
  // From other charts, where Koga doesn't name a fingering
  { source: 'Nyokai-An', pitch: 'C#4', holes: '●●●●●', chin: 'chu-meri', written: { character: 'ro', register: 0, accidental: 'chu-meri' }, confidence: 'medium', why: "One chart. Koga calls this pitch ro meri" },
  { source: 'shak-fingering', pitch: 'C#7', holes: '●●●○●', chin: 'meri', written: { character: 'go-no-hi', register: 2, accidental: 'meri' }, default: true, confidence: 'low', why: "One unattributed chart, which writes a small ヒ here and at C♯5 and C♯6, where Koga has go no hi meri. The name is inferred; it fills D♭7, the one pitch otherwise without a fingering" },
  // Names other charts give where Koga gives none: new octaves, new marks,
  // other schools' names, and characters Koga doesn't use
  { source: 'shak-fingering', pitch: 'G#4', holes: '○○◐●●', chin: 'meri', written: { character: 'chi', register: 0, accidental: 'meri' }, confidence: 'medium', why: "One chart; Nyokai-An also mentions chi meri in otsu, played like u" },
  { source: 'Nyokai-An', pitch: 'D5', holes: '●●●●○', chin: 'chu-meri', written: { character: 'go-no-ha', register: 0 }, confidence: 'medium', why: "One chart. Koga has go no ha only in kan" },
  { source: 'Nyokai-An', pitch: 'C5', holes: '●○●○○', chin: 'meri', written: { character: 'ni-shi-go-no-ha', register: 0 }, confidence: 'medium', why: "One chart: a grace note before kan ro. Koga has these holes only in kan, at E♭6" },
  { source: "Koga's Kurokami score, Nyokai-An", pitch: 'C5', holes: '●○●○○', chin: 'meri', written: { character: 'ha', register: 0 }, confidence: 'medium', why: "Koga's Kurokami score writes plain ハ for ni shi go no ha in otsu, before ro; a lesson on it gives these holes, head down. Nyokai-An writes it ハ二四五 or ハ, at C5" },
  { source: 'shak-fingering', pitch: 'E6', holes: '○○○●◐', chin: 'chu-meri', written: { character: 'tsu', register: 2, accidental: 'chu-meri' }, confidence: 'medium', why: "One chart. Koga's E6 is shi no ha" },
  { source: 'Nyokai-An', pitch: 'C#5', holes: '●●●●●', chin: 'chu-meri', written: { character: 'ro', register: 1, accidental: 'chu-meri' }, confidence: 'medium', why: "One chart. Koga calls this pitch ro meri" },
  { source: 'Nyokai-An', pitch: 'F#4', holes: '○◐●●●', chin: 'chu-meri', written: { character: 're', register: 0, accidental: 'chu-meri' }, confidence: 'medium', why: "One chart. Koga calls this pitch re meri" },
  { source: 'Nyokai-An', pitch: 'F#4', holes: '○○●●●', chin: 'chu-meri', written: { character: 're', register: 0, accidental: 'chu-meri' }, confidence: 'medium', why: "One chart. Koga calls this pitch re meri" },
  { source: 'Nyokai-An', pitch: 'F#5', holes: '○◐●●●', chin: 'chu-meri', written: { character: 're', register: 1, accidental: 'chu-meri' }, confidence: 'medium', why: "One chart. Koga calls this pitch re meri" },
  { source: 'Nyokai-An', pitch: 'F#5', holes: '○○●●●', chin: 'chu-meri', written: { character: 're', register: 1, accidental: 'chu-meri' }, confidence: 'medium', why: "One chart. Koga calls this pitch re meri" },
  { source: 'Nyokai-An', pitch: 'C#5', holes: '●●○○○', chin: 'chu-meri', written: { character: 'go-no-hi', register: 0, accidental: 'chu-meri' }, confidence: 'medium', why: "One chart. Koga calls this pitch go no hi meri" },
  { source: 'Nyokai-An', pitch: 'C#5', holes: '●●○○◐', chin: 'chu-meri', written: { character: 'go-no-hi', register: 0, accidental: 'chu-meri' }, confidence: 'medium', why: "One chart. Koga calls this pitch go no hi meri" },
  { source: 'Nyokai-An', pitch: 'C#6', holes: '●●○○○', chin: 'chu-meri', written: { character: 'go-no-hi', register: 1, accidental: 'chu-meri' }, confidence: 'medium', why: "One chart. Koga calls this pitch go no hi meri" },
  { source: 'Nyokai-An', pitch: 'C#6', holes: '●●○○◐', chin: 'chu-meri', written: { character: 'go-no-hi', register: 1, accidental: 'chu-meri' }, confidence: 'medium', why: "One chart. Koga calls this pitch go no hi meri" },
  { source: 'Nyokai-An', pitch: 'C#6', holes: '●○○○○', chin: 'chu-meri', written: { character: 'go-no-hi', register: 1, accidental: 'chu-meri' }, confidence: 'medium', why: "One chart. Koga calls this pitch go no hi meri" },
  { source: 'Nyokai-An', pitch: 'C#6', holes: '●○○○◐', chin: 'chu-meri', written: { character: 'go-no-hi', register: 1, accidental: 'chu-meri' }, confidence: 'medium', why: "One chart. Koga calls this pitch go no hi meri" },
  { source: 'Nyokai-An', pitch: 'A#4', holes: '●●○◐●', chin: undefined, written: { character: 'chi', register: 0, accidental: 'dai-kari' }, confidence: 'medium', why: "One chart, which draws down arrows (meri) on this kari, so the chin is left blank. Koga calls this pitch ri meri" },
  { source: 'Nyokai-An', pitch: 'A#5', holes: '●●○◐●', chin: undefined, written: { character: 'chi', register: 1, accidental: 'dai-kari' }, confidence: 'medium', why: "One chart, which draws down arrows (meri) on this kari, so the chin is left blank. Koga calls this pitch hi meri" },
  { source: 'Nyokai-An', pitch: 'A#5', holes: '●○○◐●', chin: undefined, written: { character: 'chi', register: 1, accidental: 'dai-kari' }, confidence: 'medium', why: "One chart, which draws down arrows (meri) on this kari, so the chin is left blank. Koga calls this pitch hi meri" },
  { source: 'shak-fingering', pitch: 'A#4', holes: '●●○◐●', chin: 'dai-meri', written: { character: 'ri', register: 0, accidental: 'dai-meri' }, confidence: 'medium', why: "One chart's name for what Koga calls ri meri" },
  { source: 'shak-fingering', pitch: 'A#5', holes: '●●○◐●', chin: 'dai-meri', written: { character: 'hi', register: 1, accidental: 'dai-meri' }, confidence: 'medium', why: "One chart's name for what Koga calls hi meri" },
  { source: 'Nyokai-An, shak-fingering', pitch: 'D5', holes: '●●○○○', chin: 'neutral', written: { character: 'i', register: 0 }, confidence: 'high', why: "Two charts, as another character for go no hi" },
  { source: 'Nyokai-An, B.C.', pitch: 'D5', holes: '●○○○○', chin: 'neutral', written: { character: 'i', register: 0 }, confidence: 'high', why: "Two charts, as another character for go no hi" },
  { source: 'Nyokai-An', pitch: 'D6', holes: '●●○○○', chin: 'neutral', written: { character: 'i', register: 1 }, confidence: 'medium', why: "One chart" },
  { source: 'Nyokai-An', pitch: 'D6', holes: '●○○○○', chin: 'neutral', written: { character: 'i', register: 1 }, confidence: 'medium', why: "One chart" },
  { source: 'shak-fingering', pitch: 'D6', holes: '○●○○○', chin: 'neutral', written: { character: 'i', register: 1 }, confidence: 'medium', why: "One chart" },
  { source: 'Nyokai-An', pitch: 'C#5', holes: '●●○○○', chin: 'chu-meri', written: { character: 'i', register: 0, accidental: 'chu-meri' }, confidence: 'medium', why: "One chart. Its i meri, at C, conflicts with Koga's naming and is left out" },
  { source: 'Nyokai-An', pitch: 'C#5', holes: '●●○○◐', chin: 'chu-meri', written: { character: 'i', register: 0, accidental: 'chu-meri' }, confidence: 'medium', why: "One chart" },
  { source: 'Nyokai-An', pitch: 'C#6', holes: '●●○○○', chin: 'chu-meri', written: { character: 'i', register: 1, accidental: 'chu-meri' }, confidence: 'medium', why: "One chart" },
  { source: 'Nyokai-An', pitch: 'C#6', holes: '●●○○◐', chin: 'chu-meri', written: { character: 'i', register: 1, accidental: 'chu-meri' }, confidence: 'medium', why: "One chart" },
  { source: 'Nyokai-An', pitch: 'C#6', holes: '●○○○○', chin: 'chu-meri', written: { character: 'i', register: 1, accidental: 'chu-meri' }, confidence: 'medium', why: "One chart" },
  { source: 'Nyokai-An', pitch: 'C#6', holes: '●○○○◐', chin: 'chu-meri', written: { character: 'i', register: 1, accidental: 'chu-meri' }, confidence: 'medium', why: "One chart" },
  { source: 'Nyokai-An', pitch: 'D5', holes: '●●●○○', chin: 'neutral', written: { character: 'a', register: 0 }, confidence: 'low', why: "One chart; the B.C. chart and shak-fingering give ●○●○○ instead" },
  { source: 'B.C., shak-fingering', pitch: 'D5', holes: '●○●○○', chin: 'kari', written: { character: 'a', register: 0 }, confidence: 'medium', why: "Two charts, but Nyokai-An gives ●●●○○" },
  { source: 'Nyokai-An', pitch: 'D6', holes: '●●●○○', chin: 'meri', written: { character: 'a', register: 1 }, confidence: 'medium', why: "One chart, as another name for yon go no ha" },
  { source: 'Nyokai-An, fingchart6', pitch: 'D6', holes: '●●●○○', chin: 'meri', written: { character: 'yon-go-no-ha', register: 1 }, confidence: 'high', why: "Two charts. Koga lists the name on p109 without a fingering" },
  { source: 'B.C., shak-fingering', pitch: 'D#6', holes: '●○●●○', chin: 'chu-kari', written: { character: 'ni-no-ha', register: 1 }, confidence: 'medium', why: "Two charts, but fingchart6 writes ハ二 with Koga's ni shi go no ha holes" },
  { source: 'B.C.', pitch: 'F4', holes: '●○●●●', chin: 'dai-meri', written: { character: 'ni-no-re', register: 0, accidental: 'dai-meri' }, confidence: 'medium', why: "One chart" },
  { source: 'B.C.', pitch: 'F#4', holes: '●○●●●', chin: 'chu-meri', written: { character: 'ni-no-re', register: 0 }, confidence: 'medium', why: "One chart" },
  { source: 'B.C.', pitch: 'F5', holes: '●○●●●', chin: 'dai-meri', written: { character: 'ni-no-re', register: 1, accidental: 'dai-meri' }, confidence: 'medium', why: "One chart" },
  { source: 'Nyokai-An', pitch: 'G5', holes: '○●○●●', chin: 'meri', written: { character: 'ichi-san-no-u', register: 1 }, confidence: 'low', why: "One chart; Koga has these holes at A♭5 (#46)" },
  { source: 'B.C., shak-fingering', pitch: 'G5', holes: '◐●○●●', chin: 'meri', written: { character: 'ru', register: 1 }, confidence: 'high', why: "Two charts" },
  // Other holes for fingerings Koga names, from other charts
  { source: 'Nyokai-An', pitch: 'E4', holes: '○●●●●', chin: 'chu-meri', written: { character: 'tsu', register: 0, accidental: 'chu-meri' }, confidence: 'medium', why: "One chart" },
  { source: 'Nyokai-An', pitch: 'G4', holes: '○●◐●●', chin: 'meri', written: { character: 'u', register: 0, accidental: 'meri' }, confidence: 'medium', why: "One chart" },
  { source: 'Nyokai-An', pitch: 'G4', holes: '●●○●●', chin: 'meri', written: { character: 'u', register: 0, accidental: 'meri' }, confidence: 'medium', why: "One chart" },
  { source: 'Nyokai-An', pitch: 'G#4', holes: '○●◐●●', chin: 'meri', written: { character: 'u', register: 0 }, confidence: 'high', why: "Nyokai-An; Koga's unnamed #14 is nearly the same" },
  { source: 'Nyokai-An', pitch: 'G#4', holes: '○○◐●●', chin: 'meri', written: { character: 'u', register: 0 }, confidence: 'high', why: "Nyokai-An; Koga's unnamed #13 is nearly the same" },
  { source: 'Nyokai-An, fingchart6', pitch: 'A#4', holes: '●●○◐●', chin: 'meri', written: { character: 'ri', register: 0, accidental: 'meri' }, confidence: 'high', why: "Two charts; Koga's unnamed #20 is nearly the same" },
  { source: 'Nyokai-An, fingchart6, shak-fingering', pitch: 'B4', holes: '●●○◐●', chin: 'chu-meri', written: { character: 'ri', register: 0, accidental: 'chu-meri' }, confidence: 'high', why: "Three charts, and Koga's own p39" },
  { source: 'shak-fingering', pitch: 'D5', holes: '●●●◐●', chin: 'neutral', written: { character: 'ro', register: 1 }, confidence: 'medium', why: "One chart" },
  { source: 'Nyokai-An, fingchart6', pitch: 'D5', holes: '●○○○○', chin: 'neutral', written: { character: 'go-no-hi', register: 0 }, confidence: 'high', why: "Two charts" },
  { source: 'Nyokai-An, fingchart6', pitch: 'A#5', holes: '●●○◐●', chin: 'meri', written: { character: 'hi', register: 1, accidental: 'meri' }, confidence: 'high', why: "Two charts; Koga's unnamed #54" },
  { source: 'Nyokai-An, fingchart6', pitch: 'A#5', holes: '●○○◐●', chin: 'meri', written: { character: 'hi', register: 1, accidental: 'meri' }, confidence: 'high', why: "Two charts; Koga's unnamed #55" },
  { source: 'Nyokai-An, fingchart6, shak-fingering', pitch: 'B5', holes: '●●○◐●', chin: 'chu-meri', written: { character: 'hi', register: 1, accidental: 'chu-meri' }, confidence: 'high', why: "Three charts" },
  { source: 'Nyokai-An, fingchart6', pitch: 'B5', holes: '●○○◐●', chin: 'chu-meri', written: { character: 'hi', register: 1, accidental: 'chu-meri' }, confidence: 'high', why: "Two charts" },
  { source: 'Nyokai-An, fingchart6', pitch: 'C#6', holes: '●○○○◐', chin: 'meri', written: { character: 'go-no-hi', register: 1, accidental: 'meri' }, confidence: 'high', why: "Two charts" },
  { source: 'Nyokai-An', pitch: 'D6', holes: '●●●●○', chin: 'meri', written: { character: 'go-no-ha', register: 1 }, confidence: 'medium', why: "One chart" },
  { source: 'shak-fingering, B.C.', pitch: 'D6', holes: '●●●◐●', chin: 'meri', written: { character: 'go-no-ha', register: 1 }, confidence: 'medium', why: "shak-fingering gives these holes as an alternative for go no ha; the B.C. chart labels them daikan ro" },
  { source: 'Nyokai-An, fingchart6', pitch: 'E6', holes: '●○○●○', chin: undefined, written: { character: 'shi-no-ha', register: 1 }, confidence: 'high', why: "Two charts (as yon no ha), though they disagree with Koga's holes" },
  { source: 'Nyokai-An', pitch: 'F6', holes: '○●●●●', chin: 'neutral', written: { character: 'tsu', register: 2 }, confidence: 'medium', why: "One chart" },
  { source: 'shak-fingering', pitch: 'F6', holes: '◐●●●●', chin: 'neutral', written: { character: 'tsu', register: 2 }, confidence: 'medium', why: "One chart" },
  { source: 'Nyokai-An', pitch: 'G6', holes: '○○●◐●', chin: 'neutral', written: { character: 're', register: 2 }, confidence: 'medium', why: "One chart" },
  { source: 'Nyokai-An, shak-fingering', pitch: 'A#6', holes: '○●●●○', chin: 'meri', written: { character: 'hi', register: 2, accidental: 'meri' }, confidence: 'high', why: "Two charts, though they disagree with Koga's holes" },
];

export type NoteLetter = 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B';

/** A written Western note. `alter` is in semitones: -1 flat, 1 sharp */
export interface WrittenPitch {
  letter: NoteLetter;
  alter: number;
  octave: number;
}

const LETTER_SEMITONES: Record<NoteLetter, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

/** Sounding pitch as a MIDI note number, so enharmonic spellings compare equal */
function midiNumber({ letter, alter, octave }: WrittenPitch): number {
  return (octave + 1) * 12 + LETTER_SEMITONES[letter] + alter;
}

export function isNoteLetter(value: unknown): value is NoteLetter {
  return typeof value === 'string' && value in LETTER_SEMITONES;
}

/** Reads a table pitch such as 'C#5' */
export function parseTablePitch(pitch: string): WrittenPitch {
  const match = /^([A-G])(#?)(\d)$/.exec(pitch);
  if (!match) {
    throw new Error(`Malformed pitch in the fingering table: ${pitch}`);
  }
  return {
    letter: match[1] as NoteLetter,
    alter: match[2] ? 1 : 0,
    octave: Number(match[3]),
  };
}

/**
 * Names a written fingering in exported files, e.g. "ri-meri", "san-no-u".
 * One word, so it also works as an ABC decoration.
 */
export function fingeringName({
  character,
  accidental,
}: WrittenFingering): string {
  return accidental ? `${character}-${accidental}` : character;
}

function writtenKey(written: WrittenFingering): string {
  return `${fingeringName(written)} ${written.register}`;
}

const NAMED = FINGERINGS.filter(
  (f): f is Fingering & { written: WrittenFingering } =>
    f.written !== undefined,
);
const DEFAULTS = new Map<number, WrittenFingering>();
const PITCH_BY_WRITTEN = new Map<string, WrittenPitch>();

for (const fingering of NAMED) {
  const pitch = parseTablePitch(fingering.pitch);
  // A fingering may have several rows, one per set of holes, but export
  // relies on all of them giving it one pitch
  const known = PITCH_BY_WRITTEN.get(writtenKey(fingering.written));
  if (known && midiNumber(known) !== midiNumber(pitch)) {
    throw new Error(`Two pitches for ${writtenKey(fingering.written)}`);
  }
  PITCH_BY_WRITTEN.set(writtenKey(fingering.written), pitch);
  if (fingering.default) {
    if (DEFAULTS.has(midiNumber(pitch))) {
      throw new Error(`Two defaults for ${fingering.pitch}`);
    }
    DEFAULTS.set(midiNumber(pitch), fingering.written);
  }
}

const PITCHES = FINGERINGS.map(({ pitch }) => ({
  pitch,
  midi: midiNumber(parseTablePitch(pitch)),
}));
const LOWEST = PITCHES.reduce((a, b) => (b.midi < a.midi ? b : a));
const HIGHEST = PITCHES.reduce((a, b) => (b.midi > a.midi ? b : a));

/** The table's range as written, e.g. "C4–D7" */
export const PITCH_RANGE = `${LOWEST.pitch}–${HIGHEST.pitch}`;

/** Whether a note lies below or above the table, or within it */
export function rangePosition(
  written: WrittenPitch,
): 'below' | 'above' | 'within' {
  const midi = midiNumber(written);
  if (midi < LOWEST.midi) return 'below';
  if (midi > HIGHEST.midi) return 'above';
  return 'within';
}

/**
 * The fingering import gives a written note, matched by sounding pitch.
 * Undefined when the table has none: out of range, or a fractional alter
 * such as a quarter tone. Every semitone in range has a default.
 */
export function defaultFingering(
  written: WrittenPitch,
): WrittenFingering | undefined {
  return DEFAULTS.get(midiNumber(written));
}

/**
 * How far a mark moves a note, in semitones, for a character and mark no chart
 * lists in any octave. Chosen with the owner (#430): the commonest offset in
 * the charts, and +1 for dai-kari as Nyokai-An gives chi dai-kari.
 *
 * These are part of the export format. Import finds an unlisted fingering's
 * octave by recomputing its pitch, so changing an offset would make files
 * exported before the change read back as the pitch's default. Add offsets
 * for new marks; never change existing ones.
 */
const MARK_OFFSETS: Record<Accidental, number> = {
  'dai-meri': -2,
  meri: -1,
  'chu-meri': -1,
  'chu-kari': 1,
  kari: 1,
  'dai-kari': 1,
};

const NOTE_NAMES: [NoteLetter, number][] = [
  ['C', 0],
  ['C', 1],
  ['D', 0],
  ['D', 1],
  ['E', 0],
  ['F', 0],
  ['F', 1],
  ['G', 0],
  ['G', 1],
  ['A', 0],
  ['A', 1],
  ['B', 0],
];

/** A MIDI note number as a written note, altered notes spelled sharp */
function fromMidi(midi: number): WrittenPitch {
  const [letter, alter] = NOTE_NAMES[midi % 12];
  return { letter, alter, octave: Math.floor(midi / 12) - 1 };
}

/** The pitch of a character with no mark, in a register, e.g. kan ri: C6 */
function plainMidi(character: Character, register: number): number {
  return pitchToMidi(kinkoMap[character].pitch) + 12 * register;
}

/** How far a mark moves this character: from the table if any register lists it */
function markOffset(character: Character, accidental: Accidental): number {
  const listed = NAMED.find(
    (f) =>
      f.written.character === character && f.written.accidental === accidental,
  );
  if (!listed) return MARK_OFFSETS[accidental];
  const { pitch, written } = listed;
  return (
    midiNumber(parseTablePitch(pitch)) - plainMidi(character, written.register)
  );
}

/**
 * The written note export uses for a fingering. A listed fingering has its
 * table pitch. Any other is estimated from its character's pitch, moved by
 * its mark as the same mark moves that character in another register, or else by
 * MARK_OFFSETS. Undefined for a character, register or mark this table doesn't know.
 */
export function pitchForFingering(
  written: WrittenFingering,
): WrittenPitch | undefined {
  const listed = PITCH_BY_WRITTEN.get(writtenKey(written));
  if (listed) return listed;
  const { character, register, accidental } = written;
  if (
    !Object.hasOwn(kinkoMap, character) ||
    ![0, 1, 2].includes(register) ||
    (accidental !== undefined && !Object.hasOwn(MARK_OFFSETS, accidental))
  ) {
    return undefined;
  }
  const offset = accidental ? markOffset(character, accidental) : 0;
  return fromMidi(plainMidi(character, register) + offset);
}

/** Reads a fingering name, e.g. "ri-chu-meri", into its character and mark */
function parseFingeringName(
  name: string,
): Omit<WrittenFingering, 'register'> | undefined {
  // Longest first, so "ri-chu-meri" isn't read as ri-chu with meri
  const accidental = [...ACCIDENTALS]
    .sort((a, b) => b.length - a.length)
    .find((mark) => name.endsWith(`-${mark}`));
  const character = accidental ? name.slice(0, -accidental.length - 1) : name;
  if (!(CHARACTERS as readonly string[]).includes(character)) return undefined;
  return {
    character: character as Character,
    ...(accidental && { accidental }),
  };
}

/**
 * The fingering a name gives a written note, if export would have written
 * that fingering as that note. The register is the one whose pitch matches.
 * Undefined when none does, e.g. when the note was edited after export, so
 * import falls back to the pitch's default.
 */
export function namedFingering(
  written: WrittenPitch,
  name: string,
): WrittenFingering | undefined {
  const parsed = parseFingeringName(name);
  if (!parsed) return undefined;
  const midi = midiNumber(written);
  for (const register of [0, 1, 2]) {
    const candidate = { ...parsed, register };
    const pitch = pitchForFingering(candidate);
    if (pitch && midiNumber(pitch) === midi) return candidate;
  }
  return undefined;
}

/** Whether import gives this fingering without being told which */
export function isDefaultFingering(written: WrittenFingering): boolean {
  const pitch = pitchForFingering(written);
  const fallback = pitch && defaultFingering(pitch);
  return fallback !== undefined && writtenKey(fallback) === writtenKey(written);
}
