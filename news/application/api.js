/** A browser transport; adapters and allowed acquisition hosts remain server-owned. */
export function createApi(fetchImpl = fetch) {
  async function post(path, body, { signal } = {}) {
    const response = await fetchImpl(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal, cache: 'no-store' });
    const value = await response.json();
    if (!response.ok) throw new Error(value.error || 'The local service could not complete this request.');
    return value;
  }
  return { acquire: (url, options) => post('/api/acquire', { url }, options), retrieve: (body, options) => post('/api/retrieve', body, options) };
}
