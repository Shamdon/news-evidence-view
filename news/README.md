# News Evidence View — consumer development

“Check the news behind your feed. Submit a link, headline or report and explore its claims alongside relevant sources, local observations and context.” This is the product goal, not a statement that all formats or sources work.

## Run and verify

Use Node 24.14+ within 24.x or Node 26.x (verified on 24.19.0), from the repository root:

```sh
npm ci
npm run dev:news
```

Open http://127.0.0.1:4178/. Loopback only; stop with Ctrl-C. Alternate port: `NEWS_PORT=4179 npm run dev:news`. The acquisition adapter requires installed `linkedom`. No deployment, account system or paid source is configured.

```sh
npm run test:news
npm run check:news
npm run build:news
node dist-news/news/server/start.mjs
npm run verify:news:consumer-live
```

The build stages product code, MIT/data notices and the public-domain Natural Earth country pack in `dist-news/`. It uses the checkout’s installed dependency; it is not a dependency-free distribution. Live verification contacts public sources and is separate from deterministic tests.

## Supported inputs and evidence

- Permitted public HTTPS HTML article URLs: safe bounded extraction of article/main text. Title and explicit valid publication timestamp are retained; missing time stays unknown. Extraction is conservative, can miss content, and discloses truncation. No login/paywall bypass, cookies or credentials.
- Pasted text and locally decoded UTF-8 `.txt` reports (300 KB file limit): conservative English and limited Swedish factual candidates, exact source spans and unassessed remainder. Proposals are not verified facts or general language understanding.
- Headlines: discovery request to GDELT’s recent news index, followed by explicit candidate selection before acquisition. A headline creates no factual account by itself. **The real discovery gate currently times out; working candidate selection is fixture-tested, not demonstrated live.** Provide the intended article URL/text when discovery fails. Index access time is not publication time.
- Validated version-2 account JSON: explicit import/export and local save/reopen retain recorded evidence, corrections and retrieval timestamps. Imported provenance is not authenticated. The earlier version-1 technical account remains separate at `/technical`.

Audio, video, transcription, PDF and restricted sources are unsupported. Paste a permitted excerpt/transcript. No media timecodes or original audiovisual observation are claimed.

The same application selects trusted capabilities using the interpreted claim. Readers choose no subject checker and supply no coordinates or provider query before initial context. It attempts the first six factual candidates; further claims can be inspected and retried explicitly. Natural-language clarification records a reader assertion and revision without changing original wording. Ambiguous scope is not guessed.

Actual sources: World Bank annual country human population totals (1960 through current year, where available); USGS date/country bounding-box catalog searches currently cover Turkey and Syria, or a recorded source coordinate can support a bounded nearby search. Country boxes include offshore/border events and cap at 100 chronological candidates. They do not establish event identity. Population flows, subgroups, town/species totals, responsibility, casualty and unsupported claims remain unassessed. There is no live local-camera/media-feed capability yet.

## Exercised real journeys

The public SCB article “Lowest population growth in 22 years” is acquired, its Sweden end-of-2023 total proposed, and the corresponding World Bank annual record retrieved automatically. The UI explains differing values and reference/method limitations instead of declaring the article false. Publication remains unknown when metadata lacks a valid timestamp.

The public USGS Kahramanmaras sequence article is acquired. Several places/magnitudes require a targeted date/place clarification for the selected claim; no coordinates or catalog controls are required. The broad catalog result reaches the 100-record cap, which remains visible. The original publisher and catalog share the same family and do not provide independent corroboration. `verify:news:consumer-live` records both real paths and validates JSON save/reopen; its earthquake path explicitly records this clarification.

## Privacy, uncertainty and geography

Article URLs are sent to the local service, which contacts the source. Headline text is sent to the news index. Only bounded interpreted context is sent to evidence providers. No submission logs, server storage or automatic sharing. Explicit browser saves and exported JSON contain unencrypted source text and evidence; shared-device users can access them. Linked pages may later change; the account preserves extracted text/normalized records, not complete archived pages.

Supporting/contextual/conflicting relationships are conditional comparisons. Empty, failed, unresolved and capped retrievals are distinct. Repeated catalog records or publication copies are not independent confirmation; unknown source lineage stays unknown. Event/reference period, publication, observation and retrieval time are distinct. Geography supplies orientation when relevant, not causal proof, imagery or a historical observation.

Reading room and Night desk themes are presentation-only. `/?geography=coordinates` replaces the map with text; `/?geography=off` omits geographic construction while preserving investigation and persistence. Geographic context is optional. `/technical` preserves the earlier technical seismic desk for useful reference, outside the consumer entrance.

No reader-benefit study, misinformation-resistance result or commercial demand has been demonstrated. Preserved third-party terms mean the inherited repository is not commercially cleared. See `docs/project/EVALUATION.md` for exercised gates and remaining limitations.
