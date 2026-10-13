# General investigation boundaries and working extension demonstrations

The primary `news/reader` entry uses a provider-neutral version-2 account. `/technical` preserves the prior seismic desk; its contract does not define the new shared architecture. Trusted composition selects executable capabilities; reporting, imported JSON and future model outputs cannot register code, hosts or services.

| Area | Responsibility |
| --- | --- |
| `domain/account.js` | Immutable source spans, claim interpretation/revisions, generic typed evidence, snapshots, validation and conditional relationships. No UI, storage, provider or renderer. |
| `interpretation/claims.js`, `resolution/` | Conservative factual proposals and bounded place/time/quantity context; explicit uncertainty. Pure data operations, no acquisition. |
| `application/consumer.js` | Common submission → interpretation → investigation → immutable account flow, cancellation, discovery selection and explicit local persistence. |
| `providers/` | Safe article acquisition, headline discovery and registered claim-driven retrieval. Source-specific constraints stay here. |
| `reader/` | Semantic consumer interaction and themes; no provider imports or subject selection. |
| `geography/` | Recorded-coordinate/country orientation, equivalent text, resource lifecycle; no evidence acquisition. |
| `server/` | Loopback API/static boundary, Host/Origin controls, quotas, cancellation; no saved accounts. |

`npm run check:news` checks syntax and literal dependency directions, including adversarial forbidden/computed import tests. It is trusted-source lint, not a sandbox for arbitrary plugins. Inherited package exports remain unchanged.

## Evidence and acquisition extensions actually exercised

`createInvestigator({capabilities})` accepts trusted `{id, supports(claim), retrieve(claim, context)}` capabilities. The built-in registry selects USGS catalog or annual World Bank population from claim context. No capability applies: `unresolved`, not false. The shared record supports kind, source family, provenance URL, separate temporal fields, period, places, typed measurements/methodology and limitations without earthquake fields.

Working third-category demonstration: `consumer-application.test.mjs` injects `fixture-policy`, retrieves a full documentary `source-assertion` with no earthquake/population measurements, appends it through the unchanged consumer application/domain, then validates save/reopen. Service tests replace the capability registry and exercise unrecognized subjects. This is a labelled deterministic fixture, not a live documentary source. Real public article → evidence → persisted JSON validation is separately exercised for population and earthquakes by `consumer-live.mjs`.

Article/discovery/investigation are injected through `createConsumer({api,...})`; tests substitute acquisition/discovery without UI/domain edits and prove explicit candidate choice, provider failures, late-response cancellation and unchanged snapshots. Source-specific temporal/coverage rules belong in adapters. New media acquisition must preserve genuine timecodes and permissions; existing unsupported fallback cannot be relabelled support.

## Presentation and geographic replacements actually exercised

`presentation/themes.js` supplies validated theme identity; `reader/style.css` implements shared semantic tokens for Reading room and Night desk. The same acquired account remains unchanged in both browser-tested appearances. Themes never select providers/capabilities.

Default geographic map, `/?geography=coordinates`, and `/?geography=off` use trusted finite composition. Off performs no geographic module construction/import. The coordinate layer needs no boundary fetch; the map owns abort/disposal and suppresses late resource updates. Existing application tests exercise real lifecycle/substitution and immutable subscriber state. Consumer browser review exercised saved population accounts with geography off and coordinates. Country outlines are context; only recorded evidence coordinates create event markers. Geography is optional for nonspatial claims.

The consumer interface combines a short intake/summary with exact claim/evidence detail and optional chronology. Four alternative fixture journeys remain on the design branch for comparative review; fixtures never enter live orchestration.

## Limits

Current interpretation is conservative English/limited Swedish, not universal semantics. Default retrieval has two actual source families and narrow claim/coverage support; the generic documentary capability is a fixture. Headline live discovery times out externally. Local media feeds, arbitrary historical documents and audiovisual retrieval are not yet configured. No executable-plugin isolation, commercial clearance or human benefit is claimed.
