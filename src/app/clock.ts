/**
 * Today's date, the only place the app reads the clock for the daily challenge.
 * @module
 */

import { dateKey } from '../core/daily';

/** Today's date as `YYYY-MM-DD`, in the player's time zone: which daily challenge is on. */
export function today(): string {
  return dateKey(new Date());
}
