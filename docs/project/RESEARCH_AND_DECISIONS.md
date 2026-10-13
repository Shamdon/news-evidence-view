# Reader workflow research and decisions

Research date: 2026-10-13. Desk research and simulated challenges inform engineering choices; no reader interviews or human outcomes were measured.

## Benchmarks

| Workflow                                                               | Useful pattern                                                             | Limitation for this task                                                    | Decision                                                                               |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| [Full Fact process](https://fullfact.org/about/how-we-fact-check/)     | Understand wording and assumptions; expose primary sources and uncertainty | Editorial research cannot be replaced by a numerical match                  | Retain original spans, reader correction and explicit unassessed statements            |
| [FactCheck.org process](https://www.factcheck.org/our-process/)        | Source-linked explanations and independent review                          | An editorial article does not itself provide a reusable geographic account  | Add recorded chronology/geography and snapshot persistence, without verdict automation |
| [USGS catalog search](https://earthquake.usgs.gov/earthquakes/search/) | Time/area exploration and original catalog records                         | Catalog exploration alone does not link an article's wording or corrections | Keep the source, proposed interpretation, catalog candidates and dates together        |
| [TimelineJS](https://timeline.knightlab.com/)                          | A non-geographic chronological reading view                                | A timeline's polished narrative can conceal uncertainty                     | Use plain labelled chronology instead of animated reconstructed movement               |

## Scope

First reader task: inspect an earthquake report's stated date, magnitude and geographic context, retain unsupported damage/casualty statements, compare relevant catalog candidates, and revisit exactly what was retrieved. Pasted text and UTF-8 text files cover reports from sources readers can lawfully access. An official USGS event URL offers a genuine bounded acquisition path. Its text is rendered from catalog fields by the adapter, not quoted article prose. It shares provenance with catalog retrieval and must never be described as independent corroboration.

The release intentionally needs reader resolution: place strings/alternatives and coordinates are editable, relative dates stay unknown, and a selected sentence does not magically inherit a date from a different sentence. The architecture does not assume all future reports are earthquakes; earthquake adapters and interpretations are a typed first capability. Audiovisual transcripts, other provider domains and general web acquisition require their own contracts and security/rights assessment.

## Inherited architecture

Inspected `src/app/application.js`, `src/app/catalog.js`, `src/app/constructCatalog.js`, `src/services/application.js`, and `src/layers/earthquakes/{index,source,records}.js`. Existing lifecycle/cancellation and normalized source boundaries are useful design patterns. The full catalog eagerly imports numerous unrelated layers and requires every catalog source; global defaults are also coupled to the inherited console. Its 24-hour earthquake overlay is unsuitable for an article about a historical event.

Decision: leave inherited runtime and exports intact; introduce `news/` as an isolated product entry. The first release needs neither Cesium, camera feeds, radio, provider secrets nor noncommercial cable/Nepal assets. A local SVG view uses only inherited Natural Earth public-domain country geometry, with explicit coordinate lists and source links. This avoids constructing unrelated capabilities or providing fake services to satisfy the full catalog. Future 3D use is a renderer decision, not an evidence-domain decision.

## Evidence and retrieval

[USGS FDSN documentation](https://earthquake.usgs.gov/fdsnws/event/1/) establishes UTC default times, geographic query options and catalog limits. [GeoJSON documentation](https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php) supplies event origin time, record updates, preferred magnitude type, review status and contributing networks. Preserve those separately; publication and sensor-observation time are unknown when absent. Updated time is not publication time.

Retrieve all magnitudes in a user-chosen inclusive 1–7-day date window and optional circle. Do not query only the claimed magnitude. Return chronological candidates capped at 100 with a conservative incomplete flag at the cap. This can miss later events in a busy window: narrow the query before treating context as complete. Measurement differences are conditional comparisons, not contradiction verdicts; date, scale, revisions and identity can differ. Same catalog family is one dependence group. A different article host does not prove source independence.

## Privacy, trust and costs

Default use is one local user. Submitted text stays in browser memory until explicit device save/export. Query dates/coordinates and selected official event IDs reach USGS; report text does not. Local storage is unencrypted and can fail or be cleared. There is no authentication, server-side case storage, telemetry, upload service, model, plugin installation or public deployment. Host/Origin checks protect the loopback API; they do not turn this into an authenticated multi-user service. No arbitrary fetch host, redirects or provider registration can come from case data.

The product uses Node built-ins and static browser assets. No paid provider, model, hosting or subscription was created. Requests have timeout/body/range/count/concurrency/rate limits; provider outages produce visible failures. No fixed delivery-cost projection is asserted. Public USGS availability is not an SLA.

## Rights

MIT LICENSE and DATA_SOURCES.md remain unchanged. Product build includes only relevant static code and public-domain Natural Earth geometry. [Natural Earth terms](https://www.naturalearthdata.com/about/terms-of-use/) and [USGS copyright guidance](https://www.usgs.gov/information-policies-and-instructions/copyrights-and-credits) inform selected-source use; USGS-hosted third-party material can have separate rights. No imagery is used. User-supplied text/export rights remain the user's responsibility. The inherited repository still contains material with noncommercial restrictions; neither repository nor build is represented as a commercially cleared release.
