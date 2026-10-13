import { validateCase } from '../domain/case.js';
const prefix = 'news-evidence-view:case:';
/** Browser-only explicit storage. Nothing is sent to a persistence service. */
export function createStorage(store) {
  return {
    save(value) {
      validateCase(value);
      const text = JSON.stringify(value);
      if (text.length > 4_000_000)
        throw new Error(
          'Account exceeds local storage limit. Export it instead.',
        );
      store.setItem(prefix + value.id, text);
    },
    list() {
      const rows = [];
      for (let i = 0; i < store.length; i++) {
        const key = store.key(i);
        if (!key?.startsWith(prefix)) continue;
        try {
          const value = JSON.parse(store.getItem(key));
          validateCase(value);
          rows.push({
            id: value.id,
            title: value.source.title,
            createdAt: value.createdAt,
          });
        } catch {
          rows.push({
            id: key.slice(prefix.length),
            title: 'Unreadable saved account — delete or recover separately',
            createdAt: null,
          });
        }
      }
      return rows;
    },
    load(id) {
      const text = store.getItem(prefix + id);
      if (!text) throw new Error('Saved account is unavailable.');
      const value = JSON.parse(text);
      validateCase(value);
      return value;
    },
    remove(id) {
      store.removeItem(prefix + id);
    },
  };
}
