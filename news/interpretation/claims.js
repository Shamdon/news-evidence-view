import { resolveCountryMentions } from '../resolution/context.js';
const MONTHS = [
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
];
const SWEDISH_MONTHS = [
  'januari',
  'februari',
  'mars',
  'april',
  'maj',
  'juni',
  'juli',
  'augusti',
  'september',
  'oktober',
  'november',
  'december',
];
function validDay(value) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value
  );
}
function dateCandidates(text) {
  const dates = [...text.matchAll(/\b(\d{4}-\d{2}-\d{2})(?=T|\b)/g)].map(
    (match) => match[1],
  );
  const names = [...new Set([...MONTHS, ...SWEDISH_MONTHS])].join('|');
  for (const match of text.matchAll(
    new RegExp(
      `\\b(${names})\\s+(\\d{1,2})(?:st|nd|rd|th)?[,]?\\s+(\\d{4})\\b`,
      'gi',
    ),
  )) {
    const month = MONTHS.indexOf(match[1].toLowerCase());
    if (month >= 0)
      dates.push(
        `${match[3]}-${String(month + 1).padStart(2, '0')}-${match[2].padStart(2, '0')}`,
      );
  }
  for (const match of text.matchAll(
    new RegExp(`\\b(\\d{1,2})\\s+(${names})\\s+(\\d{4})\\b`, 'gi'),
  )) {
    const name = match[2].toLowerCase();
    const month =
      MONTHS.indexOf(name) >= 0
        ? MONTHS.indexOf(name)
        : SWEDISH_MONTHS.indexOf(name);
    dates.push(
      `${match[3]}-${String(month + 1).padStart(2, '0')}-${match[1].padStart(2, '0')}`,
    );
  }
  return {
    dates: [...new Set(dates.filter(validDay))],
    invalid: dates.some((value) => !validDay(value)),
  };
}
function quantity(number, scale = '') {
  let normalized = number.replace(/[ \u00a0\u202f]/g, '');
  if (/^\d{1,3}(?:,\d{3})+$/.test(normalized))
    normalized = normalized.replaceAll(',', '');
  else normalized = normalized.replace(',', '.');
  const multipliers = {
    million: 1e6,
    millions: 1e6,
    miljon: 1e6,
    miljoner: 1e6,
    billion: 1e9,
    billions: 1e9,
    miljard: 1e9,
    miljarder: 1e9,
    thousand: 1e3,
    tusen: 1e3,
  };
  return Number(normalized) * (multipliers[scale.toLowerCase()] || 1);
}
// A qualifier belongs to a quantity only when it directly precedes that quantity.
function comparator(text, numberIndex) {
  const prefix = text.slice(Math.max(0, numberIndex - 60), numberIndex);
  if (/(?:^|[^\p{L}\p{N}])(?:more than|over|över|fler än)\s*$/iu.test(prefix))
    return 'gt';
  if (/(?:^|[^\p{L}\p{N}])(?:less than|under|färre än)\s*$/iu.test(prefix))
    return 'lt';
  if (
    /(?:^|[^\p{L}\p{N}])(?:about|around|approximately|roughly|ungefär|cirka|runt)\s*$/iu.test(
      prefix,
    )
  )
    return 'approx';
  return 'eq';
}
const escaped = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export function interpretWording(text) {
  const uncertainty = [];
  const seismic =
    /\b(?:earthquake|earthquakes|quake|jordbävning|jordbävningen|skalv)\b/i.test(
      text,
    );
  const population =
    /\b(?:population|befolkning|befolkningen|invånare|inhabitants)\b/i.test(
      text,
    );
  const category = population ? 'population' : seismic ? 'seismic' : 'general';
  const places = resolveCountryMentions(text);
  const { dates, invalid } = dateCandidates(text);
  const labelledOtherTime =
    /\b(?:published|publication|updated|retrieved|accessed|publicerad|publicerades|uppdaterad)\b/i.test(
      text,
    );
  const ambiguous =
    /\b(?:possibly|perhaps|either|uncertain|between|or|möjligen|kanske|eller|mellan)\b/i.test(
      text,
    );
  const relative =
    /\b(?:today|yesterday|last week|i dag|idag|igår|förra veckan)\b/i.test(
      text,
    );
  let eventDate =
    dates.length === 1 && !labelledOtherTime && !ambiguous ? dates[0] : null;
  if (relative)
    uncertainty.push(
      'Relative date is unresolved; publication time has not been substituted.',
    );
  if (dates.length > 1 || ambiguous)
    uncertainty.push(
      'Multiple or qualified event interpretations remain unresolved.',
    );
  if (invalid)
    uncertainty.push('An invalid calendar date appears in the source.');
  if (labelledOtherTime && dates.length)
    uncertainty.push('Publication or update time is not an event date.');
  const years = [
    ...new Set(
      [
        ...text.matchAll(
          /(?:^|[^\p{L}\p{N}])(?:in|during|for|år|under|at the end of|end of|vid slutet av)\s+(1[89]\d{2}|20\d{2}|21\d{2})\b/giu,
        ),
      ].map((match) => Number(match[1])),
    ),
  ];
  let year =
    years.length === 1 && !ambiguous
      ? years[0]
      : eventDate
        ? Number(eventDate.slice(0, 4))
        : null;
  if (years.length > 1)
    uncertainty.push('Multiple reporting years remain unresolved.');
  const measurements = [];
  if (seismic) {
    const magnitudeCandidates = [
      ...text.matchAll(
        /\b(?:magnitude\s*:?\s*(?:of\s*)?|magnitud\s*:?\s*|M\s*)(\d+(?:[.,]\d+)?)\b/gi,
      ),
    ]
      .map((match) => ({
        value: Number(match[1].replace(',', '.')),
        comparator: comparator(
          text,
          match.index + match[0].lastIndexOf(match[1]),
        ),
      }))
      .filter((item) => item.value <= 12);
    const magnitudes = [
      ...new Set(magnitudeCandidates.map((item) => item.value)),
    ];
    if (
      magnitudes.length === 1 &&
      !ambiguous &&
      new Set(magnitudeCandidates.map((item) => item.comparator)).size === 1
    )
      measurements.push({
        key: 'magnitude',
        value: magnitudes[0],
        unit: 'magnitude',
        comparator: magnitudeCandidates[0].comparator,
      });
    if (magnitudes.length > 1) {
      eventDate = null;
      year = null;
      uncertainty.push('Multiple magnitudes cannot be paired to one event.');
    }
  }
  if (population) {
    const number =
      '(\\d{1,3}(?:[ \\u00a0\\u202f]\\d{3})+|\\d{1,3}(?:,\\d{3})+(?:\\.\\d+)?|\\d+(?:[.,]\\d+)?)';
    const scale =
      '(millions|million|billions|billion|thousand|miljoner|miljon|miljarder|miljard|tusen)?';
    const candidates = [];
    const connectors = [
      'of',
      'was',
      'is',
      'had',
      'has',
      'på',
      'var',
      'är',
      'uppgick',
      'till',
      'estimated',
      'at',
      'about',
      'around',
      'approximately',
      'roughly',
      'over',
      'över',
      'under',
      'cirka',
      'ungefär',
      'more',
      'than',
      'less',
      'reached',
      'stood',
      ...places.map((place) => escaped(place.name)),
    ].join('|');
    const patterns = [
      new RegExp(
        `\\b(?:population|befolkning|befolkningen)(?:\\s+(?:${connectors})){0,12}\\s*:?\\s*${number}\\s*${scale}`,
        'gi',
      ),
      new RegExp(
        `\\b${number}\\s*${scale}\\s+(?:people|inhabitants|invånare)\\b`,
        'gi',
      ),
    ];
    for (const [patternIndex, pattern] of patterns.entries())
      for (const match of text.matchAll(pattern))
        candidates.push({
          value: quantity(match[1], match[2] || ''),
          comparator: comparator(
            text,
            match.index + match[0].lastIndexOf(match[1]),
          ),
          primary: patternIndex === 0,
          start: match.index,
          end: match.index + match[0].length,
        });
    const scopeWords =
      'city|town|county|municipality|province|region|birds|animals|fish|cattle|livestock|turkeys|aged|age group|age groups|men|women|refugee|refugees|children|adults|foreign-born|foreign born|elderly|pensioners|stad|kommun|län|djur|fåglar|kvinnor|män|barn|flyktingar|utrikesfödda|ålder|åldersgrupp|pensionärer';
    const scopePattern = new RegExp(
      `(?:^|[^\\p{L}\\p{N}])(?:${scopeWords})(?=$|[^\\p{L}\\p{N}])`,
      'iu',
    );
    const primary = candidates.find((item) => item.primary);
    const hasScope = scopePattern.test(text);
    const unsupportedScope =
      hasScope &&
      (!primary ||
        scopePattern.test(text.slice(0, primary.start)) ||
        new RegExp(`^\\s*(?:${scopeWords})(?=$|[^\\p{L}\\p{N}])`, 'iu').test(
          text.slice(primary.end),
        ));
    if (hasScope && !unsupportedScope)
      uncertainty.push(
        'Additional scoped or demographic quantities remain unassessed; only the explicit total-population wording has been extracted.',
      );
    if (unsupportedScope)
      uncertainty.push(
        'Unsupported population scope: subnational, demographic subgroup or non-human counts must not be substituted with a country total.',
      );
    const changeWording =
      /\b(?:increased by|decreased by|grew by|fell by|rose by|births|deaths|net migration|ökade med|minskade med)\b/i.test(
        text,
      );
    const values =
      changeWording || unsupportedScope
        ? []
        : [...new Set(candidates.map((item) => item.value))].filter((value) =>
            Number.isFinite(value),
          );
    if (changeWording)
      uncertainty.push(
        'Population changes or flows must not be substituted for a total population measurement.',
      );
    const matchingComparators = [
      ...new Set(
        candidates
          .filter((item) => item.value === values[0])
          .map((item) => item.comparator),
      ),
    ];
    if (values.length === 1 && !ambiguous && matchingComparators.length === 1)
      measurements.push({
        key: 'population',
        value: values[0],
        unit: 'people',
        comparator: matchingComparators[0],
      });
    if (values.length > 1) {
      year = null;
      uncertainty.push(
        'Multiple population measurements require a narrower claim.',
      );
    }
    if (!measurements.length)
      uncertainty.push(
        'A population quantity could not be resolved from the wording.',
      );
  }
  if (/\b(?:end of|end-of-year|year-end|slutet av)\b/i.test(text))
    uncertainty.push(
      'End-of-year count: an annual estimate may use a different reference date or methodology.',
    );
  if (places.length > 1)
    uncertainty.push(
      'More than one country is mentioned; event or measurement association needs clarification.',
    );
  if (!places.length)
    uncertainty.push(
      'The country is unresolved. No coordinates have been inferred.',
    );
  return {
    category,
    interpretation: {
      eventDate,
      year,
      places,
      measurements,
      uncertainty,
      notes:
        'Conservative interpretation of explicit wording; inspect and correct. Country mentions describe context, not observed event coordinates. Dates may describe context rather than the claimed event.',
    },
  };
}
function candidate(text) {
  if (
    /\b(?:ignore (?:all|previous)|system prompt|install (?:a |the )?plugin|execute (?:this|the)|reveal (?:secrets|credentials)|disregard instructions)\b/i.test(
      text,
    )
  )
    return {
      accepted: false,
      reason:
        'Instruction-like content is not an investigable factual assertion.',
    };
  if (
    /\b(?:I think|I feel|in my opinion|beautiful|best ever|jag tycker|jag känner)\b/i.test(
      text,
    )
  )
    return {
      accepted: false,
      reason:
        'Opinion or preference; no supported factual assertion extracted.',
    };
  if (
    /\b(?:earthquake|earthquakes|quake|quakes|jordbävning|skalv|population|befolkning|invånare|inhabitants)\b/i.test(
      text,
    ) &&
    /\d/.test(text) &&
    /\b(?:was|is|were|are|had|has|have|struck|hit|occurred|happened|reported|estimated|reached|stood|grew|increased|decreased|hade|har|var|är|inträffade|uppgick)\b/i.test(
      text,
    )
  )
    return { accepted: true };
  if (
    /\b(?:reported|said|claimed|killed|injured|arrested|died|announced|invaded|attacked|approved|opened|closed|elected|occurred|struck|grew|decreased|increased|rapporterade|uppgav|dödades|skadades|greps|invaderade|attackerade|inträffade|beslutade|minskade)\b/i.test(
      text,
    )
  )
    return { accepted: true };
  return {
    accepted: false,
    reason:
      'No supported factual candidate identified; original wording remains unassessed.',
  };
}
export function extractClaims(text) {
  const claims = [];
  const unassessed = [];
  for (const match of text.matchAll(/[\s\S]+?(?:[.!?]+(?=\s|$)|\n+|$)/g)) {
    const leading = match[0].length - match[0].trimStart().length;
    const wording = match[0].trim();
    if (!wording) continue;
    const span = {
      start: match.index + leading,
      end: match.index + leading + wording.length,
    };
    const decision = candidate(wording);
    if (!decision.accepted) {
      unassessed.push({ text: wording, span, reason: decision.reason });
      continue;
    }
    const { category, interpretation } = interpretWording(wording);
    claims.push({
      id: `claim-${claims.length + 1}`,
      text: wording,
      span,
      kind: 'source-assertion',
      category,
      interpretation,
      revisions: [],
    });
  }
  // Only unique report context may be suggested across wording spans. It remains an inference.
  const context = interpretWording(text).interpretation;
  const categories = [...new Set(claims.map((claim) => claim.category))];
  for (const claim of claims) {
    const inferred = [];
    if (
      !claim.interpretation.places.length &&
      context.places.length === 1 &&
      context.places[0].countryCode !== null
    ) {
      claim.interpretation.places = context.places.map((place) => ({
        ...place,
      }));
      inferred.push('country');
      claim.interpretation.uncertainty =
        claim.interpretation.uncertainty.filter(
          (note) => !note.startsWith('The country is unresolved.'),
        );
    }
    const sameCategory = claims.filter(
      (item) => item.category === claim.category,
    );
    const dates = [
      ...new Set(
        sameCategory
          .map((item) => item.interpretation.eventDate)
          .filter(Boolean),
      ),
    ];
    const years = [
      ...new Set(
        sameCategory
          .map((item) => item.interpretation.year)
          .filter((value) => value !== null),
      ),
    ];
    if (
      claim.interpretation.eventDate === null &&
      claim.category === 'seismic' &&
      !claim.interpretation.uncertainty.some((note) =>
        /Relative|Multiple|invalid/.test(note),
      )
    ) {
      const date =
        dates.length === 1
          ? dates[0]
          : categories.length === 1
            ? context.eventDate
            : null;
      if (date) {
        claim.interpretation.eventDate = date;
        inferred.push('event date');
      }
    }
    if (
      claim.interpretation.year === null &&
      claim.category === 'population' &&
      !claim.interpretation.uncertainty.some((note) => /Multiple/.test(note))
    ) {
      const periodYear =
        years.length === 1
          ? years[0]
          : categories.length === 1
            ? context.year
            : null;
      if (periodYear !== null) {
        claim.interpretation.year = periodYear;
        inferred.push('year');
      }
    }
    if (inferred.length) {
      const note = `Report-context inference: ${inferred.join(', ')} suggested from unique explicit context elsewhere in this report; not present in this claim span. Inspect and correct.`;
      claim.interpretation.uncertainty.push(note);
      claim.interpretation.notes += ' ' + note;
    }
  }
  return { claims, unassessed };
}
