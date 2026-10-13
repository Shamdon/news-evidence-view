import {
  createCase,
  correctClaim,
  addRetrieval,
  validateCase,
  compareClaim,
} from '../domain/case.js';

// Subscribers and rendering extensions receive immutable records, not a mutation channel.
function immutable(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) immutable(child);
    Object.freeze(value);
  }
  return value;
}

/** Application owns private snapshots and commands, never appearance or acquisition protocol. */
export function createController({
  api,
  storage,
  now = () => new Date().toISOString(),
}) {
  let current = null,
    selected = null,
    pending = false,
    disposed = false,
    request = null;
  const listeners = new Set();
  const snapshot = () => ({ current, selected, pending });
  const emit = () => {
    if (!disposed) for (const fn of listeners) fn(snapshot());
  };
  const requireCase = () => {
    if (!current) throw new Error('Submit a report first.');
  };
  const cancel = () => {
    request?.abort();
    request = null;
    pending = false;
  };
  async function operation(task) {
    if (disposed) throw new Error('Account closed.');
    cancel();
    const own = new AbortController();
    request = own;
    pending = true;
    emit();
    try {
      const result = await task(own.signal);
      own.signal.throwIfAborted();
      if (request !== own || disposed) throw new Error('Operation cancelled.');
      return result;
    } finally {
      if (request === own) {
        pending = false;
        request = null;
        emit();
      }
    }
  }
  return {
    getState: snapshot,
    subscribe(fn) {
      listeners.add(fn);
      fn(snapshot());
      return () => listeners.delete(fn);
    },
    submit(input) {
      cancel();
      current = immutable(createCase(input, now()));
      selected = current.claims[0]?.id ?? null;
      emit();
    },
    async acquire(url) {
      const input = await operation((signal) => api.acquire(url, { signal }));
      this.submit(input);
    },
    select(id) {
      requireCase();
      if (!current.claims.some((c) => c.id === id))
        throw new Error('Unknown claim.');
      selected = id;
      emit();
    },
    correct(patch, reason) {
      requireCase();
      cancel();
      current = immutable(
        correctClaim(current, selected, patch, reason, now()),
      );
      emit();
    },
    async retrieve(query) {
      requireCase();
      const claimId = selected,
        caseId = current.id;
      const result = await operation((signal) =>
        api.retrieve({ provider: 'usgs', query }, { signal }),
      );
      if (current.id !== caseId || selected !== claimId)
        throw new Error('Report changed during retrieval. Try again.');
      current = immutable(addRetrieval(current, claimId, result, now()));
      emit();
    },
    save() {
      requireCase();
      storage.save(current);
      return current.id;
    },
    saved() {
      return storage.list();
    },
    load(id) {
      cancel();
      const value = storage.load(id);
      validateCase(value);
      current = immutable(value);
      selected = current.claims[0]?.id ?? null;
      emit();
    },
    remove(id) {
      storage.remove(id);
    },
    importCase(value) {
      cancel();
      validateCase(value);
      current = immutable(structuredClone(value));
      selected = current.claims[0]?.id ?? null;
      emit();
    },
    export() {
      requireCase();
      return JSON.stringify(current, null, 2);
    },
    clear() {
      cancel();
      current = null;
      selected = null;
      emit();
    },
    suspend() {
      cancel();
      emit();
    },
    dispose() {
      disposed = true;
      cancel();
      listeners.clear();
      current = null;
    },
  };
}

/** A presentation model exposes domain assessments without putting their rules in UI. */
export function inspectSnapshot(current, selected, retrievalIndex = -1) {
  if (!current) return { claim: null, retrieval: null, comparisons: [] };
  const claim = current.claims.find((c) => c.id === selected) ?? null;
  const snapshots = current.retrievals.filter((r) => r.claimId === selected);
  const retrieval = snapshots.at(retrievalIndex) ?? null;
  return {
    claim,
    retrieval,
    snapshots,
    comparisons: (retrieval?.evidence ?? []).map((evidence) => ({
      evidence,
      assessment: compareClaim(claim, evidence, current.source.url),
    })),
  };
}
