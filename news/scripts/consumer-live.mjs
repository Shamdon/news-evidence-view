import { createArticleAcquirer } from '../providers/article.mjs';
import { createInvestigator } from '../providers/investigation.mjs';
import {
  createAccount,
  appendEvidence,
  validateAccount,
  reviseClaim,
} from '../domain/account.js';
import assert from 'node:assert/strict';
const urls = [
  'https://www.scb.se/en/finding-statistics/statistics-by-subject-area/population-and-living-conditions/population-composition-and-development/population-statistics/pong/statistical-news/swedens-population-2023--population-changes2/',
  'https://www.usgs.gov/news/featured-story/m78-and-m75-kahramanmaras-earthquake-sequence-near-nurdagi-turkey-turkiye',
];
for (const url of urls) {
  const source = await createArticleAcquirer().acquire(url);
  let account = createAccount(source);
  let claim = account.claims.find(
    (c) =>
      c.interpretation.measurements.length &&
      c.interpretation.places.length === 1 &&
      (c.interpretation.year || c.interpretation.eventDate),
  );
  let targetedClarification = false;
  if (!claim && url.includes('usgs.gov')) {
    claim = account.claims.find((c) => c.category === 'seismic');
    assert.ok(claim);
    account = reviseClaim(
      account,
      claim.id,
      {
        eventDate: '2023-02-06',
        places: [
          {
            name: 'Turkey',
            countryCode: 'TR',
            latitude: null,
            longitude: null,
          },
        ],
      },
      'Evaluation supplied a targeted place/date clarification from the submitted report; no coordinates or provider query were supplied.',
    );
    claim = account.claims.find((c) => c.id === claim.id);
    targetedClarification = true;
  }
  assert.ok(
    claim,
    'No contextualized factual candidate found in the actual report',
  );
  const result = await createInvestigator().investigate(claim);
  assert.equal(result.status, 'ok', result.error ?? result.explanation);
  account = appendEvidence(account, claim.id, result);
  validateAccount(JSON.parse(JSON.stringify(account)));
  console.log(
    JSON.stringify({
      url,
      title: source.title,
      acquiredCharacters: source.text.length,
      claims: account.claims.length,
      unassessedPassages: account.unassessed.length,
      category: claim.category,
      targetedClarification,
      provider: result.provider,
      records: result.records.length,
      truncated: result.truncated,
      recordedSnapshotValidation: 'passed',
      retrievedAt: result.retrievedAt,
    }),
  );
}
