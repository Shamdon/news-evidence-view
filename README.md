# News Evidence View

Working project name. A news-context and evidence-exploration service derived from God's Eye View.

## Goal

Accept an article, clip or other report and connect its claims to places, dates, original sources and independently retrieved evidence. Distinguish reported claims, evidence and service inferences so readers can inspect what is established, disputed or unknown. Improving resistance to misinformation is an outcome to evaluate, not an established benefit.

## Current state

Repository preparation only. The inherited application is God's Eye View v0.2.1 at `aa16b7c3b0166a89d8c7a6089e0aff53a22faaee`. It still opens the inherited globe. Article ingestion, transcription, claim extraction, evidence retrieval and a news-specific interface have not been implemented. Runtime package names and exports remain unchanged. The original README is preserved in Git history at the baseline commit.

## Repository separation

| Remote | Repository | Role |
| --- | --- | --- |
| original | https://github.com/bilawalsidhu/gods-eye-view | Original releases |
| upstream | https://github.com/Shamdon/gods-eye-view | Clean mirror with no product changes |
| origin | Intended https://github.com/Shamdon/news-evidence-view | Product development and reviewed integrations |

The remote product repository has not yet been created. The local checkout and bootstrap are prepared. `main` contains product changes; `upstream-baseline` records the accepted original commit. Local pushes to original/upstream are disabled; this is not server-side branch protection.

Updates enter a review branch, where they can be adapted before merging. Updating the mirror does not overwrite product main.

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
