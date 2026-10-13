import { mapRecords } from './project.js';
/** Materially different geographic extension: text coordinates, no boundary fetch. */
export const coordinateLayer = {
  id: 'coordinate-list',
  requires: ['mapHost'],
  create({ mapHost }) {
    let enabled = false,
      disposed = false;
    return {
      enable() {
        if (!disposed) {
          enabled = true;
          mapHost.hidden = false;
        }
      },
      disable() {
        enabled = false;
        mapHost.hidden = true;
      },
      update(model) {
        if (!enabled || disposed) return;
        const heading = document.createElement('h3');
        heading.textContent = 'Geographic coordinates';
        const list = document.createElement('ul');
        for (const r of model.records ?? mapRecords(model)) {
          const item = document.createElement('li');
          item.textContent = `${r.kind === 'reported' ? 'Reported place' : 'Catalog record'}: ${r.title} — ${r.latitude}, ${r.longitude}`;
          list.append(item);
        }
        mapHost.replaceChildren(heading, list);
      },
      dispose() {
        disposed = true;
        enabled = false;
        mapHost.replaceChildren();
      },
    };
  },
};
