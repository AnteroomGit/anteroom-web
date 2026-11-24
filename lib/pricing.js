// Decisions that are yours to make, not the code's. Leave a value as null
// and the practitioner page simply does not mention it. Nothing is invented.

// The one date the founding period ends for everyone, as YYYY-MM-DD.
// For example: '2027-01-31'. Dates are read as Melbourne time. The page stops
// mentioning the founding period once this day has passed, so there is
// nothing to switch off by hand.
export const FOUNDING_PERIOD_ENDS = '2026-12-11';

// How the monthly fee reads on the page. For example: '$199 a month'.
// It is still blank on purpose: nothing about the price is shown until you
// decide it.
export const MONTHLY_PRICE_LABEL = null;

// Today's calendar date in Melbourne, as YYYY-MM-DD.
function melbourneToday(now) {
  try {
    const parts = new Intl.DateTimeFormat('en-AU', {
      timeZone: 'Australia/Melbourne',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(now);
    const part = (type) => parts.find((p) => p.type === type).value;
    return `${part('year')}-${part('month')}-${part('day')}`;
  } catch {
    // No time zone data on this machine: fall back to the UTC date.
    return now.toISOString().slice(0, 10);
  }
}

// "11 December 2026", or null when no date has been set, it is not a real
// YYYY-MM-DD date, or that day has already passed. The last day itself still
// counts as inside the founding period.
export function foundingEndLabel(now = new Date()) {
  if (!FOUNDING_PERIOD_ENDS) return null;
  const date = new Date(`${FOUNDING_PERIOD_ENDS}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return null;
  // A date that rolled over (2026-02-30 becoming 2 March) is a typo, not a date.
  if (date.toISOString().slice(0, 10) !== FOUNDING_PERIOD_ENDS) return null;
  if (melbourneToday(now) > FOUNDING_PERIOD_ENDS) return null;
  return date.toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}
