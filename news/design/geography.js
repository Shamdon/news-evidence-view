// Public-domain inherited geometry only. Fixture coordinates are not observations.
let pack;
const project = (lon, lat) => [(lon + 180) * 2, (90 - lat) * 2];
function paths(data) {
  return data.features.flatMap((f) =>
    (f.polygons || []).flatMap((p) =>
      p.map((r) => {
        let lon = 0,
          lat = 0,
          previous = null,
          d = '';
        for (let i = 0; i < r.length; i += 2) {
          lon += r[i];
          lat += r[i + 1];
          const point = project(lon / 1000, lat / 1000);
          d +=
            (previous === null || Math.abs(lon - previous) > 180000
              ? 'M'
              : 'L') + point.map((x) => x.toFixed(2)).join(',');
          previous = lon;
        }
        return d + 'Z';
      }),
    ),
  );
}
export async function addContextMap(element, coords, key) {
  try {
    pack ??= fetch('/assets/countries.json')
      .then((r) => {
        if (!r.ok) throw Error('Unavailable');
        return r.json();
      })
      .then(paths);
    const geometry = await pack;
    if (!element.isConnected) return;
    const [x, y] = project(coords[1], coords[0]);
    element.innerHTML = `<svg viewBox="0 0 720 360" role="img" aria-label="World orientation map. Synthetic coordinate shown as an outlined circle, not an observed event."><g fill="var(--raised)" stroke="var(--border)" stroke-width="0.5">${geometry.map((d) => `<path d="${d}"/>`).join('')}</g><circle cx="${x}" cy="${y}" r="7" fill="none" stroke="var(--reported)" stroke-width="3"/></svg>`;
  } catch {
    if (element.isConnected)
      element.textContent =
        'Map background unavailable. Coordinate and textual place context remain available.';
  }
}
