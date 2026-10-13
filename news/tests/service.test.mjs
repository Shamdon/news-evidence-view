import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, symlink, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { createNewsServer } from '../server/http.mjs';
import {
  createUSGSProvider,
  validateQuery,
  validateReportURL,
} from '../providers/usgs.mjs';
import { createProviderRegistry } from '../providers/registry.mjs';
const query = {
  startDate: '2026-01-01',
  endDate: '2026-01-02',
  latitude: null,
  longitude: null,
  radiusKm: 300,
};
const feature = {
  type: 'Feature',
  id: 'us123',
  properties: {
    time: 1767225600000,
    updated: 1767225601000,
    title: 'M 4.5 - sample',
    mag: 4.5,
    magType: 'mw',
    status: 'reviewed',
  },
  geometry: { type: 'Point', coordinates: [12, 34, 10] },
};
const json = (data) =>
  new Response(JSON.stringify(data), {
    headers: { 'content-type': 'application/json' },
  });
const post = (url, data, headers = {}) =>
  fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(data),
  });
test('query bounds and inclusive dates', () => {
  assert.equal(
    validateQuery({ ...query, endDate: '2026-01-07' }).endDate,
    '2026-01-07',
  );
  for (const bad of [
    { ...query, endDate: '2026-01-08' },
    { ...query, startDate: '2026-02-30' },
    { ...query, latitude: 1 },
    { ...query, latitude: 91, longitude: 1 },
    { ...query, radiusKm: Infinity },
    { ...query, radiusKm: 1001 },
  ])
    assert.throws(() => validateQuery(bad));
});
test('trusted adapter registry cannot resolve request-chosen code', () => {
  const mock = {
    retrieve() {
      return 'mock';
    },
  };
  assert.equal(createProviderRegistry({ usgs: mock }).get('usgs'), mock);
  for (const name of [
    '__proto__',
    'constructor',
    'https://bad.invalid',
    'other',
  ])
    assert.throws(() => createProviderRegistry().get(name));
});
test('USGS query has fixed endpoint, no magnitude bias, provenance, dedup and empty distinction', async () => {
  let seen;
  const provider = createUSGSProvider({
    fetchImpl: async (url, options) => {
      seen = { url, options };
      return json({ type: 'FeatureCollection', features: [feature, feature] });
    },
    now: () => '2026-01-10T00:00:00.000Z',
  });
  const result = await provider.retrieve(query);
  assert.equal(result.status, 'ok');
  assert.equal(result.evidence.length, 1);
  assert.equal(result.evidence[0].sourceFamily, 'usgs-comcat');
  assert.equal(result.evidence[0].publicationTime, null);
  assert.equal(result.evidence[0].observationTime, null);
  assert.equal(result.evidence[0].latitude, 34);
  assert.equal(seen.url.origin, 'https://earthquake.usgs.gov');
  assert.equal(seen.url.searchParams.has('minmagnitude'), false);
  assert.equal(seen.url.searchParams.get('limit'), '100');
  assert.equal(seen.options.redirect, 'error');
  const empty = await createUSGSProvider({
    fetchImpl: async () => json({ type: 'FeatureCollection', features: [] }),
  }).retrieve(query);
  assert.equal(empty.status, 'empty');
  assert.equal(empty.error, null);
  const noContent = await createUSGSProvider({
    fetchImpl: async () => new Response(null, { status: 204 }),
  }).retrieve(query);
  assert.equal(noContent.status, 'empty');
});
test('malformed, oversized and failed responses become safe errors; conservative truncation', async () => {
  for (const fetchImpl of [
    async () => json({ features: [] }),
    async () =>
      json({
        type: 'FeatureCollection',
        features: [{ ...feature, geometry: null }],
      }),
    async () => {
      throw new Error('secret-token=abc');
    },
    async () => new Response('x'.repeat(2_000_001)),
  ]) {
    const result = await createUSGSProvider({ fetchImpl }).retrieve(query);
    assert.equal(result.status, 'error');
    assert.deepEqual(result.evidence, []);
    assert.doesNotMatch(result.error, /secret-token|abc/);
  }
  const result = await createUSGSProvider({
    fetchImpl: async () =>
      json({
        type: 'FeatureCollection',
        features: Array.from({ length: 100 }, () => feature),
      }),
  }).retrieve(query);
  assert.equal(result.truncated, true);
});
test('provider timeout and caller cancellation are safe', async () => {
  const fetchImpl = async (_url, { signal }) =>
    new Promise((resolve, reject) => {
      signal.addEventListener('abort', () => reject(signal.reason), {
        once: true,
      });
    });
  const keepAlive = setInterval(() => {}, 100);
  try {
    const result = await createUSGSProvider({
      fetchImpl,
      timeoutMs: 20,
    }).retrieve(query);
    assert.equal(result.status, 'error');
  } finally {
    clearInterval(keepAlive);
  }
  const controller = new AbortController();
  setTimeout(() => controller.abort(), 10);
  assert.equal(
    (
      await createUSGSProvider({ fetchImpl }).retrieve(query, {
        signal: controller.signal,
      })
    ).status,
    'error',
  );
});
test('acquisition refuses arbitrary fetching and reports dependent catalog provenance', async () => {
  for (const url of [
    'http://127.0.0.1/',
    'https://earthquake.usgs.gov.evil.test/earthquakes/eventpage/us123',
    'https://user:pass@earthquake.usgs.gov/earthquakes/eventpage/us123',
    'https://earthquake.usgs.gov:444/earthquakes/eventpage/us123',
    'https://earthquake.usgs.gov/earthquakes/eventpage/us123?redirect=http://localhost',
    'https://earthquake.usgs.gov/earthquakes/eventpage/us123/../origin',
    'https://example.com/report',
  ])
    assert.throws(() => validateReportURL(url));
  let target;
  const acquired = await createUSGSProvider({
    fetchImpl: async (url) => {
      target = url;
      return json(feature);
    },
  }).acquire(
    'https://earthquake.usgs.gov/earthquakes/eventpage/us123/executive',
  );
  assert.equal(target.searchParams.get('eventid'), 'us123');
  assert.equal(target.origin, 'https://earthquake.usgs.gov');
  assert.equal(acquired.publicationTime, null);
  assert.match(acquired.text, /not independent corroboration/);
  assert.match(
    acquired.text,
    /rendered as text by this adapter, not quoted article prose/,
  );
  assert.match(
    acquired.text,
    /Official record: https:\/\/earthquake\.usgs\.gov/,
  );
});
function rawRequest(port, requestPath, headers = {}) {
  return new Promise((resolve, reject) => {
    http
      .get(
        { hostname: '127.0.0.1', port, path: requestPath, headers },
        (res) => {
          let body = '';
          res.on('data', (c) => (body += c));
          res.on('end', () => resolve({ status: res.statusCode, body }));
        },
      )
      .on('error', reject);
  });
}
test('ephemeral server static and API boundary protections', async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), 'news-server-'));
  await mkdir(path.join(root, 'presentation'));
  await writeFile(path.join(root, 'presentation/index.html'), '<h1>Test</h1>');
  await writeFile(path.join(root, 'secret.json'), 'secret');
  await symlink(
    path.join(root, 'secret.json'),
    path.join(root, 'presentation/escape.json'),
  );
  let calls = 0;
  const provider = {
    async retrieve(q) {
      calls++;
      return {
        provider: 'usgs',
        status: 'empty',
        query: q,
        evidence: [],
        truncated: false,
        error: null,
        retrievedAt: '2026-01-01T00:00:00Z',
      };
    },
    async acquire() {
      return {
        text: 'Official report',
        url: 'https://earthquake.usgs.gov/earthquakes/eventpage/us123',
        publicationTime: null,
      };
    },
  };
  const server = createNewsServer({ root, providers: { usgs: provider } });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port,
    url = `http://127.0.0.1:${port}`;
  t.after(async () => {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
    await rm(root, { recursive: true, force: true });
  });
  const home = await fetch(url);
  assert.equal(home.status, 200);
  assert.match(await home.text(), /Test/);
  assert.match(
    home.headers.get('content-security-policy'),
    /frame-ancestors 'none'/,
  );
  assert.equal(home.headers.get('cache-control'), 'no-store');
  assert.equal(home.headers.get('x-content-type-options'), 'nosniff');
  for (const requestPath of [
    '/.git/config',
    '/.env',
    '/providers/usgs.mjs',
    '/presentation/escape.json',
    '/presentation/../secret.json',
    '/presentation/%2e%2e/secret.json',
    '/presentation/%252e%252e/secret.json',
    '/presentation/%5c..%5csecret.json',
  ])
    assert.ok(
      [400, 404].includes((await rawRequest(port, requestPath)).status),
      requestPath,
    );
  assert.equal(
    (await rawRequest(port, '/', { Host: 'evil.test' })).status,
    403,
  );
  assert.equal(
    (
      await post(
        `${url}/api/retrieve`,
        { provider: 'usgs', query },
        { Origin: 'https://evil.test' },
      )
    ).status,
    403,
  );
  assert.equal(calls, 0);
  assert.equal(
    (await post(`${url}/api/retrieve`, { provider: 'usgs', query })).status,
    200,
  );
  assert.equal(calls, 1);
  assert.equal(
    (await post(`${url}/api/retrieve`, { provider: 'other', query })).status,
    400,
  );
  assert.equal(
    (
      await post(`${url}/api/retrieve`, {
        provider: 'usgs',
        query: { ...query, endDate: '2026-02-01' },
      })
    ).status,
    400,
  );
  assert.equal(
    (await post(`${url}/api/acquire`, { url: 'http://127.0.0.1/private' }))
      .status,
    400,
  );
  assert.equal(
    (
      await post(`${url}/api/acquire`, {
        url: 'https://earthquake.usgs.gov/earthquakes/eventpage/us123',
      })
    ).status,
    200,
  );
  assert.equal(
    (
      await fetch(`${url}/api/retrieve`, {
        method: 'POST',
        headers: { 'content-type': 'text/plain' },
        body: '{}',
      })
    ).status,
    415,
  );
  assert.equal(
    (await post(`${url}/api/retrieve`, { padding: 'x'.repeat(17000) })).status,
    413,
  );
  assert.equal(
    (
      await fetch(`${url}/api/retrieve`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{bad',
      })
    ).status,
    400,
  );
});
test('client disconnect aborts provider request without retaining report', async (t) => {
  let received;
  const entered = new Promise((resolve) => {
    received = resolve;
  });
  let cancelled;
  const aborted = new Promise((resolve) => {
    cancelled = resolve;
  });
  const provider = {
    async retrieve(q, { signal }) {
      received();
      await new Promise((resolve) => {
        signal.addEventListener(
          'abort',
          () => {
            cancelled();
            resolve();
          },
          { once: true },
        );
      });
      return { status: 'error', evidence: [] };
    },
  };
  const server = createNewsServer({ providers: { usgs: provider } });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(async () => {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  });
  const port = server.address().port;
  const req = http.request(
    {
      hostname: '127.0.0.1',
      port,
      path: '/api/retrieve',
      method: 'POST',
      headers: { 'content-type': 'application/json' },
    },
    () => {},
  );
  req.on('error', () => {});
  req.end(JSON.stringify({ provider: 'usgs', query }));
  await entered;
  req.destroy();
  await Promise.race([
    aborted,
    new Promise((_, reject) => {
      const timer = setTimeout(
        () => reject(new Error('Provider was not cancelled')),
        1000,
      );
      timer.unref();
    }),
  ]);
});
test('out-of-range catalog physics and non-point geometry fail the whole snapshot', async () => {
  for (const bad of [
    { ...feature, properties: { ...feature.properties, mag: 12.1 } },
    { ...feature, properties: { ...feature.properties, mag: -5.1 } },
    { ...feature, geometry: { type: 'Point', coordinates: [12, 34, 1001] } },
    { ...feature, geometry: { type: 'Point', coordinates: [12, 34, -101] } },
    { ...feature, geometry: { type: 'LineString', coordinates: [12, 34, 10] } },
  ]) {
    const result = await createUSGSProvider({
      fetchImpl: async () =>
        json({ type: 'FeatureCollection', features: [feature, bad] }),
    }).retrieve(query);
    assert.equal(result.status, 'error');
    assert.deepEqual(result.evidence, []);
  }
});
test('local API caps four concurrent requests and thirty requests per minute', async (t) => {
  let releases = [];
  let entered = 0;
  let notify;
  const ready = new Promise((resolve) => {
    notify = resolve;
  });
  const slow = {
    async retrieve() {
      entered++;
      if (entered === 4) notify();
      await new Promise((resolve) => releases.push(resolve));
      return { status: 'empty', evidence: [] };
    },
  };
  const server = createNewsServer({ providers: { usgs: slow } });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(async () => {
    releases.forEach((fn) => fn());
    server.abortPending();
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  });
  const url = `http://127.0.0.1:${server.address().port}/api/retrieve`;
  const pending = Array.from({ length: 4 }, () =>
    post(url, { provider: 'usgs', query }),
  );
  await ready;
  const rejected = await post(url, { provider: 'usgs', query });
  assert.equal(rejected.status, 429);
  assert.equal(rejected.headers.get('retry-after'), '60');
  assert.equal(entered, 4);
  releases.forEach((fn) => fn());
  assert.ok(
    (await Promise.all(pending)).every((response) => response.status === 200),
  );
  const fast = createNewsServer({
    providers: {
      usgs: {
        async retrieve() {
          return { status: 'empty', evidence: [] };
        },
      },
    },
  });
  await new Promise((resolve) => fast.listen(0, '127.0.0.1', resolve));
  t.after(async () => {
    fast.closeAllConnections();
    await new Promise((resolve) => fast.close(resolve));
  });
  const fastURL = `http://127.0.0.1:${fast.address().port}/api/retrieve`;
  for (let i = 0; i < 30; i++)
    assert.equal(
      (await post(fastURL, { provider: 'usgs', query })).status,
      200,
    );
  assert.equal((await post(fastURL, { provider: 'usgs', query })).status, 429);
});
test('second trusted fixture seismic provider can retrieve through the HTTP boundary', async (t) => {
  const fixture = {
    async retrieve(q) {
      return {
        provider: 'fixture-seismic',
        status: 'ok',
        query: q,
        retrievedAt: '2026-01-10T00:00:00Z',
        evidence: [
          {
            id: 'fixture-seismic:demo',
            provider: 'fixture-seismic',
            sourceFamily: 'fixture-catalog',
            title: 'Fixture catalog event — synthetic test data',
            url: null,
            eventTime: '2026-01-01T00:00:00Z',
            observationTime: null,
            publicationTime: null,
            updatedAt: null,
            retrievedAt: '2026-01-10T00:00:00Z',
            latitude: 34,
            longitude: 12,
            depthKm: 10,
            magnitude: 4.5,
            magnitudeType: 'fixture',
            reviewStatus: 'fixture',
            limitations: 'Synthetic test fixture. No real retrieved evidence.',
          },
        ],
        error: null,
        truncated: false,
      };
    },
  };
  const server = createNewsServer({
    providers: { 'fixture-seismic': fixture },
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(async () => {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  });
  const url = `http://127.0.0.1:${server.address().port}/api/retrieve`;
  const response = await post(url, { provider: 'fixture-seismic', query });
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.provider, 'fixture-seismic');
  assert.equal(result.evidence[0].sourceFamily, 'fixture-catalog');
  assert.match(result.evidence[0].limitations, /Synthetic test fixture/);
  assert.deepEqual(result.query, query);
  assert.equal(
    (await post(url, { provider: 'unregistered-seismic', query })).status,
    400,
  );
  assert.equal(
    (
      await post(url, {
        provider: 'fixture-seismic',
        query: { ...query, radiusKm: 2000 },
      })
    ).status,
    400,
  );
  for (const invalid of [
    { 'unsafe/module': fixture },
    { other: {} },
    { other: { retrieve() {}, acquire: true } },
  ])
    assert.throws(() => createProviderRegistry(invalid));
});
