# News Evidence View

Working project name. A news-context and evidence-exploration service derived from God's Eye View.

## Goal

Accept an article, clip or other report and connect its claims to places, dates, original sources and independently retrieved evidence. Distinguish reported claims, evidence and service inferences so readers can inspect what is established, disputed or unknown. Improving resistance to misinformation is an outcome to evaluate, not an established benefit.

## Current state

Consumer development is available on `development/consumer-alignment`; `main` retains the published bootstrap until review. The local `news/` entry accepts permitted public HTML URLs, report text and UTF-8 text files, proposes inspectable factual statements, resolves bounded context and chooses registered evidence capabilities. Headline discovery is implemented but its real public-index gate currently fails on timeout; candidate selection is tested with explicit fixtures. Audio/video/PDF acquisition is not implemented.

Actual public population and earthquake articles exercise one provider-neutral workflow. Current live evidence sources are World Bank annual country totals and USGS catalog context with limited geographic support. Other claims remain explicitly unassessed. No claim of universal coverage, human benefit or commercial demand is made. The inherited console and package exports remain preserved.

Run `npm ci` then `npm run dev:news` with supported Node.js. Open `http://127.0.0.1:4178/`. See [supported inputs and limits](news/README.md), [acceptance evidence](docs/project/EVALUATION.md) and [extension boundaries](docs/project/EXTENSIONS.md). Four fixture-based design alternatives are preserved on the separate design development branch; they are explicitly distinct from live retrieval.

## Repository separation

| Remote | Repository | Role |
| --- | --- | --- |
| original | https://github.com/bilawalsidhu/gods-eye-view | Original releases |
| upstream | https://github.com/Shamdon/gods-eye-view | Clean mirror with no product changes |
| origin | https://github.com/Shamdon/news-evidence-view | Product development and reviewed integrations |

Published on 2026-10-13 at https://github.com/Shamdon/news-evidence-view as a public, independent repository preserving the original Git ancestry. The default branch is `main`. The prepared commit `860e5bbd3d095fdac5e84b995d33dce5bee2bfeb` was published to `main`, and `upstream-baseline` was published at the exact accepted baseline. Publication status is recorded in a separate documentation commit. `main` contains product changes; `upstream-baseline` records the accepted original commit. Local pushes to original/upstream are disabled; this is not server-side branch protection.

Updates enter a review branch, where they can be adapted before merging. Updating the mirror does not overwrite product main. GitHub Actions remain disabled. No automatic merges, scheduled updates, deployments or paid services were configured.

## Records

- [Brief](docs/project/BRIEF.md)
- [Done, Failure and Success](goal/README.md)
- [Upstream integration](docs/project/UPSTREAM_INTEGRATION.md)
- [Work packages](docs/project/WORK_PACKAGES.md)
- [Baseline record](docs/project/upstream-baseline.json)

## Run the inherited application

Use Node.js 24.14+ within 24.x or Node.js 26.x.

```text
npm ci
npm run doctor
npm run dev
```

Use the address printed by the server. Provider keys are optional for the inherited keyless globe; provider policies and quotas apply.

## Licensing

Preserve the inherited MIT [LICENSE](LICENSE). Third-party assets and data retain separate terms in [DATA_SOURCES.md](DATA_SOURCES.md). TeleGeography cables and Nepal imagery/derived coordinates have noncommercial restrictions. This initial checkout retains inherited assets for evaluation; it is not a commercially cleared release. Report text, imagery and transcripts also retain their source rights.

The project is not affiliated with the original publisher.
