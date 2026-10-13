/** Small declarative country contexts, not event locations or a general geocoder.
 * Bounds are approximate country envelopes; transboundary reports require clarification.
 */
import { NATURAL_EARTH_COUNTRIES } from './countries.js';
const EXTRA_ALIASES = {
  SE: ['Sweden', 'Sverige'],
  GB: ['United Kingdom', 'UK', 'Britain', 'Storbritannien'],
  TR: ['Turkey', 'Türkiye', 'Turkiye', 'Turkiet'],
  SY: ['Syria', 'Syrien'],
  IN: ['India', 'Indien'],
  MM: ['Myanmar', 'Burma'],
  US: ['United States', 'USA'],
  JP: ['Japan'],
};
export const COUNTRY_CONTEXTS = Object.freeze(
  NATURAL_EARTH_COUNTRIES.map((country) =>
    Object.freeze({
      ...country,
      aliases: [
        ...new Set([
          ...country.aliases,
          ...(EXTRA_ALIASES[country.code] || []),
        ]),
      ],
    }),
  ),
);
const escape = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export function resolveCountryMentions(text) {
  const matches = [];
  for (const country of COUNTRY_CONTEXTS)
    for (const alias of country.aliases) {
      const pattern = new RegExp(
        `(?:^|[^\\p{L}\\p{N}])(${escape(alias)})(?=$|[^\\p{L}\\p{N}])`,
        'giu',
      );
      for (const match of text.matchAll(pattern)) {
        const start = match.index + match[0].length - match[1].length;
        matches.push({
          start,
          end: start + match[1].length,
          name: match[1],
          countryCode: country.code,
        });
      }
    }
  const accepted = [];
  for (const match of matches.sort(
    (a, b) => b.end - b.start - (a.end - a.start),
  )) {
    if (
      accepted.some((item) => item.start < match.end && match.start < item.end)
    )
      continue;
    accepted.push(match);
  }
  const found = [];
  for (const match of accepted.sort((a, b) => a.start - b.start)) {
    // Georgia can name a country or a US state. Retain uncertainty rather than guess.
    const code =
      match.name.toLowerCase() === 'georgia' &&
      !/\b(?:country|nation|republic|landet)\b/i.test(text)
        ? null
        : match.countryCode;
    if (
      !found.some(
        (place) => place.countryCode === code && place.name === match.name,
      )
    )
      found.push({
        name: match.name,
        countryCode: code,
        latitude: null,
        longitude: null,
      });
  }
  return found;
}
export function planInvestigation(claim) {
  const interpretation = claim.interpretation;
  const codes = [
    ...new Set(
      interpretation.places.map((place) => place.countryCode).filter(Boolean),
    ),
  ];
  const base = {
    category: claim.category,
    needsClarification: false,
    question: null,
    parameters: {},
  };
  if (claim.category === 'population') {
    if (
      interpretation.uncertainty.some(
        (note) =>
          note.startsWith('Unsupported population scope:') ||
          note.startsWith('Population changes or flows'),
      )
    )
      return {
        ...base,
        needsClarification: true,
        question:
          'This wording describes a different population scope or change. The configured country-total evidence path cannot assess it; narrow or correct the claim, or inspect the original source.',
      };
    if (codes.length !== 1 || interpretation.year === null) {
      return {
        ...base,
        needsClarification: true,
        question:
          codes.length !== 1
            ? 'Which country does this population claim describe?'
            : 'Which year does this population claim describe?',
      };
    }
    return {
      ...base,
      parameters: { countryCode: codes[0], year: interpretation.year },
    };
  }
  if (claim.category === 'seismic') {
    if (codes.length !== 1 || interpretation.eventDate === null) {
      return {
        ...base,
        needsClarification: true,
        question:
          codes.length !== 1
            ? 'Which country should we examine first? A report can describe more than one event.'
            : 'What is the event date? Relative dates need the source context.',
      };
    }
    const context = COUNTRY_CONTEXTS.find(
      (country) => country.code === codes[0],
    );
    if (!context)
      return {
        ...base,
        needsClarification: true,
        question:
          'This country is not in the current geographic context catalog. Correct the place or inspect the source.',
      };
    // Broaden by one day in each direction: reported dates may be local, catalog dates UTC.
    const day = Date.parse(`${interpretation.eventDate}T12:00:00Z`);
    return {
      ...base,
      parameters: {
        countryCode: codes[0],
        eventDate: interpretation.eventDate,
        startDate: new Date(day - 86400000).toISOString().slice(0, 10),
        endDate: new Date(day + 86400000).toISOString().slice(0, 10),
        bounds: { ...context.bounds },
        geographicScope: 'country-context',
      },
    };
  }
  return {
    ...base,
    parameters: {},
    question:
      'This claim has no configured evidence path. Its original wording remains available.',
  };
}
