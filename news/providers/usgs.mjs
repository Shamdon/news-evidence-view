const ENDPOINT = 'https://earthquake.usgs.gov/fdsnws/event/1/query';
const MAX_BYTES = 2_000_000;
export function validateQuery(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid query.');
  const { startDate, endDate, latitude = null, longitude = null, radiusKm = 300 } = value;
  const day = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && Number.isFinite(Date.parse(s)) && new Date(s).toISOString().slice(0,10) === s;
  if (!day(startDate) || !day(endDate)) throw new Error('Use valid YYYY-MM-DD dates.');
  const interval = Date.parse(endDate) - Date.parse(startDate);
  if (interval < 0 || interval > 6 * 86400000) throw new Error('Select one to seven calendar days.');
  if ((latitude === null) !== (longitude === null) || (latitude !== null && (!Number.isFinite(latitude) || Math.abs(latitude) > 90 || !Number.isFinite(longitude) || Math.abs(longitude) > 180))) throw new Error('Coordinates must be a valid latitude/longitude pair.');
  if (!Number.isFinite(radiusKm) || radiusKm <= 0 || radiusKm > 1000) throw new Error('Radius must be greater than zero and at most 1000 km.');
  return { startDate, endDate, latitude, longitude, radiusKm };
}
export function validateReportURL(input) {
  if (typeof input !== 'string' || input.length > 2048 || !/^https:\/\/earthquake\.usgs\.gov\//.test(input) || /(?:^|\/)(?:\.|\.\.)(?:\/|$)/.test(input) || input.includes('%') || input.includes('\\')) throw new Error('Unsupported URL. Use a USGS earthquake event page or paste report text.');
  let url; try { url = new URL(input); } catch { throw new Error('Unsupported URL. Use a USGS earthquake event page or paste report text.'); }
  const match = /^\/earthquakes\/eventpage\/([a-zA-Z0-9_-]{1,80})(?:\/(?:executive|origin|magnitude|map|region-info|technical|impact|products))?\/?$/.exec(url.pathname);
  if (url.protocol !== 'https:' || url.hostname !== 'earthquake.usgs.gov' || url.port || url.username || url.password || url.search || url.hash || !match) throw new Error('Unsupported URL. Use a USGS earthquake event page or paste report text.');
  return { id: match[1], url: `https://earthquake.usgs.gov/earthquakes/eventpage/${match[1]}` };
}
async function readJSON(response) {
  if (!response.ok) throw new Error('Provider unavailable.');
  if (response.status === 204) return { type: 'FeatureCollection', features: [] };
  if (!response.body) throw new Error('Invalid provider response.');
  const reader = response.body.getReader(); let count = 0; const chunks = [];
  try { while (true) { const {done,value} = await reader.read(); if (done) break; count += value.byteLength; if(count > MAX_BYTES) throw new Error('Provider response too large.'); chunks.push(value); } }
  catch(error) { await reader.cancel().catch(() => {}); throw error; }
  const data = new Uint8Array(count); let offset = 0; for(const chunk of chunks) { data.set(chunk,offset); offset += chunk.length; }
  return JSON.parse(new TextDecoder().decode(data));
}
function iso(value) { return Number.isFinite(value) && Math.abs(value) < 8.64e15 ? new Date(value).toISOString() : null; }
function boundedText(value, fallback) { return typeof value === 'string' ? value.slice(0,500) : fallback; }
export function normalizeFeature(feature, retrievedAt) {
  const p = feature?.properties, c = feature?.geometry?.coordinates;
  if (feature?.type !== 'Feature' || typeof feature.id !== 'string' || !/^[a-zA-Z0-9_-]{1,80}$/.test(feature.id) || !p || !Array.isArray(c) || !Number.isFinite(c[0]) || Math.abs(c[0])>180 || !Number.isFinite(c[1]) || Math.abs(c[1])>90 || !iso(p.time)) throw new Error('Invalid provider response.');
  return { id: `usgs:${feature.id}`, provider: 'usgs', sourceFamily: 'usgs-comcat', title: boundedText(p.title,'USGS catalog event'), url: `https://earthquake.usgs.gov/earthquakes/eventpage/${feature.id}`, eventTime: iso(p.time), observationTime: null, publicationTime: null, updatedAt: iso(p.updated), retrievedAt, latitude:c[1], longitude:c[0], depthKm:Number.isFinite(c[2])?c[2]:null, magnitude:Number.isFinite(p.mag)?p.mag:null, magnitudeType:boundedText(p.magType,null), reviewStatus:boundedText(p.status,'unknown'), network:boundedText(p.net,null), catalogSources:boundedText(p.sources,null), limitations:'USGS ComCat is one source family. Catalog entries may be revised and coverage is incomplete; no result does not disprove a claim. Event time is not publication time. Multiple entries are not independent corroboration.' };
}
export function createUSGSProvider({ fetchImpl = globalThis.fetch, timeoutMs = 10000, now = () => new Date().toISOString() } = {}) {
  const fetchJSON = async (url, signal) => readJSON(await fetchImpl(url,{redirect:'error',signal:AbortSignal.any([AbortSignal.timeout(timeoutMs), ...(signal?[signal]:[])])}));
  return Object.freeze({
    async retrieve(input,{signal}={}) {
      const query = validateQuery(input), retrievedAt = now();
      try {
        const url = new URL(ENDPOINT); url.searchParams.set('format','geojson'); url.searchParams.set('starttime',`${query.startDate}T00:00:00Z`); url.searchParams.set('endtime',`${query.endDate}T23:59:59.999Z`); url.searchParams.set('limit','100'); url.searchParams.set('orderby','time-asc');
        if(query.latitude !== null) { url.searchParams.set('latitude',query.latitude); url.searchParams.set('longitude',query.longitude); url.searchParams.set('maxradiuskm',query.radiusKm); }
        const data = await fetchJSON(url,signal);
        if(data?.type !== 'FeatureCollection' || !Array.isArray(data.features) || data.features.length>100) throw new Error('Invalid provider response.');
        const evidence = [...new Map(data.features.map(f => {const record=normalizeFeature(f,retrievedAt); return [record.id,record];})).values()];
        return {provider:'usgs',status:evidence.length?'ok':'empty',query,retrievedAt,evidence,error:null,truncated:data.features.length>=100};
      } catch { return {provider:'usgs',status:'error',query,retrievedAt,evidence:[],error:'USGS retrieval failed or timed out. Try again later; this is not evidence against a claim.',truncated:false}; }
    },
    async acquire(input,{signal}={}) {
      const target=validateReportURL(input); const url=new URL(ENDPOINT); url.searchParams.set('format','geojson'); url.searchParams.set('eventid',target.id);
      try {
        const data=await fetchJSON(url,signal), event=normalizeFeature(data,now());
        return { title:event.title,url:target.url,publicationTime:null,text:`Official USGS catalog report: ${event.title}. Event time: ${event.eventTime}. Location: ${event.latitude}, ${event.longitude}. Depth: ${event.depthKm ?? 'unknown'} km. Magnitude: ${event.magnitude ?? 'unknown'} ${event.magnitudeType ?? ''}. Review status: ${event.reviewStatus}. Catalog updated time: ${event.updatedAt ?? 'unavailable'}. This report comes from the USGS ComCat catalog, the same source family used by the USGS evidence adapter; it is not independent corroboration. Publication time is unavailable.` };
      } catch { throw new Error('USGS report acquisition failed or timed out. Paste report text instead.'); }
    }
  });
}
