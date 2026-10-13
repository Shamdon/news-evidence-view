import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createConsumer,
  createConsumerStorage,
  consumerView,
  geographyForAccount,
} from '../application/consumer.js';
import { createInvestigator } from '../providers/investigation.mjs';
const now = '2026-10-13T12:00:00Z';
const memory = () => {
  const data = new Map();
  return {
    get length() {
      return data.size;
    },
    key: (i) => [...data.keys()][i],
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
    removeItem: (key) => data.delete(key),
  };
};
const empty = () => ({
  provider: 'fixture-records',
  status: 'empty',
  query: {},
  retrievedAt: now,
  records: [],
  error: null,
  explanation: 'Fixture only: no records in this deterministic source visit.',
  truncated: false,
});
test('ordinary report entrances automatically investigate without technical setup and preserve unassessed wording', async () => {
  const calls = [];
  const app = createConsumer({
    api: {
      investigate: async (claim) => {
        calls.push(claim);
        return empty();
      },
    },
    storage: createConsumerStorage(memory()),
    now: () => now,
  });
  await app.submit({
    mode: 'text',
    value:
      'Sweden had a population of 10.5 million in 2023. In my opinion this is beautiful.',
  });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].interpretation.places[0].countryCode, 'SE');
  assert.equal(calls[0].interpretation.year, 2023);
  assert.equal(app.getState().account.unassessed.length, 1);
  assert.equal(app.getState().pending, null);
  assert.equal(app.getState().account.retrievals[0].status, 'empty');
  assert.equal(Object.isFrozen(app.getState().account), true);
  assert.equal(
    geographyForAccount(app.getState().account, app.getState().selectedId)
      .countries[0],
    'SE',
  );
});
test('article acquisition is a real separate phase; two categories share the same application commands', async () => {
  const seen = [];
  const api = {
    acquire: async (url) => ({
      text: 'On 2023-02-06 a magnitude 7.8 earthquake struck Turkey.',
      title: 'Acquired public report',
      url,
      publicationTime: null,
      sourceFamily: 'fixture-source',
      acquisition: { mode: 'article', notes: 'Fixture acquisition adapter.' },
    }),
    investigate: async (claim) => {
      seen.push(claim.category);
      return empty();
    },
  };
  const app = createConsumer({
    api,
    storage: createConsumerStorage(memory()),
    now: () => now,
  });
  await app.submit({ mode: 'url', value: 'https://example.org/article' });
  assert.equal(app.getState().account.source.acquisition.mode, 'article');
  assert.equal(seen[0], 'seismic');
  await app.submit({
    mode: 'text',
    value: 'Sweden had 10.5 million inhabitants in 2023.',
  });
  assert.equal(seen[1], 'population');
  assert.equal(app.getState().account.schemaVersion, 2);
});
test('headline entrance never silently creates a claim, picks an unrelated story or fetches a candidate', async () => {
  let acquired = 0;
  const api = {
    discover: async () => ({
      status: 'ok',
      candidates: [
        {
          id: 'one',
          title: 'Candidate report',
          url: 'https://example.org/report',
        },
      ],
      explanation: 'Explicit deterministic discovery fixture.',
    }),
    acquire: async (url) => {
      acquired++;
      return { text: 'Sweden had 10.5 million inhabitants in 2023.', url };
    },
    investigate: async () => empty(),
  };
  const app = createConsumer({
    api,
    storage: createConsumerStorage(memory()),
    now: () => now,
  });
  await app.submit({ mode: 'headline', value: 'A headline seen in a feed' });
  assert.equal(app.getState().account, null);
  assert.equal(acquired, 0);
  assert.equal(app.getState().discovery.candidates.length, 1);
  await assert.rejects(app.chooseCandidate('unrelated'));
  await app.chooseCandidate('one');
  assert.equal(acquired, 1);
  assert.ok(app.getState().account.claims.length);
});
test('headline provider failure remains a failure, with no fixture report substituted', async () => {
  const app = createConsumer({
    api: {
      discover: async () => ({
        status: 'error',
        candidates: [],
        explanation: 'News index unavailable. Bring the original URL or text.',
      }),
    },
    storage: createConsumerStorage(memory()),
    now: () => now,
  });
  await app.submit({ mode: 'headline', value: 'Real headline' });
  assert.equal(app.getState().discovery.status, 'error');
  assert.equal(app.getState().account, null);
});
test('save/revisit retains snapshots and correction history; retry appends instead of refreshing existing records', async () => {
  let calls = 0;
  const storage = createConsumerStorage(memory()),
    app = createConsumer({
      api: {
        investigate: async () => {
          calls++;
          return empty();
        },
      },
      storage,
      now: () => now,
    });
  await app.submit({
    mode: 'text',
    value: 'Sweden had 10.5 million inhabitants in 2023.',
  });
  const original = app.getState().account.source.text;
  app.clarify('Sweden in 2022', 'Correct reported year interpretation');
  await app.investigateSelected();
  const id = app.save(),
    exported = app.export();
  app.clear();
  app.load(id);
  assert.equal(app.export(), exported);
  assert.equal(calls, 2);
  assert.equal(app.getState().account.retrievals.length, 2);
  assert.equal(app.getState().account.claims[0].revisions.length, 1);
  assert.equal(app.getState().account.source.text, original);
  assert.equal(
    consumerView(app.getState().account, app.getState().selectedId, 0).snapshot
      .status,
    'empty',
  );
});
test('disposal/case replacement aborts acquisition and prevents late evidence mutation', async () => {
  let resolve, signal;
  const api = {
    acquire: (_url, own) => {
      signal = own;
      return new Promise((r) => (resolve = r));
    },
    investigate: async () => empty(),
  };
  const app = createConsumer({
    api,
    storage: createConsumerStorage(memory()),
    now: () => now,
  });
  const pending = app.submit({
    mode: 'url',
    value: 'https://example.org/private',
  });
  app.dispose();
  assert.equal(signal.aborted, true);
  resolve({ text: 'Sweden had 10.5 million inhabitants in 2023.' });
  await pending;
  assert.equal(app.getState().account, null);
});
test('scope-mismatched records never become substitute evidence for the original claim', async () => {
  let requests = 0;
  const investigator = createInvestigator({
    worldbank: {
      retrieve: async () => {
        requests++;
        return empty();
      },
    },
  });
  const app = createConsumer({
    api: { investigate: (claim) => investigator.investigate(claim) },
    storage: createConsumerStorage(memory()),
    now: () => now,
  });
  await app.submit({
    mode: 'text',
    value: 'Sweden’s population increased by 100,000 people in 2023.',
  });
  assert.equal(requests, 0);
  assert.equal(app.getState().account.retrievals[0].status, 'unresolved');
});

