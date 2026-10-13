import { project, worldPaths, mapRecords } from './project.js';
const NS = 'http://www.w3.org/2000/svg';
const svgElement = (tag, attrs) => {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  return e;
};
/** Rendering-only extension. Acquisition is an injected service with abort ownership. */
export const mapLayer = {
  id: 'evidence-map',
  requires: ['mapHost', 'boundaries', 'onSelectEvidence'],
  create({ mapHost, boundaries, onSelectEvidence }) {
    const controller = new AbortController();
    let disposed = false,
      enabled = false,
      latest = null,
      countryPaths = [],
      focus = false,
      boundaryRequest = null;
    const svg = svgElement('svg', {
      viewBox: '0 0 720 360',
      role: 'img',
      'aria-label':
        'Reported place and retrieved catalog locations. Use the evidence list for full details.',
    });
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.textContent = 'Focus on records';
    const label = document.createElement('p');
    label.className = 'map-caption';
    label.textContent =
      'Dashed marker: reader-resolved report · solid circles: catalog records. Positions do not establish identity or causation.';
    const listener = () => {
      focus = !focus;
      toggle.textContent = focus ? 'Show world' : 'Focus on records';
      draw();
    };
    toggle.addEventListener('click', listener);
    const selectMarker = (event) => {
      const id = event.target.getAttribute('data-record-id');
      if (id) onSelectEvidence(id);
    };
    svg.addEventListener('click', selectMarker);
    mapHost.replaceChildren(svg, toggle, label);
    function draw() {
      if (!enabled || disposed) return;
      svg.replaceChildren();
      const records = latest?.records ?? mapRecords(latest ?? {}),
        highlighted = records.find((r) => r.id === latest?.highlightId);
      const points = (highlighted ? [highlighted] : records).map((r) =>
        project(r.longitude, r.latitude),
      );
      if ((focus || highlighted) && points.length) {
        const xs = points.map((p) => p[0]),
          ys = points.map((p) => p[1]);
        const width = Math.min(
          720,
          Math.max(24, Math.max(...xs) - Math.min(...xs) + 12),
        );
        const height = Math.min(
          360,
          Math.max(width / 2, Math.max(...ys) - Math.min(...ys) + 12),
        );
        svg.setAttribute(
          'viewBox',
          `${Math.max(0, Math.min(720 - width, (Math.min(...xs) + Math.max(...xs) - width) / 2))} ${Math.max(0, Math.min(360 - height, (Math.min(...ys) + Math.max(...ys) - height) / 2))} ${width} ${height}`,
        );
      } else svg.setAttribute('viewBox', '0 0 720 360');
      for (let lon = -180; lon <= 180; lon += 30)
        svg.append(
          svgElement('path', {
            d: `M${project(lon, 90)[0]},0 V360`,
            class: 'graticule',
          }),
        );
      for (let lat = -60; lat <= 60; lat += 30)
        svg.append(
          svgElement('path', {
            d: `M0,${project(0, lat)[1]} H720`,
            class: 'graticule',
          }),
        );
      for (const p of countryPaths) {
        const path = svgElement('path', {
          d: p.d,
          class: latest?.countries?.includes(p.countryCode)
            ? 'land country-context'
            : 'land',
        });
        const title = svgElement('title', {});
        title.textContent = p.name;
        path.append(title);
        svg.append(path);
      }
      const zoomWidth = Number(svg.getAttribute('viewBox').split(' ')[2]);
      for (const record of [...records].sort(
        (a, b) =>
          Number(a.id === latest?.highlightId) -
          Number(b.id === latest?.highlightId),
      )) {
        const [cx, cy] = project(record.longitude, record.latitude);
        const dot = svgElement('circle', {
          cx,
          cy,
          r: Math.max(0.25, zoomWidth / 150),
          class: `marker ${record.kind}${record.id === latest?.highlightId ? ' highlighted' : ''}`,
          'vector-effect': 'non-scaling-stroke',
        });
        const title = svgElement('title', {});
        title.textContent = `${record.kind === 'reported' ? 'Reported place' : 'Catalog record'}: ${record.title}`;
        dot.append(title);
        if (record.kind === 'observation')
          dot.setAttribute('data-record-id', record.id);
        svg.append(dot);
      }
      if (highlighted) {
        const view = svg.getAttribute('viewBox').split(' ').map(Number);
        const caption = svgElement('text', {
          x: view[0] + view[2] * 0.03,
          y: view[1] + view[3] * 0.12,
          class: 'map-selection',
          'font-size': view[2] / 40,
        });
        caption.textContent = `Selected: ${highlighted.latitude.toFixed(3)}°, ${highlighted.longitude.toFixed(3)}°`;
        svg.append(caption);
      }
      const retrieval = latest?.current?.retrievals
        .filter((r) => r.claimId === latest?.selected)
        .at(-1);
      label.textContent =
        'Dashed marker: reader-resolved report · solid circles: catalog records. Positions do not establish identity or causation.' +
        (retrieval
          ? ` Search: ${retrieval.query.latitude === null ? 'global' : `${retrieval.query.latitude}°, ${retrieval.query.longitude}°; radius ${retrieval.query.radiusKm} km`}.`
          : '');
      if (latest?.queryLabel) label.textContent = latest.queryLabel;
      if (!records.length && !latest?.countries?.length) {
        const hint = svgElement('text', {
          x: 360,
          y: 180,
          'text-anchor': 'middle',
          class: 'map-hint',
        });
        hint.textContent = 'No resolved place yet — use the document view';
        svg.append(hint);
      }
    }
    function loadBoundaries() {
      if (countryPaths.length || boundaryRequest || disposed) return;
      const own = new AbortController();
      boundaryRequest = own;
      boundaries({ signal: own.signal })
        .then((data) => {
          if (!disposed && !own.signal.aborted) {
            countryPaths = worldPaths(data);
            draw();
          }
        })
        .catch(() => {
          if (!disposed && !own.signal.aborted)
            label.textContent +=
              ' Boundaries unavailable; coordinate grid and list remain usable.';
        })
        .finally(() => {
          if (boundaryRequest === own) boundaryRequest = null;
        });
    }
    return {
      enable() {
        if (disposed) return;
        enabled = true;
        mapHost.hidden = false;
        loadBoundaries();
        draw();
      },
      disable() {
        enabled = false;
        boundaryRequest?.abort();
        boundaryRequest = null;
        mapHost.hidden = true;
      },
      update(model) {
        latest = model;
        draw();
      },
      dispose() {
        if (disposed) return;
        disposed = true;
        enabled = false;
        controller.abort();
        boundaryRequest?.abort();
        boundaryRequest = null;
        svg.removeEventListener('click', selectMarker);
        toggle.removeEventListener('click', listener);
        mapHost.replaceChildren();
      },
    };
  },
};
