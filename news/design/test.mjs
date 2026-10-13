import test from 'node:test';
import assert from 'node:assert/strict';
import { claimView } from './account-view.js';
import { fixtures } from './fixtures.js';
for (const [key, account] of Object.entries(fixtures)) {
  test(`${key}: partial account cannot present unavailable record as inspected evidence`, () => {
    const original = structuredClone(account);
    const last = claimView(account, account.claims.length - 1, 'partial');
    assert.match(last.status, /Unassessed/);
    assert.equal(last.family, 'No usable evidence record');
    assert.match(last.evidence, /No usable evidence record/);
    assert.match(last.limit, /Missing evidence does not prove absence/);
    assert.equal(last.quote, account.claims.at(-1).quote);
    assert.deepEqual(
      account,
      original,
      'Display changes must not rewrite the retained fixture snapshot',
    );
    assert.deepEqual(
      claimView(account, 0, 'partial'),
      account.claims[0],
      'Partial success retains available evidence',
    );
  });
  test(`${key}: returning to ready restores retained record, without rewriting it`, () => {
    const index = account.claims.length - 1;
    assert.notEqual(
      claimView(account, index, 'partial').evidence,
      account.claims[index].evidence,
    );
    assert.deepEqual(claimView(account, index, 'ready'), account.claims[index]);
  });
}
