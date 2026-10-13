import { createUSGSProvider, normalizeFeature } from './usgs.mjs';
import { createWorldBankProvider } from './worldbank.mjs';
const BOUNDS = {
  TR: {
    minlatitude: 35.8,
    maxlatitude: 42.2,
    minlongitude: 25.5,
    maxlongitude: 45,
  },
  SY: {
    minlatitude: 32.3,
    maxlatitude: 37.5,
    minlongitude: 35.5,
    maxlongitude: 42.5,
  },
};
function unsupportedPopulationScope(claim) {
  return claim.interpretation.uncertainty.some((note) =>
    /population changes|flows|unsupported population scope|subnational|species|non-human|city|municipality/i.test(
      note,
    ),
  );
}
function unresolved(explanation) {
  return {
    provider: 'investigation',
    status: 'unresolved',
    query: {},
    retrievedAt: new Date().toISOString(),
    records: [],
    error: null,
    explanation,
    truncated: false,
  };
}
export function validateInvestigationClaim(claim) {
  if (
    !claim ||
    typeof claim !== 'object' ||
    Array.isArray(claim) ||
    typeof claim.category !== 'string' ||
    !/^[a-z][a-z-]{0,39}$/.test(claim.category) ||
    !claim.interpretation ||
    typeof claim.interpretation !== 'object'
  )
    throw new Error('Invalid interpreted claim.');
  const i = claim.interpretation;
  if (
    !Array.isArray(i.places) ||
    i.places.length > 5 ||
    !Array.isArray(i.measurements) ||
    i.measurements.length > 10 ||
    !Array.isArray(i.uncertainty) ||
    i.uncertainty.length > 20 ||
    i.uncertainty.some((note) => typeof note !== 'string' || note.length > 1000)
  )
    throw new Error('Invalid interpreted claim.');
  for (const p of i.places) {
    if (
      !p ||
      typeof p.name !== 'string' ||
      p.name.length > 200 ||
      (p.countryCode != null && !/^[A-Z]{2}$/.test(p.countryCode)) ||
      (p.latitude != null &&
        (!Number.isFinite(p.latitude) || Math.abs(p.latitude) > 90)) ||
      (p.longitude != null &&
        (!Number.isFinite(p.longitude) || Math.abs(p.longitude) > 180)) ||
      (p.latitude == null) !== (p.longitude == null)
    )
      throw new Error('Invalid interpreted claim.');
  }
  for (const m of i.measurements) {
    if (
      !m ||
      typeof m.key !== 'string' ||
      m.key.length > 40 ||
      !Number.isFinite(m.value) ||
      typeof m.unit !== 'string' ||
      m.unit.length > 40 ||
      (m.comparator != null &&
        !['eq', 'gt', 'gte', 'lt', 'lte', 'approx'].includes(m.comparator))
    )
      throw new Error('Invalid interpreted claim.');
  }
  if (
    (i.notes != null &&
      (typeof i.notes !== 'string' || i.notes.length > 2000)) ||
    (i.year != null &&
      (!Number.isInteger(i.year) || i.year < 1 || i.year > 9999)) ||
    (i.eventDate != null &&
      (typeof i.eventDate !== 'string' ||
        !/^\d{4}-\d{2}-\d{2}$/.test(i.eventDate) ||
        !Number.isFinite(Date.parse(i.eventDate)) ||
        new Date(i.eventDate).toISOString().slice(0, 10) !== i.eventDate))
  )
    throw new Error('Invalid interpreted claim.');
  return claim;
}
function seismicRecord(r, countryCode) {
  return {
    id: r.id,
    kind: 'observation',
    provider: 'usgs',
    sourceFamily: r.sourceFamily,
    title: r.title,
    url: r.url,
    retrievedAt: r.retrievedAt,
    publicationTime: null,
    observationTime: null,
    eventTime: r.eventTime,
    period: { kind: 'instant', value: r.eventTime },
    places: [
      {
        name: r.title,
        countryCode: countryCode ?? null,
        latitude: r.latitude,
        longitude: r.longitude,
      },
    ],
    measurements: [
      ...(r.magnitude === null
        ? []
        : [
            {
              key: 'magnitude',
              value: r.magnitude,
              unit: 'magnitude',
              methodology: `USGS preferred catalog magnitude; scale ${r.magnitudeType ?? 'unknown'}, review ${r.reviewStatus}, network ${r.network ?? 'unknown'}, catalog updated ${r.updatedAt ?? 'unknown'}. Different magnitude scales may not be directly comparable.`,
            },
          ]),
      ...(r.depthKm === null
        ? []
        : [
            {
              key: 'depth',
              value: r.depthKm,
              unit: 'km',
              methodology: 'USGS preferred hypocenter depth.',
            },
          ]),
    ],
    limitations: [
      r.limitations,
      'Catalog event time is origin time, not a sensor observation or article publication time.',
    ],
  };
}
function createBuiltInInvestigator({
  usgs = createUSGSProvider(),
  worldbank = createWorldBankProvider(),
  fetchImpl = globalThis.fetch,
} = {}) {
  return Object.freeze({
    async investigate(input, { signal } = {}) {
      const claim = validateInvestigationClaim(input),
        i = claim.interpretation;
      if (claim.category === 'population') {
        if (unsupportedPopulationScope(claim))
          return unresolved(
            'This statement concerns population change, a flow, or another population scope. Annual country totals cannot assess it; clarify the quantity and scope.',
          );
        const countries = [
          ...new Set(i.places.map((p) => p.countryCode).filter(Boolean)),
        ];
        if (countries.length !== 1)
          return unresolved(
            'Which single country does this population quantity describe? Places in the report remain context, not an assigned measurement.',
          );
        if (!i.year)
          return unresolved(
            'Which year does this population quantity describe?',
          );
        if (i.year < 1960 || i.year > new Date().getUTCFullYear())
          return unresolved(
            'This year is outside the supported World Bank historical series. The reported quantity remains unassessed; no current total will be substituted.',
          );
        if (
          !i.measurements.some(
            (m) => m.key === 'population' && m.unit === 'people',
          )
        )
          return unresolved(
            'What total human population quantity does this claim report? Changes and flows require a different evidence capability.',
          );
        return worldbank.retrieve(
          { countryCode: countries[0], year: i.year },
          { signal },
        );
      }
      if (claim.category === 'seismic' || claim.category === 'earthquake') {
        if (
          new Set(i.places.map((p) => p.countryCode).filter(Boolean)).size >
            1 ||
          i.places.filter((p) => p.latitude != null).length > 1
        )
          return unresolved(
            'Which country or recorded location belongs to this particular event? Multiple report places remain context until their association is clarified.',
          );
        if (!i.eventDate)
          return unresolved('On which date did the reported earthquake occur?');
        const point = i.places.find((p) => p.latitude != null),
          country = i.places.find((p) => BOUNDS[p.countryCode]);
        if (!point && !country)
          return unresolved(
            'Which country or recorded location does the earthquake claim refer to? Supported country-wide searches currently cover Turkey and Syria.',
          );
        if (point) {
          const query = {
            startDate: i.eventDate,
            endDate: i.eventDate,
            latitude: point.latitude,
            longitude: point.longitude,
            radiusKm: 300,
          };
          const result = await usgs.retrieve(query, { signal });
          const { evidence, ...base } = result;
          return {
            ...base,
            records: evidence.map((r) => seismicRecord(r, null)),
            explanation:
              'USGS catalog events near the interpreted location and date. Geographic overlap alone does not establish that an event is the reported one.',
          };
        }
        const query = {
            startDate: i.eventDate,
            endDate: i.eventDate,
            countryCode: country.countryCode,
            bounds: BOUNDS[country.countryCode],
          },
          retrievedAt = new Date().toISOString();
        try {
          const url = new URL(
            'https://earthquake.usgs.gov/fdsnws/event/1/query',
          );
          for (const [k, v] of Object.entries({
            format: 'geojson',
            starttime: `${i.eventDate}T00:00:00Z`,
            endtime: `${i.eventDate}T23:59:59.999Z`,
            limit: 100,
            orderby: 'time-asc',
            ...query.bounds,
          }))
            url.searchParams.set(k, v);
          const response = await fetchImpl(url, {
            redirect: 'error',
            signal: AbortSignal.any([
              AbortSignal.timeout(10000),
              ...(signal ? [signal] : []),
            ]),
          });
          if (!response.ok) throw new Error();
          let data;
          if (response.status === 204)
            data = { type: 'FeatureCollection', features: [] };
          else {
            if (!response.body) throw new Error();
            const reader = response.body.getReader();
            let size = 0;
            const chunks = [];
            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                size += value.length;
                if (size > 2_000_000) throw new Error();
                chunks.push(value);
              }
            } catch (e) {
              await reader.cancel().catch(() => {});
              throw e;
            }
            const bytes = new Uint8Array(size);
            let offset = 0;
            for (const c of chunks) {
              bytes.set(c, offset);
              offset += c.length;
            }
            data = JSON.parse(new TextDecoder().decode(bytes));
          }
          if (
            data?.type !== 'FeatureCollection' ||
            !Array.isArray(data.features) ||
            data.features.length > 100
          )
            throw new Error();
          const records = [
            ...new Map(
              data.features.map((f) => {
                const r = seismicRecord(normalizeFeature(f, retrievedAt), null);
                return [r.id, r];
              }),
            ).values(),
          ];
          return {
            provider: 'usgs',
            status: records.length ? 'ok' : 'empty',
            query,
            retrievedAt,
            records,
            error: null,
            truncated: data.features.length >= 100,
            explanation:
              'Broad country bounding-box search includes border and offshore areas. Results are candidate events, not proof of the reported event; the 100-record cap may omit relevant events.',
          };
        } catch {
          return {
            provider: 'usgs',
            status: 'error',
            query,
            retrievedAt,
            records: [],
            error: 'USGS retrieval failed or timed out.',
            truncated: false,
            explanation:
              'Retrieval failure gives no evidence against the claim.',
          };
        }
      }
      return unresolved(
        'This claim does not yet have a supported evidence route. Earthquake and annual country population checks are available; other claims remain unresolved.',
      );
    },
  });
}

