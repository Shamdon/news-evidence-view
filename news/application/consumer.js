import {
  createAccount,
  reviseClaim,
  appendEvidence,
  validateAccount,
  assessClaim,
} from '../domain/account.js';
import { interpretWording } from '../interpretation/claims.js';
const immutable = (value) => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(immutable);
    Object.freeze(value);
  }
  return value;
};
export function createConsumerApi(fetchImpl = globalThis.fetch) {
  async function post(path, body, signal) {
    const response = await fetchImpl(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    });
    const result = await response.json();
    if (!response.ok)
      throw new Error(
        result.error ??
          'This request could not be completed. Try pasting the report text.',
      );
    return result;
  }
  return {
    acquire: (url, signal) => post('/api/source', { url }, signal),
    discover: (headline, signal) => post('/api/discover', { headline }, signal),
    investigate: (claim, signal) => post('/api/investigate', { claim }, signal),
  };
}
export function createConsumerStorage(store) {
  const prefix = 'news-evidence-view:account-v2:';
  return {
    save(account) {
      validateAccount(account);
      store.setItem(prefix + account.id, JSON.stringify(account));
    },
    list() {
      const rows = [];
      for (let i = 0; i < store.length; i++) {
        const key = store.key(i);
        if (!key?.startsWith(prefix)) continue;
        try {
          const account = JSON.parse(store.getItem(key));
          validateAccount(account);
          rows.push({
            id: account.id,
            title: account.source.title,
            createdAt: account.createdAt,
          });
        } catch {
          rows.push({
            id: key.slice(prefix.length),
            title: 'Unreadable saved account',
            createdAt: null,
          });
        }
      }
      return rows;
    },
    load(id) {
      const text = store.getItem(prefix + id);
      if (!text)
        throw new Error('That saved account is no longer on this device.');
      const account = JSON.parse(text);
      validateAccount(account);
      return account;
    },
    remove(id) {
      store.removeItem(prefix + id);
    },
  };
}
/** General report workflow. Presentation never chooses subject-specific checker/provider/query parameters. */
export function createConsumer({
  api,
  storage,
  now = () => new Date().toISOString(),
}) {
  let account = null,
    selectedId = null,
    discovery = null,
    pending = null,
    error = null,
    request = null,
    disposed = false;
  const listeners = new Set();
  const getState = () => ({ account, selectedId, discovery, pending, error });
  const emit = () => {
    if (!disposed) for (const fn of listeners) fn(getState());
  };
  const cancel = () => {
    request?.abort();
    request = null;
    pending = null;
  };
  const start = (label) => {
    cancel();
    const own = new AbortController();
    request = own;
    pending = label;
    error = null;
    emit();
    return own;
  };
  const stage = (own, label) => {
    own.signal.throwIfAborted();
    if (request !== own || disposed) throw new Error('Cancelled.');
    pending = label;
    emit();
  };
  const fail = (own, cause) => {
    if (request === own && !disposed && !own.signal.aborted) {
      error = cause.message;
      pending = null;
      request = null;
      emit();
    }
  };
  const finish = (own) => {
    if (request === own) {
      pending = null;
      request = null;
      emit();
    }
  };
  async function examine(input, own) {
    stage(own, 'Finding inspectable claims');
    account = immutable(createAccount(input, now()));
    selectedId = account.claims[0]?.id ?? null;
    discovery = null;
    emit();
    const initial = account.claims.slice(0, 6); // Bounded first exploration; remaining claims remain visibly unassessed until chosen.
    for (let index = 0; index < initial.length; index++) {
      stage(
        own,
        `Looking for relevant sources (${index + 1}/${initial.length})`,
      );
      const claim = initial[index];
      let result;
      try {
        result = await api.investigate(claim, own.signal);
      } catch (cause) {
        own.signal.throwIfAborted();
        result = {
          provider: 'investigation',
          status: 'error',
          query: {},
          retrievedAt: now(),
          records: [],
          error: 'A source request failed. You can retry this statement.',
          explanation: 'Failure to retrieve is not evidence against reporting.',
          truncated: false,
        };
      }
      stage(own, pending);
      account = immutable(appendEvidence(account, claim.id, result, now()));
      emit();
    }
    finish(own);
  }
  return {
    getState,
    subscribe(fn) {
      listeners.add(fn);
      fn(getState());
      return () => listeners.delete(fn);
    },
    async submit({ mode, value, title = '' }) {
      const own = start(
        mode === 'headline'
          ? 'Finding candidate reporting'
          : mode === 'url'
            ? 'Reading the submitted page'
            : 'Reading the submitted text',
      );
      account = null;
      selectedId = null;
      discovery = null;
      emit();
      try {
        if (mode === 'headline') {
          const result = await api.discover(value, own.signal);
          stage(own, 'Candidate reporting found');
          discovery = immutable({ ...result, headline: value });
          finish(own);
          return;
        }
        const input =
          mode === 'url'
            ? await api.acquire(value, own.signal)
            : {
                text: value,
                title: title || 'Submitted report',
                url: null,
                publicationTime: null,
                sourceFamily: null,
                acquisition: {
                  mode: 'text',
                  notes:
                    'Text supplied by the reader. Source identity, access rights and completeness have not been verified.',
                },
              };
        await examine(input, own);
      } catch (cause) {
        fail(own, cause);
        if (!own.signal.aborted) throw cause;
      }
    },
    async chooseCandidate(id) {
      const candidate = discovery?.candidates?.find((item) => item.id === id);
      if (!candidate) throw new Error('Select an available candidate report.');
      return this.submit({ mode: 'url', value: candidate.url });
    },
    select(id) {
      if (!account?.claims.some((c) => c.id === id))
        throw new Error('Unknown statement.');
      selectedId = id;
      emit();
    },
    async investigateSelected() {
      if (!account || !selectedId) throw new Error('Select a statement first.');
      const claim = account.claims.find((c) => c.id === selectedId),
        own = start('Looking for sources for this statement'),
        id = account.id;
      try {
        const result = await api.investigate(claim, own.signal);
        stage(own, pending);
        if (account.id !== id) throw new Error('The account changed.');
        account = immutable(appendEvidence(account, claim.id, result, now()));
        finish(own);
      } catch (cause) {
        fail(own, cause);
        if (!own.signal.aborted) throw cause;
      }
    },
    clarify(words, reason) {
      if (!account || !selectedId) throw new Error('Select a statement first.');
      const claim = account.claims.find((c) => c.id === selectedId);
      const proposal = interpretWording(words).interpretation;
      const patch = {
        ...claim.interpretation,
        notes: claim.interpretation.notes + ` Reader clarification: ${words}`,
      };
      for (const key of ['eventDate', 'year'])
        if (proposal[key] !== null) patch[key] = proposal[key];
      for (const key of ['places', 'measurements'])
        if (proposal[key].length) patch[key] = proposal[key];
      patch.uncertainty = claim.interpretation.uncertainty.filter(
        (text) =>
          !(
            /unresolved|missing|more than one country/i.test(text) &&
            (patch.year || patch.eventDate) &&
            patch.places.length === 1
          ),
      );
      cancel();
      account = immutable(
        reviseClaim(account, selectedId, patch, reason, now()),
      );
      emit();
    },
    save() {
      if (!account) throw new Error('Open a report first.');
      storage.save(account);
      return account.id;
    },
    saved: () => storage.list(),
    load(id) {
      cancel();
      account = immutable(storage.load(id));
      selectedId = account.claims[0]?.id ?? null;
      discovery = null;
      error = null;
      emit();
    },
    remove: (id) => storage.remove(id),
    export() {
      if (!account) throw new Error('Open a report first.');
      return JSON.stringify(account, null, 2);
    },
    importAccount(value) {
      validateAccount(value);
      cancel();
      account = immutable(structuredClone(value));
      selectedId = account.claims[0]?.id ?? null;
      discovery = null;
      error = null;
      emit();
    },
    cancel() {
      cancel();
      emit();
    },
    clear() {
      cancel();
      account = null;
      selectedId = null;
      discovery = null;
      error = null;
      emit();
    },
    dispose() {
      disposed = true;
      cancel();
      account = null;
      listeners.clear();
    },
  };
}
export function consumerView(account, selectedId, index = -1) {
  if (!account) return null;
  const claim = account.claims.find((c) => c.id === selectedId) ?? null;
  const snapshots = account.retrievals.filter((r) => r.claimId === selectedId),
    snapshot = snapshots.at(index) ?? null;
  return {
    claim,
    snapshots,
    snapshot,
    records: (snapshot?.records ?? []).map((record) => ({
      record,
      assessment: assessClaim(claim, record, account.source),
    })),
  };
}
export function geographyForAccount(account, selectedId, index = -1) {
  const view = consumerView(account, selectedId, index);
  return {
    records:
      view?.records.flatMap(({ record }) =>
        record.places
          .filter((p) => p.latitude !== null && p.longitude !== null)
          .map((p) => ({
            id: record.id,
            kind: record.kind === 'observation' ? 'observation' : 'reported',
            title: record.title,
            latitude: p.latitude,
            longitude: p.longitude,
          })),
      ) ?? [],
    countries:
      view?.claim?.interpretation.places
        .map((p) => p.countryCode)
        .filter(Boolean) ?? [],
    queryLabel:
      'Countries are report context; circles locate retrieved records. Neither establishes involvement or an event match.',
  };
}
