import https from 'node:https';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { parseHTML } from 'linkedom';
const FALLBACK =
  'This page could not be read safely. Paste the article text instead.';
export function publicAddress(address) {
  if (isIP(address) === 4) {
    const p = address.split('.').map(Number);
    return !(
      p[0] === 0 ||
      p[0] === 10 ||
      p[0] === 127 ||
      p[0] >= 224 ||
      (p[0] === 169 && p[1] === 254) ||
      (p[0] === 172 && p[1] >= 16 && p[1] <= 31) ||
      (p[0] === 192 &&
        (p[1] === 168 ||
          p[1] === 0 ||
          p[1] === 2 ||
          (p[1] === 88 && p[2] === 99))) ||
      (p[0] === 100 && p[1] >= 64 && p[1] <= 127) ||
      (p[0] === 198 &&
        (p[1] === 18 || p[1] === 19 || (p[1] === 51 && p[2] === 100))) ||
      (p[0] === 203 && p[1] === 0 && p[2] === 113)
    );
  }
  if (isIP(address) === 6) {
    const p = address.toLowerCase().split(':');
    const first = parseInt(p[0], 16),
      second = parseInt(p[1] || '0', 16);
    return (
      first >= 0x2000 &&
      first <= 0x3fff &&
      first !== 0x2002 &&
      first !== 0x3ffe &&
      first !== 0x3fff &&
      !(first === 0x2001 && (second <= 0x1ff || second === 0xdb8))
    );
  }
  return false;
}
export function validateArticleURL(input) {
  if (
    typeof input !== 'string' ||
    input.length > 2048 ||
    /[\x00-\x20\\]/.test(input)
  )
    throw new Error(FALLBACK);
  let url;
  try {
    url = new URL(input);
  } catch {
    throw new Error(FALLBACK);
  }
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    url.port ||
    !url.hostname ||
    url.hostname.endsWith('.') ||
    /^(?:localhost|.*\.localhost|.*\.local|.*\.internal)$/i.test(url.hostname)
  )
    throw new Error(FALLBACK);
  const host = url.hostname.replace(/^\[|\]$/g, '');
  if (isIP(host) && !publicAddress(host)) throw new Error(FALLBACK);
  url.hash = '';
  return url;
}
// DNS answers are checked as a set and a validated address is pinned into TLS connection lookup.
export async function pinnedRequest(
  url,
  {
    signal,
    dnsLookup = lookup,
    requestImpl = https.request,
    timeoutMs = 10000,
  } = {},
) {
  const hostname = url.hostname.replace(/^\[|\]$/g, '');
  const answers = isIP(hostname)
    ? [{ address: hostname, family: isIP(hostname) }]
    : await dnsLookup(hostname, { all: true, verbatim: true });
  if (
    !Array.isArray(answers) ||
    !answers.length ||
    answers.some((a) => !publicAddress(a.address))
  )
    throw new Error(FALLBACK);
  const pinned = answers[0];
  return new Promise((resolve, reject) => {
    const req = requestImpl(
      url,
      {
        method: 'GET',
        agent: false,
        signal,
        headers: {
          Accept: 'text/html, application/xhtml+xml',
          'Accept-Encoding': 'identity',
          'User-Agent': 'NewsEvidenceView/0.1',
        },
        lookup(_host, options, callback) {
          callback(
            null,
            options?.all ? [pinned] : pinned.address,
            pinned.family,
          );
        },
      },
      (res) => {
        const chunks = [];
        let count = 0;
        res.on('data', (chunk) => {
          count += chunk.length;
          if (count > 2_000_000) {
            res.destroy(new Error(FALLBACK));
            return;
          }
          chunks.push(chunk);
        });
        res.on('error', reject);
        res.on('end', () =>
          resolve({
            status: res.statusCode,
            headers: res.headers,
            text: Buffer.concat(chunks).toString('utf8'),
          }),
        );
      },
    );
    req.setTimeout(timeoutMs, () => req.destroy(new Error(FALLBACK)));
    req.on('error', reject);
    req.end();
  });
}
function inaccessible(value) {
  if (!value || typeof value !== 'object') return false;
  if (
    value.isAccessibleForFree === false ||
    value.isAccessibleForFree === 'false'
  )
    return true;
  return Object.values(value).some((v) =>
    Array.isArray(v) ? v.some(inaccessible) : inaccessible(v),
  );
}
function publicationTimestamp(value) {
  if (typeof value !== 'string') return null;
  const m = value.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/,
  );
  if (!m) return null;
  const [year, month, day, hour, minute, second] = m
    .slice(1, 7)
    .map((v) => Number(v ?? 0));
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > days ||
    hour > 23 ||
    minute > 59 ||
    second > 59
  )
    return null;
  if (m[7] !== 'Z') {
    const [oh, om] = m[7].slice(1).split(':').map(Number);
    if (oh > 23 || om > 59) return null;
  }
  return Number.isFinite(Date.parse(value))
    ? new Date(value).toISOString()
    : null;
}
export function extractArticle(html, url) {
  const { document } = parseHTML(html);
  for (const script of document.querySelectorAll(
    'script[type="application/ld+json"]',
  )) {
    try {
      if (inaccessible(JSON.parse(script.textContent)))
        throw new Error('restricted');
    } catch (e) {
      if (e.message === 'restricted')
        throw new Error(
          'This page marks its content as restricted. Paste text you can access instead.',
        );
    }
  }
  const allText = document.body?.textContent ?? '';
  if (
    /(?:subscribe|sign in|log in) to (?:continue|read (?:this|the|full)|access)|subscriber[- ]only|subscription required/i.test(
      allText,
    )
  )
    throw new Error(
      'This page appears to require access. Paste text you can access instead.',
    );
  const title = (
    document
      .querySelector('meta[property="og:title"]')
      ?.getAttribute('content') ||
    document.querySelector('h1')?.textContent ||
    document.title ||
    'Submitted article'
  )
    .trim()
    .slice(0, 500);
  const date =
    document
      .querySelector('meta[property="article:published_time"]')
      ?.getAttribute('content') ??
    document
      .querySelector('time[itemprop="datePublished"][datetime]')
      ?.getAttribute('datetime');
  const publicationTime = publicationTimestamp(date);
  for (const node of document.querySelectorAll(
    'script,style,noscript,iframe,nav,header,footer,aside,form,button,[hidden],[aria-hidden="true"]',
  ))
    node.remove();
  const root =
    document.querySelector('article') ??
    document.querySelector('main') ??
    document.body;
  const parts = [...(root?.querySelectorAll('h1,h2,h3,p,li,blockquote') ?? [])]
    .map((node) => node.textContent.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  const text = parts.length
    ? parts.join('\n\n')
    : (root?.textContent?.replace(/\s+/g, ' ').trim() ?? '');
  if (text.length < 80)
    throw new Error(
      'No readable article text was found. Paste the text instead.',
    );
  const hostname = new URL(url).hostname;
  const sourceFamily =
    hostname === 'usgs.gov' || hostname.endsWith('.usgs.gov')
      ? 'usgs-comcat'
      : (hostname === 'worldbank.org' || hostname.endsWith('.worldbank.org')) &&
          /population|SP\.POP\.TOTL/i.test(url + ' ' + title)
        ? 'worldbank-wdi-population'
        : null;
  const truncated = text.length > 60000;
  const temporalNote =
    date && publicationTime === null
      ? ' Publication metadata did not provide a valid timestamp with an explicit timezone; no clock time was inferred.'
      : '';
  return {
    text: text.slice(0, 60000),
    title,
    url,
    publicationTime,
    sourceFamily,
    acquisition: {
      mode: 'article',
      truncated,
      notes: `Public HTML text extracted conservatively. Layout, embedded media and completeness are not verified. ${truncated ? 'Extraction was cut at the 60,000-character limit; inspect the original source for the omitted text.' : 'The original source remains available at the recorded URL.'} The submitted publisher is not independent evidence.${temporalNote}`,
    },
  };
}
export function createArticleAcquirer({
  request = pinnedRequest,
  timeoutMs = 12000,
} = {}) {
  return Object.freeze({
    async acquire(input, { signal } = {}) {
      const combined = AbortSignal.any([
        AbortSignal.timeout(timeoutMs),
        ...(signal ? [signal] : []),
      ]);
      let url = validateArticleURL(input);
      try {
        for (let redirects = 0; redirects <= 3; redirects++) {
          const response = await request(url, { signal: combined });
          if ([301, 302, 303, 307, 308].includes(response.status)) {
            if (redirects === 3 || !response.headers.location)
              throw new Error(FALLBACK);
            url = validateArticleURL(
              new URL(response.headers.location, url).href,
            );
            continue;
          }
          if (response.status !== 200)
            throw new Error(
              'The publisher did not provide a public readable page. Paste article text instead.',
            );
          if (
            !/^(?:text\/html|application\/xhtml\+xml)(?:;|$)/i.test(
              response.headers['content-type'] ?? '',
            ) ||
            response.text.length > 2_000_000
          )
            throw new Error(FALLBACK);
          return extractArticle(response.text, url.href);
        }
        throw new Error(FALLBACK);
      } catch (error) {
        const safe = [
          FALLBACK,
          'This page marks its content as restricted. Paste text you can access instead.',
          'This page appears to require access. Paste text you can access instead.',
          'No readable article text was found. Paste the text instead.',
          'The publisher did not provide a public readable page. Paste article text instead.',
        ];
        throw new Error(
          safe.includes(error.message) ? error.message : FALLBACK,
        );
      }
    },
  });
}
