# News Evidence View local first release

A focused earthquake-report reading account: submit text or an official catalog report, inspect exact sentence spans, correct interpretation with history, retrieve date/area catalog candidates, explore locations and chronology, inspect numerical differences/source dependence, and explicitly save/reopen/export the recorded account.

## Run

From the repository root, with Node 24.14+ within 24.x or Node 26.x (validated with 24.19.0):

```sh
npm run dev:news
```

Open http://127.0.0.1:4178. This product has no external package dependency and does not require `npm ci`; `npm ci` is needed for the inherited globe/tools. An alternate local port: `NEWS_PORT=4179 npm run dev:news`. Binding is loopback only. Stop with Ctrl-C. No public deployment or authentication is provided.

```sh
npm run test:news
npm run check:news
npm run build:news
node dist-news/news/server/start.mjs
npm run verify:news:live
```

Build stages a standalone product in `dist-news/`, including MIT license/data notices and only the public-domain Natural Earth country pack. The live verification contacts public USGS endpoints and is separate from deterministic fixtures; internet and provider availability are required. Avoid submitting private material when running public-source evaluation.

## Supported inputs

- Pasted report text: up to 100,000 characters and 250 sentence statements. Source URL is a reference, not an unrestricted fetch instruction. Optional publication timestamp must include timezone.
- UTF-8 `.txt` file: up to 300 KB / 100,000 characters, decoded locally.
- `https://earthquake.usgs.gov/earthquakes/eventpage/<eventid>` (optional documented event-tab suffix): official structured catalog record rendered as text by the adapter. This is not verbatim article prose. The original record URL remains available.
- Exported version-1 account JSON: up to 4 MB, schema validated before display. File-supplied provenance is not authenticated; schema validity does not prove records came from their claimed source.

Audio, video, transcription, PDF, unrestricted webpages and access-restricted articles are unsupported. Paste a permitted transcript/excerpt as text; no audiovisual timecodes are claimed. Sentence splitting/date/magnitude proposals cover explicit English/ISO dates and nonnegative magnitude wording only; they are conservative aids, not natural-language fact verification. Significant ambiguities require reader correction. Location candidates are not automatically geocoded: record place alternatives and coordinates yourself. Publication/retrieval time never fills a missing event date.

## Inspect a real journey

1. Acquire the public event URL `https://earthquake.usgs.gov/earthquakes/eventpage/us6000jllz`, or paste a report you can lawfully use.
2. Select the statement of interest. Inspect highlighted original wording. Set the reported event date and magnitude where necessary; record a correction reason. Place/coordinates remain unresolved unless supplied by the reader.
3. Choose UTC `2023-02-06` through `2023-02-06`, centre latitude `37.2`, longitude `37.0`, radius `100` km. Retrieve candidates. This busy catalog window can reach the cap; its incomplete warning is meaningful. For an uncapped public-provider exercise, use `2025-01-01`, latitude `34`, longitude `-118`, radius `100` km.
4. Inspect preferred magnitude types, origin time, update/retrieval times, review status, contributing networks, shared catalog family and conditional differences. Click a record's location or use the equivalent keyboard-accessible list. The official input and retrieved catalog are dependent.
5. Save on this device. Reload and reopen. Evidence values and retrieval time stay as recorded. Another retrieval appends a separate snapshot; use the snapshot selector to inspect older evidence. Export deliberately if you need a portable copy; import validates recorded data without refreshing it.

USGS is the only real configured evidence adapter. It assesses earthquake catalog context, not casualty, damage, cause or responsibility claims. No match is not proof of absence. Unknown, empty, failed and capped queries remain distinguishable. Repeated publication is not counted as independent confirmation. A report sourced through USGS and catalog retrieval share the same underlying source.

## Privacy and limitations

Text stays in your browser; only query dates/coordinates or an official event ID reach USGS. No submission logs/server persistence or automated sharing. Explicit browser saves and JSON exports contain original text and evidence and are unencrypted; shared-device users can read them. Browser storage can be cleared or hit quotas. External referenced pages can change/disappear; saved text/normalized records are retained, while full linked page contents are not archived.

Catalog queries are bounded to 1–7 inclusive UTC days, at most 1,000 km radius, 100 records, 10 seconds and a bounded response body. Local API allows at most four concurrent and thirty calls per minute. Narrow busy queries; later records may be absent at the cap. Provider outages and updates are normal and not evidence for/against reporting. USGS is one catalog family and not a guarantee of complete coverage or independent corroboration.

Themes: Night desk and Reading room. Geographic configurations: default map; `/?geography=coordinates` uses a coordinate-list extension without boundary acquisition; `/?geography=off` omits geography entirely while keeping source, chronology and evidence. No unrelated globe modules or providers are constructed.

No human reader-benefit study, misinformation-resistance outcome or commercial demand has been demonstrated. Preserved third-party terms mean the inherited repository is not commercially cleared. See project records for acceptance evidence, issues and extension examples.
