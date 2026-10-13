export const project = (longitude, latitude) => [
  (longitude + 180) * 2,
  (90 - latitude) * 2,
];
export function decodeRing(encoded) {
  let x = 0,
    y = 0;
  const points = [];
  for (let i = 0; i < encoded.length; i += 2) {
    x += encoded[i];
    y += encoded[i + 1];
    points.push([x / 1000, y / 1000]);
  }
  return points;
}
export function worldPaths(data) {
  const paths = [];
  for (const feature of data.features ?? [])
    for (const polygon of feature.polygons ?? []) {
      for (const ring of polygon) {
        const points = decodeRing(ring);
        let d = '';
        for (let i = 0; i < points.length; i++) {
          const [x, y] = project(...points[i]);
          d +=
            (i === 0 || Math.abs(points[i][0] - points[i - 1][0]) > 180
              ? 'M'
              : 'L') +
            x.toFixed(2) +
            ',' +
            y.toFixed(2);
        }
        paths.push({
          name: feature.name,
          countryCode: feature.iso2,
          d: d + 'Z',
        });
      }
    }
  return paths;
}
export function mapRecords({ current, selected }) {
  if (!current) return [];
  const claim = current.claims.find((c) => c.id === selected);
  const records = [];
  if (
    Number.isFinite(claim?.interpretation.latitude) &&
    Number.isFinite(claim?.interpretation.longitude)
  )
    records.push({
      kind: 'reported',
      id: claim.id,
      title: 'Reader-resolved reported place',
      latitude: claim.interpretation.latitude,
      longitude: claim.interpretation.longitude,
    });
  const retrieval = current.retrievals
    .filter((r) => r.claimId === selected)
    .at(-1);
  for (const e of retrieval?.evidence ?? [])
    records.push({ kind: 'observation', ...e });
  return records;
}
