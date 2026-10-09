/**
 * The schools (ryū) a version of a piece can come from, by the key stored in
 * the database and the name shown for it. The keys must match the `school`
 * enum (database/migrations/add_school_to_scores.sql). Names use Hepburn with
 * macrons and a hyphen before -ryū / -ha.
 */
export const SCHOOLS = {
  kinko: 'Kinko-ryū',
  tozan: 'Tozan-ryū',
  myoan: 'Myōan',
  nezasa: 'Nezasa-ha',
  ueda: 'Ueda-ryū',
  chikuho: 'Chikuho-ryū',
  dokyoku: 'Dokyoku',
} as const;

export type School = keyof typeof SCHOOLS;