test('clarified quantities select an appropriate capability despite an earlier generic routing hint', async () => {
  let calls = 0;
  const base = empty();
  const investigator = createInvestigator({
    worldbank: {
      retrieve: async () => {
        calls++;
        return { ...base, provider: 'worldbank' };
      },
    },
  });
  const app = createConsumer({
    api: { investigate: (claim) => investigator.investigate(claim) },
    storage: createConsumerStorage(memory()),
    now: () => now,
  });
  await app.submit({
    mode: 'text',
    value: 'Officials reported Sweden reached a new total in 2024.',
  });
  assert.equal(app.getState().account.claims[0].category, 'general');
  assert.equal(calls, 0);
  app.clarify(
    'Sweden population was 10 million in 2024.',
    'Clarify the source quantity',
  );
  await app.investigateSelected();
  assert.equal(calls, 1);
  assert.equal(app.getState().account.claims[0].category, 'general');
  assert.equal(app.getState().account.retrievals.at(-1).provider, 'worldbank');
});
test('a materially different registered documentary capability completes the unchanged account/save path', async () => {
  const investigator = createInvestigator({
    capabilities: [
      {
        id: 'fixture-policy',
        supports: (claim) => claim.category === 'general',
        retrieve: async () => ({
          provider: 'fixture-policy',
          status: 'ok',
          query: { document: 'synthetic-policy' },
          retrievedAt: now,
          error: null,
          explanation:
            'Synthetic adapter conformance fixture; not real reporting or evidence.',
          truncated: false,
          records: [
            {
              id: 'fixture-policy:1',
              kind: 'source-assertion',
              provider: 'fixture-policy',
              sourceFamily: 'fixture-document',
              title: 'SYNTHETIC public-policy document assertion',
              url: 'https://example.org/fixture-policy',
              retrievedAt: now,
              publicationTime: null,
              observationTime: null,
              eventTime: null,
              period: { kind: 'year', value: '2024' },
              places: [],
              measurements: [],
              limitations: [
                'Fixture only. No live documentary acquisition or confirmation is implied.',
              ],
            },
          ],
        }),
      },
    ],
  });
  const app = createConsumer({
    api: { investigate: (claim) => investigator.investigate(claim) },
    storage: createConsumerStorage(memory()),
    now: () => now,
  });
  await app.submit({
    mode: 'text',
    value: 'Officials reported the government announced a policy in 2024.',
  });
  const id = app.save(),
    exported = app.export();
  app.clear();
  app.load(id);
  assert.equal(app.export(), exported);
  assert.equal(
    app.getState().account.retrievals[0].records[0].kind,
    'source-assertion',
  );
  assert.match(
    consumerView(app.getState().account, app.getState().selectedId).records[0]
      .assessment.explanation,
    /does not promote it to an observation/,
  );
});
