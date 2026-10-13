# Extension boundaries and working demonstrations

The `news/` entry is a local product, separate from inherited console modules. Trusted application source code selects extensions. Saved reporting, imported JSON and future model output cannot register providers, name executable modules or expand service access.

## Actual boundaries

| Area                  | Owns                                                                                        | May depend on                                                                         |
| --------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `news/domain/case.js` | Claims/spans, revisions, provenance validation, conditional comparisons and snapshots       | Domain data only; no CSS, DOM, storage, renderer or acquisition                       |
| `news/application/`   | Commands, immutable state, local storage, transport and trusted composition                 | Domain and explicitly selected geography                                              |
| `news/presentation/`  | Reader panels, responsive layout, keyboard/focus and interface themes                       | Application interfaces and presentation; no provider acquisition/interpretation rules |
| `news/providers/`     | Seismic adapter protocol, normalization, failures and trusted registration                  | Provider modules; no layout/renderer                                                  |
| `news/geography/`     | Project recorded coordinates, render map or coordinate list, own boundary-resource lifetime | Geographic utilities and injected services; no evidence acquisition                   |
| `news/server/`        | Local API/static boundary, request quotas, cancellation, startup/shutdown                   | Providers and Node built-ins; no stored cases                                         |

`npm run check:news` checks syntax and declared literal dependencies, including multiline imports and re-exports; adversarial boundary tests prove forbidden directions/computed imports are rejected. This lint checks the import forms used by trusted product source. It is not a sandbox for arbitrary executable plugins. Inherited `npm run check:boundaries` separately checks inherited imports/package exports.

## Interface themes

Working demonstration: run the service, open a reading account, switch **Night desk** / **Reading room**. Colors, typography, surfaces, component focus/state styling and motion tokens change. Source/provenance/provider choices do not. `themes.js` validates theme identity; `styles.css` supplies the same token contract for both. The paper theme also changes heading typography and motion, making it more than a tint variation. Reduced-motion preferences take precedence.

Files defining this demonstration: `news/presentation/themes.js`, `news/presentation/styles.css`; UI selector wiring in `news/presentation/main.js`. No domain/provider files are modified to switch themes. `news/tests/application.test.mjs` checks theme selection leaves domain records unchanged; browser checks exercise both themes and keyboard-visible focus.

Theme identity never selects capabilities. Layout is responsive presentation behavior, not scattered checks for a theme name. Globe rendering effects are not a product theme; this release has no globe-effect dependency.

## Compatible seismic providers

`createProviderRegistry()` accepts only trusted application-injected adapter objects with validated IDs and `retrieve(query, {signal})`. `acquire(url,{signal})` is optional for adapters offering input acquisition. HTTP clients may select an already registered provider ID; they cannot load/register code. The product controller selects `usgs` explicitly.

Working substitute/registration demonstration:

```js
import { createProviderRegistry } from '../../news/providers/registry.mjs';
const adapter = {
  async retrieve(query, { signal }) {
    signal?.throwIfAborted();
    return {
      provider: 'fixture-seismic',
      status: 'empty',
      query,
      retrievedAt: new Date().toISOString(),
      evidence: [],
      error: null,
      truncated: false,
    };
  },
};
const registry = createProviderRegistry({ 'fixture-seismic': adapter });
const result = await registry.get('fixture-seismic').retrieve({
  startDate: '2023-02-06',
  endDate: '2023-02-06',
  latitude: null,
  longitude: null,
  radiusKm: 300,
});
```

This is explicitly a deterministic conformance fixture, not a real evidence source. `news/tests/service.test.mjs` registers a second labelled fixture catalog through the live HTTP boundary and exercises unknown-provider rejection. `news/tests/domain.test.mjs` adds its normalized records to a case and round-trips them through snapshot validation without domain source edits. The separate `verify:news:live` gate uses real USGS acquisition/retrieval.

Files defining the provider boundary: `news/providers/registry.mjs`, `news/providers/usgs.mjs`, `news/server/http.mjs`; demonstrations live in the service/domain tests. Source IDs/families are validated identifiers, not hardcoded to USGS in the domain. Every evidence record must match the selected retrieval provider. Explicit dependence is retained, and differing URL hosts do not prove independence.

The current adapter contract is intentionally seismic: bounded UTC day/circle queries and earthquake magnitude/type/estimated-origin/depth fields. A camera, weather, imagery or news adapter must use a separately appropriate typed contract preserving its meaningful metadata (frame/acquisition date, quality, freshness, coverage, attribution, credentials, etc.). Do not force these into an earthquake record. Adding those domains would require explicit application capability and domain-schema work; no generic marketplace or universal provider compatibility is claimed.

## Geographic extension and reduced product

Working demonstrations:

```text
http://127.0.0.1:4178/
http://127.0.0.1:4178/?geography=coordinates
http://127.0.0.1:4178/?geography=off
```

Default: `mapLayer` declares `mapHost`, `boundaries` and `onSelectEvidence`. The alternate `coordinateLayer` needs only `mapHost`, makes no boundary request and provides a materially different text representation. Both implement `enable`, `disable`, `update(model)` and `dispose`.

Off: composition constructs no geographic layer and performs no dynamic geographic module import. Document, chronology, correction, retrieval and local persistence still run. No fake sources/renderers are supplied to satisfy the inherited catalog. Only a finite trusted composition option is selected; case data is never used as an executable module URL. This is capability selection, not an access-control mechanism. Provider host/range/registration restrictions remain at the service boundary in every mode.

Exact implementation files: `news/application/bootstrap.js`, `news/application/composition.js`, `news/geography/{map,coordinate-list,project}.js`. Independent state mutation protection belongs to `news/application/controller.js`; rendering subscribers receive deep-frozen snapshots and can change records only through application commands.

`news/tests/application.test.mjs` exercises actual map disable/dispose, abort propagation and suppression of late boundary results with a minimal DOM test host, actual coordinate-list substitution without acquisition, empty composition without constructing omitted factories, reverse cleanup and immutable subscriber state. HTTP tests separately exercise client-disconnect provider abort; controller tests replace a case/dispose during retrieval and reject late state changes. Browser exercises make both geographic substitutions visible.

## Remaining coupling and limits

The application/presentation is still a small single-user workflow. `bootstrap.js` chooses from two geographic descriptors; adding one requires trusted code registration. The controller selects USGS explicitly. Other input/source domains need new types and UI commands, not a theme edit. Map rendering is an equirectangular orientation view; it is not imagery, a shaking footprint, reconstruction, geocoding or metric distance measurement. Boundary packs are simplified and supplied by local static hosting. No third-party executable plugin isolation is implemented or advertised.
