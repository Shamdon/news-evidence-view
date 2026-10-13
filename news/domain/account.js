import { extractClaims } from '../interpretation/claims.js';
const MAX_TEXT = 100000;
const INTERPRETATION_KEYS = [
  'eventDate',
  'year',
  'places',
  'measurements',
  'uncertainty',
  'notes',
];
const fail = (message) => {
  throw new TypeError(message);
};
const text = (value, label, max = 2000) => {
  if (typeof value !== 'string' || value.length > max) fail(`Invalid ${label}`);
};
const identifier = (value) => {
  if (typeof value !== 'string' || !/^[a-z0-9][a-z0-9_-]{0,79}$/.test(value))
    fail('Invalid identifier');
};
const recordId = (value) => {
  text(value, 'record id', 200);
  if (!value.trim() || /[\u0000-\u001f]/.test(value)) fail('Invalid record id');
};
const plain = (value) => {
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    ![Object.prototype, null].includes(Object.getPrototypeOf(value))
  )
    fail('Expected plain record');
};
const keys = (value, allowed, label) => {
  plain(value);
  if (Object.keys(value).some((key) => !allowed.includes(key)))
    fail(`Unexpected ${label} field`);
};
const finite = (value, min, max, label) => {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    value < min ||
    value > max
  )
    fail(`Invalid ${label}`);
};
const nullable = (value, fn) => {
  if (value !== null) fn(value);
};
const list = (value, maximum, label) => {
  if (!Array.isArray(value) || value.length > maximum) fail(`Invalid ${label}`);
};
function day(value) {
  text(value, 'day', 10);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    !Number.isFinite(Date.parse(value)) ||
    new Date(value).toISOString().slice(0, 10) !== value
  )
    fail('Invalid calendar date');
}
function instant(value) {
  text(value, 'timestamp', 40);
  if (
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(
      value,
    ) ||
    !Number.isFinite(Date.parse(value))
  )
    fail('Invalid timestamp');
  day(value.slice(0, 10));
  const [h, m, s] = value.slice(11, 19).split(':').map(Number);
  if (h > 23 || m > 59 || s > 59) fail('Invalid timestamp');
}
function link(value) {
  text(value, 'URL', 4096);
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    fail('Invalid URL');
  }
  if (
    !['http:', 'https:'].includes(parsed.protocol) ||
    parsed.username ||
    parsed.password
  )
    fail('Unsafe URL');
}
function year(value) {
  if (!Number.isInteger(value) || value < 1 || value > 9999)
    fail('Invalid year');
}
function jsonTree(value, depth = 0, count = { n: 0 }) {
  if (++count.n > 60000 || depth > 15) fail('Record too complex');
  if (value === null || ['string', 'boolean'].includes(typeof value)) return;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) fail('Invalid JSON number');
    return;
  }
  if (typeof value !== 'object') fail('Expected JSON data');
  if (!Array.isArray(value)) plain(value);
  for (const [key, descriptor] of Object.entries(
    Object.getOwnPropertyDescriptors(value),
  )) {
    if (
      ['__proto__', 'constructor', 'prototype'].includes(key) ||
      descriptor.get ||
      descriptor.set
    )
      fail('Unsafe JSON field');
    jsonTree(descriptor.value, depth + 1, count);
  }
}
function strings(values, label) {
  list(values, 30, label);
  values.forEach((value) => text(value, label, 2000));
}
function place(value) {
  keys(value, ['name', 'countryCode', 'latitude', 'longitude'], 'place');
  text(value.name, 'place name', 500);
  if (!value.name.trim()) fail('Empty place');
  nullable(value.countryCode, (code) => {
    if (typeof code !== 'string' || !/^[A-Z]{2}$/.test(code))
      fail('Invalid country code');
  });
  nullable(value.latitude, (v) => finite(v, -90, 90, 'latitude'));
  nullable(value.longitude, (v) => finite(v, -180, 180, 'longitude'));
  if ((value.latitude === null) !== (value.longitude === null))
    fail('Incomplete coordinates');
}
function measurement(value, reported) {
  keys(
    value,
    reported
      ? ['key', 'value', 'unit', 'comparator']
      : ['key', 'value', 'unit', 'methodology'],
    'measurement',
  );
  identifier(value.key);
  finite(value.value, -1e15, 1e15, 'measurement');
  text(value.unit, 'unit', 100);
  if (!value.unit.trim()) fail('Empty unit');
  if (reported) {
    if (!['eq', 'gt', 'lt', 'approx'].includes(value.comparator))
      fail('Invalid comparator');
  } else nullable(value.methodology, (v) => text(v, 'methodology', 2000));
}
function interpretation(value) {
  keys(value, INTERPRETATION_KEYS, 'interpretation');
  nullable(value.eventDate, day);
  nullable(value.year, year);
  list(value.places, 20, 'places');
  value.places.forEach(place);
  list(value.measurements, 30, 'measurements');
  value.measurements.forEach((v) => measurement(v, true));
  strings(value.uncertainty, 'uncertainty');
  text(value.notes, 'notes', 4000);
}
function period(value) {
  keys(value, ['kind', 'value'], 'period');
  if (value.kind === 'day') day(value.value);
  else if (value.kind === 'year') {
    if (typeof value.value !== 'string' || !/^\d{4}$/.test(value.value))
      fail('Invalid period year');
    year(Number(value.value));
  } else if (value.kind === 'instant') instant(value.value);
  else fail('Invalid period kind');
}
function evidence(value) {
  keys(
    value,
    [
      'id',
      'kind',
      'provider',
      'sourceFamily',
      'title',
      'url',
      'retrievedAt',
      'publicationTime',
      'observationTime',
      'eventTime',
      'period',
      'places',
      'measurements',
      'limitations',
    ],
    'evidence',
  );
  recordId(value.id);
  if (
    ![
      'observation',
      'source-assertion',
      'inference',
      'reconstruction',
    ].includes(value.kind)
  )
    fail('Invalid evidence kind');
  identifier(value.provider);
  identifier(value.sourceFamily);
  text(value.title, 'title');
  link(value.url);
  instant(value.retrievedAt);
  nullable(value.publicationTime, instant);
  nullable(value.observationTime, instant);
  nullable(value.eventTime, instant);
  nullable(value.period, period);
  list(value.places, 20, 'places');
  value.places.forEach(place);
  list(value.measurements, 30, 'measurements');
  value.measurements.forEach((v) => measurement(v, false));
  strings(value.limitations, 'limitations');
}
function source(value) {
  keys(
    value,
    [
      'text',
      'title',
      'url',
      'publicationTime',
      'accessedAt',
      'acquisition',
      'sourceFamily',
    ],
    'source',
  );
  text(value.text, 'source text', MAX_TEXT);
  if (!value.text.trim()) fail('Empty source');
  text(value.title, 'title', 1000);
  nullable(value.url, link);
  nullable(value.publicationTime, instant);
  instant(value.accessedAt);
  nullable(value.sourceFamily, identifier);
  keys(value.acquisition, ['mode', 'notes', 'truncated'], 'acquisition');
  if (
    value.acquisition.truncated !== undefined &&
    typeof value.acquisition.truncated !== 'boolean'
  )
    fail('Invalid acquisition truncation flag');
  if (!['text', 'article', 'catalog'].includes(value.acquisition.mode))
    fail('Invalid acquisition mode');
  text(value.acquisition.notes, 'acquisition notes', 4000);
}
function spanRecord(value, sourceText) {
  keys(value.span, ['start', 'end'], 'span');
  if (
    !Number.isInteger(value.span.start) ||
    !Number.isInteger(value.span.end) ||
    value.span.start < 0 ||
    value.span.end <= value.span.start ||
    value.span.end > sourceText.length
  )
    fail('Invalid span');
  text(value.text, 'wording', MAX_TEXT);
  if (value.text !== sourceText.slice(value.span.start, value.span.end))
    fail('Source span mismatch');
}
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonical(value[key])]),
    );
  return value;
}
function sameInterpretation(a, b) {
  return INTERPRETATION_KEYS.every(
    (key) =>
      JSON.stringify(canonical(a[key])) === JSON.stringify(canonical(b[key])),
  );
}
function snapshot(value, claimIds) {
  keys(
    value,
    [
      'id',
      'claimId',
      'recordedAt',
      'provider',
      'status',
      'query',
      'retrievedAt',
      'records',
      'error',
      'explanation',
      'truncated',
    ],
    'retrieval',
  );
  recordId(value.id);
  if (!claimIds.has(value.claimId)) fail('Unknown retrieval claim');
  instant(value.recordedAt);
  identifier(value.provider);
  if (!['ok', 'empty', 'error', 'unresolved'].includes(value.status))
    fail('Invalid retrieval status');
  instant(value.retrievedAt);
  plain(value.query);
  jsonTree(value.query);
  if (JSON.stringify(value.query).length > 16000) fail('Query too large');
  list(value.records, 500, 'records');
  value.records.forEach((record) => {
    evidence(record);
    if (record.provider !== value.provider) fail('Provider mismatch');
  });
  nullable(value.error, (v) => text(v, 'error', 2000));
  text(value.explanation, 'explanation', 4000);
  if (typeof value.truncated !== 'boolean') fail('Invalid truncation flag');
  if ((value.status === 'error') !== (typeof value.error === 'string'))
    fail('Error status/detail mismatch');
  if (value.status === 'ok' && !value.records.length)
    fail('Use empty for no records');
  if (value.status !== 'ok' && value.records.length)
    fail('Non-success snapshot contains evidence');
}
export function validateAccount(value) {
  jsonTree(value);
  if (JSON.stringify(value).length > 2500000) fail('Account too large');
  keys(
    value,
    [
      'schemaVersion',
      'id',
      'createdAt',
      'source',
      'claims',
      'unassessed',
      'retrievals',
    ],
    'account',
  );
  if (value.schemaVersion !== 2) fail('Unsupported account version');
  recordId(value.id);
  instant(value.createdAt);
  source(value.source);
  list(value.claims, 250, 'claims');
  list(value.unassessed, 500, 'unassessed text');
  const claimIds = new Set();
  const spans = [];
  for (const claim of value.claims) {
    keys(
      claim,
      ['id', 'text', 'span', 'kind', 'category', 'interpretation', 'revisions'],
      'claim',
    );
    recordId(claim.id);
    if (claimIds.has(claim.id)) fail('Duplicate claim');
    claimIds.add(claim.id);
    spanRecord(claim, value.source.text);
    spans.push(claim.span);
    if (claim.kind !== 'source-assertion') fail('Invalid claim kind');
    identifier(claim.category);
    interpretation(claim.interpretation);
    list(claim.revisions, 100, 'revisions');
    let previous = null;
    for (const revision of claim.revisions) {
      keys(revision, ['at', 'reason', 'before', 'after'], 'revision');
      instant(revision.at);
      text(revision.reason, 'reason', 2000);
      if (!revision.reason.trim()) fail('Correction requires reason');
      interpretation(revision.before);
      interpretation(revision.after);
      if (previous && !sameInterpretation(previous, revision.before))
        fail('Broken revision history');
      previous = revision.after;
    }
    if (previous && !sameInterpretation(previous, claim.interpretation))
      fail('Revision mismatch');
  }
  for (const remainder of value.unassessed) {
    keys(remainder, ['text', 'span', 'reason'], 'unassessed text');
    spanRecord(remainder, value.source.text);
    text(remainder.reason, 'reason', 2000);
    spans.push(remainder.span);
  }
  spans.sort((a, b) => a.start - b.start);
  let cursor = 0;
  for (const span of spans) {
    if (span.start < cursor) fail('Overlapping source spans');
    if (value.source.text.slice(cursor, span.start).trim())
      fail('Unrepresented source text');
    cursor = span.end;
  }
  if (value.source.text.slice(cursor).trim()) fail('Unrepresented source text');
  list(value.retrievals, 100, 'retrievals');
  const snapshotIds = new Set();
  for (const retrieval of value.retrievals) {
    snapshot(retrieval, claimIds);
    if (snapshotIds.has(retrieval.id)) fail('Duplicate snapshot');
    snapshotIds.add(retrieval.id);
  }
  return value;
}
export function createAccount(input, now = new Date().toISOString()) {
  plain(input);
  jsonTree(input);
  text(input.text, 'source text', MAX_TEXT);
  const { claims, unassessed } = extractClaims(input.text);
  return validateAccount({
    schemaVersion: 2,
    id:
      globalThis.crypto?.randomUUID?.() ||
      `account-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    createdAt: now,
    source: {
      text: input.text,
      title: input.title ?? '',
      url: input.url ?? null,
      publicationTime: input.publicationTime ?? null,
      accessedAt: now,
      acquisition: input.acquisition ?? {
        mode: 'text',
        notes: 'Submitted text; no remote source acquisition was performed.',
      },
      sourceFamily: input.sourceFamily ?? null,
    },
    claims,
    unassessed,
    retrievals: [],
  });
}
export function reviseClaim(
  account,
  id,
  patch,
  reason,
  now = new Date().toISOString(),
) {
  validateAccount(account);
  keys(patch, INTERPRETATION_KEYS, 'correction');
  jsonTree(patch);
  const next = JSON.parse(JSON.stringify(account));
  const claim = next.claims.find((value) => value.id === id);
  if (!claim) fail('Unknown claim');
  const before = JSON.parse(JSON.stringify(claim.interpretation));
  claim.interpretation = {
    ...claim.interpretation,
    ...JSON.parse(JSON.stringify(patch)),
  };
  claim.revisions.push({
    at: now,
    reason,
    before,
    after: JSON.parse(JSON.stringify(claim.interpretation)),
  });
  return validateAccount(next);
}
export function appendEvidence(
  account,
  claimId,
  result,
  now = new Date().toISOString(),
) {
  validateAccount(account);
  jsonTree(result);
  plain(result);
  const next = JSON.parse(JSON.stringify(account));
  next.retrievals.push({
    ...JSON.parse(JSON.stringify(result)),
    id: `snapshot-${next.retrievals.length + 1}`,
    claimId,
    recordedAt: now,
  });
  return validateAccount(next);
}
function sourceDependent(record, submitted) {
  return Boolean(
    submitted?.sourceFamily && submitted.sourceFamily === record.sourceFamily,
  );
}
export function assessClaim(claim, record, submitted = null) {
  interpretation(claim.interpretation);
  evidence(record);
  const dependent = sourceDependent(record, submitted);
  const messages = [];
  const comparisons = [];
  const unavailable = [];
  let approximate = false;
  for (const expected of claim.interpretation.measurements) {
    const measured = record.measurements.find(
      (value) => value.key === expected.key && value.unit === expected.unit,
    );
    if (!measured) {
      unavailable.push(expected.key);
      continue;
    }
    const tolerance = 1e-6;
    if (expected.comparator === 'approx') approximate = true;
    const matches =
      expected.comparator === 'gt'
        ? measured.value > expected.value
        : expected.comparator === 'lt'
          ? measured.value < expected.value
          : Math.abs(expected.value - measured.value) <= tolerance;
    comparisons.push(matches);
    messages.push(
      `Reported ${expected.key} ${expected.comparator} ${expected.value} ${expected.unit}; retrieved ${measured.value} ${measured.unit}: ${matches ? 'measurement agreement' : 'measurement difference'}${expected.comparator === 'approx' ? '; the report uses approximate wording, so no accuracy tolerance or confirmation has been inferred' : ''}.`,
    );
  }
  let mismatchedContext = claim.interpretation.uncertainty.some((note) =>
    note.startsWith('End-of-year count:'),
  );
  if (mismatchedContext)
    messages.push(
      'The report describes an end-of-year count. An annual period alone does not establish the same reference date or methodology.',
    );
  const expectedDate = claim.interpretation.eventDate;
  const recordedDate = record.eventTime
    ? new Date(record.eventTime).toISOString().slice(0, 10)
    : record.period?.kind === 'day'
      ? record.period.value
      : null;
  if (expectedDate && recordedDate) {
    mismatchedContext = mismatchedContext || expectedDate !== recordedDate;
    messages.push(
      `Reported event date ${expectedDate}; retrieved date ${recordedDate}${mismatchedContext ? ': dates differ' : ': dates agree'}. Local dates and UTC may differ.`,
    );
  }
  if (claim.interpretation.year !== null && record.period?.kind === 'year') {
    const differs = String(claim.interpretation.year) !== record.period.value;
    mismatchedContext = mismatchedContext || differs;
    messages.push(
      `Reported year ${claim.interpretation.year}; evidence period ${record.period.value}${differs ? ': years differ' : ': years agree'}.`,
    );
  }
  const expectedCountries = claim.interpretation.places
    .map((value) => value.countryCode)
    .filter(Boolean);
  const retrievedCountries = record.places
    .map((value) => value.countryCode)
    .filter(Boolean);
  if (
    expectedCountries.length &&
    retrievedCountries.length &&
    !expectedCountries.some((code) => retrievedCountries.includes(code))
  ) {
    mismatchedContext = true;
    messages.push('The reported and retrieved country contexts differ.');
  }
  if (unavailable.length)
    messages.push(
      `Unassessed measurements: ${unavailable.join(', ')}. No matching measurement and unit was retrieved.`,
    );
  if (dependent)
    messages.push(
      'The report and retrieved record share a source family; this is not independent corroboration. Numerical or date differences remain visible.',
    );
  else
    messages.push(
      'Source independence is unresolved unless the underlying sources are traced.',
    );
  if (['inference', 'reconstruction'].includes(record.kind))
    messages.push(
      `This record is a ${record.kind}, not an independently retrieved observation.`,
    );
  else if (record.kind === 'source-assertion')
    messages.push(
      'The retrieved record is a source assertion; comparison does not promote it to an observation.',
    );
  messages.push(
    'These comparisons do not establish event identity or an overall truth verdict. Country context and proximity do not establish involvement or causation. Measurement scales, reference dates and methodologies may differ. Unsupported allegations and other unmeasured claims remain unassessed.',
  );
  const status = dependent
    ? 'dependent'
    : ['inference', 'reconstruction'].includes(record.kind) ||
        mismatchedContext ||
        approximate
      ? 'context'
      : !comparisons.length
        ? 'unassessed'
        : comparisons.some((value) => !value)
          ? 'difference'
          : 'agreement';
  return { status, explanation: messages.join(' ') };
}
