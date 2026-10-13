import { validateArticleURL } from './article.mjs';
export function createHeadlineDiscovery({
  fetchImpl = globalThis.fetch,
  timeoutMs = 10000,
  now = () => new Date().toISOString(),
} = {}) {
  return Object.freeze({
    async discover(headline, { signal } = {}) {
      if (
        typeof headline !== 'string' ||
        headline.trim().length < 5 ||
        headline.length > 500
      )
        throw new Error('Enter a headline between 5 and 500 characters.');
      const words = headline.match(/[\p{L}\p{N}]{2,40}/gu)?.slice(0, 18) ?? [];
      if (words.length < 2)
        throw new Error('Enter a headline with at least two words.');
      const query = words.join(' ').slice(0, 250);
      const retrievedAt = now();
      const base = {
        provider: 'gdelt',
        candidates: [],
        retrievedAt,
        error: null,
      };
      const url = new URL('https://api.gdeltproject.org/api/v2/doc/doc');
      for (const [k, v] of Object.entries({
        query: `"${query}"`,
        mode: 'artlist',
        format: 'json',
        maxrecords: '10',
        timespan: '3m',
        sort: 'hybridrel',
      }))
        url.searchParams.set(k, v);
      try {
        const response = await fetchImpl(url, {
          redirect: 'error',
          signal: AbortSignal.any([
            AbortSignal.timeout(timeoutMs),
            ...(signal ? [signal] : []),
          ]),
        });
        if (!response.ok || !response.body) throw new Error();
        const reader = response.body.getReader();
        const chunks = [];
        let size = 0;
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            size += value.length;
            if (size > 200000) throw new Error();
            chunks.push(value);
          }
        } catch (e) {
          await reader.cancel().catch(() => {});
          throw e;
        }
        const bytes = new Uint8Array(size);
        let offset = 0;
        for (const chunk of chunks) {
          bytes.set(chunk, offset);
          offset += chunk.length;
        }
        const data = JSON.parse(new TextDecoder().decode(bytes));
        if (!data || !Array.isArray(data.articles) || data.articles.length > 10)
          throw new Error();
        const candidates = [];
        for (const article of data.articles) {
          let target;
          try {
            target = validateArticleURL(article.url);
          } catch {
            continue;
          }
          if (typeof article.title !== 'string' || !article.title.trim())
            continue;
          candidates.push({
            id: `gdelt-${candidates.length + 1}`,
            title: article.title.slice(0, 500),
            url: target.href,
            publisher: target.hostname,
            publishedAt: null,
            retrievedAt,
            sourceFamily: 'gdelt-discovery',
            limitations: [
              'GDELT discovery is an index, not corroborating evidence.',
              'Only recent monitored coverage is searched; headline wording, missing coverage or older reports can yield no matches.',
              'Publication time is unknown; index seen time is not treated as publication time.',
            ],
          });
        }
        const unique = [...new Map(candidates.map((c) => [c.url, c])).values()];
        return {
          ...base,
          status: unique.length ? 'ok' : 'empty',
          candidates: unique,
          explanation: unique.length
            ? 'Possible recent headline matches. Choose the intended article before acquisition; no candidate has been read or verified.'
            : 'No recent indexed match was found. This does not establish that the headline is false or absent. Use the source link or paste the report text.',
        };
      } catch {
        return {
          ...base,
          status: 'error',
          error: 'Headline discovery failed or timed out.',
          explanation:
            'The recent-news index could not be searched. Use a source link or paste the report text; no discovery results are being represented as live.',
        };
      }
    },
  });
}