// Capability objects are trusted composition. Claims supply data, never adapter code or hosts.
export function createInvestigator({ capabilities, ...options } = {}) {
  const builtin = createBuiltInInvestigator(options);
  const registry = capabilities ?? [
    {
      id: 'earthquake-catalog',
      supports: (claim) =>
        ['seismic', 'earthquake'].includes(claim.category) ||
        claim.interpretation.measurements.some((m) => m.key === 'magnitude'),
      retrieve: (claim, context) =>
        builtin.investigate({ ...claim, category: 'seismic' }, context),
    },
    {
      id: 'annual-population',
      supports: (claim) =>
        (claim.category === 'population' ||
          claim.interpretation.measurements.some(
            (m) => m.key === 'population',
          )) &&
        !unsupportedPopulationScope(claim),
      retrieve: (claim, context) =>
        builtin.investigate({ ...claim, category: 'population' }, context),
    },
  ];
  if (
    !Array.isArray(registry) ||
    registry.length > 20 ||
    registry.some(
      (c) =>
        !c ||
        !/^[a-z][a-z0-9-]{0,47}$/.test(c.id) ||
        typeof c.supports !== 'function' ||
        typeof c.retrieve !== 'function',
    )
  )
    throw new Error('Invalid trusted investigation capabilities.');
  return Object.freeze({
    async investigate(input, context = {}) {
      const claim = validateInvestigationClaim(input);
      const capability = registry.find((c) => c.supports(claim));
      if (
        !capability &&
        claim.category === 'population' &&
        unsupportedPopulationScope(claim)
      )
        return unresolved(
          'This statement concerns population change, a flow, or another population scope. Annual country totals cannot assess it; clarify the quantity and scope.',
        );
      if (!capability)
        return unresolved(
          'This claim remains unassessed: no registered evidence capability covers its subject and context. Source wording and interpreted places, dates and quantities remain available for inspection; no truth verdict follows.',
        );
      return capability.retrieve(claim, context);
    },
  });
}
