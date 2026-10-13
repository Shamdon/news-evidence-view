import { createUSGSProvider } from '../providers/usgs.mjs';
import {
  createCase,
  addRetrieval,
  compareClaim,
  validateCase,
} from '../domain/case.js';
import assert from 'node:assert/strict';
// Public historical catalog only. Never use private submitted material in this gate.
const provider = createUSGSProvider();
const input = await provider.acquire(
  'https://earthquake.usgs.gov/earthquakes/eventpage/us6000jllz',
);
let account = createCase(input);
const result = await provider.retrieve({
  startDate: '2023-02-06',
  endDate: '2023-02-06',
  latitude: 37.2,
  longitude: 37,
  radiusKm: 100,
});
assert.equal(result.status, 'ok');
assert.ok(result.evidence.length > 0);
account = addRetrieval(account, account.claims[0].id, result);
validateCase(JSON.parse(JSON.stringify(account)));
assert.equal(
  compareClaim(account.claims[0], result.evidence[0], account.source.url)
    .status,
  'dependent',
);
console.log(
  JSON.stringify(
    {
      inputUrl: input.url,
      input: 'real official report acquired',
      provider: result.provider,
      status: result.status,
      records: result.evidence.length,
      truncated: result.truncated,
      retrievedAt: result.retrievedAt,
      sourceDependence: 'explicitly dependent',
      savedSnapshotValidation: 'passed',
    },
    null,
    2,
  ),
);
