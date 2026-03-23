/** Local-timezone YYYY-MM-DD string (avoids the UTC-shift bug from toISOString). */
export function localDateString(d: Date = new Date()): string {
  return d.toLocaleDateString("en-CA"); // en-CA always produces YYYY-MM-DD
}
