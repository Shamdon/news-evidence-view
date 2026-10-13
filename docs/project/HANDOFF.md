# Review handoff — consumer intent correction

Repository: https://github.com/Shamdon/news-evidence-view (public). Default branch main remains `a81d32343ad70b33f92738b2e28bab0a78178fee`; upstream-baseline and the unchanged clean mirror main remain `aa16b7c3b0166a89d8c7a6089e0aff53a22faaee`.

Consumer code checkpoint `04cce273a399c4c06b8c8c85ddc8cef92a224b01`: development/consumer-alignment, [draft PR #4](https://github.com/Shamdon/news-evidence-view/pull/4), base main. Design code checkpoint `8515d9fab4a0176c7c4a9c764bdeb5d04bf7c62f`: development/design-alternatives, [draft PR #5](https://github.com/Shamdon/news-evidence-view/pull/5), base consumer-alignment. Publication documentation advances heads; use `git ls-remote origin refs/heads/development/consumer-alignment refs/heads/development/design-alternatives` for exact current heads. Neither draft is merged or deployed.

## Run and review

Supported Node 24.14+ within 24.x or Node 26.x; tested 24.19.0. Checkout consumer-alignment for the real service, or design-alternatives for the service plus four alternatives. `npm ci`, then `npm run dev:news`; open http://127.0.0.1:4178/. Stop with Ctrl-C. Local preview server is stopped at final teardown; this is not public hosting.

On the design branch, open `/design/index.html` and the links `?direction=guide`, `?direction=document`, `?direction=journey`, `?direction=matrix`. Shared fixture labels remain persistent; custom source input receives fallback, not fabricated analysis. Prototype data never enters the actual workflow.

Primary service: source URL/text/.txt → permitted acquisition → proposed factual claims/context → automatic bounded registered evidence → exact wording/provenance/uncertainty → explicit save/reopen. No subject checker or manual coordinates/query setup. Headlines initiate discovery/explicit candidate selection; real public-index discovery times out, so live headline-to-selected-article remains incomplete. Audio/video/PDF, access-restricted sources and local-media feeds remain unsupported. Other claims remain visibly unassessed.

Actual SCB article → World Bank annual population record ran automatically. Actual USGS sequence article → targeted place/date clarification → broad 100-record capped catalog context ran through the same generic account. Source-family dependence, reference/method mismatch and incomplete coverage remain explicit. Third documentary capability addition/save/reopen is a labelled fixture, not an additional live provider.

## Verification and status

78 product tests and 6 prototype model tests passed; product syntax/dependency checks and isolated build passed. Inherited boundary/format checks passed separately. Primary browser exercised four shared report/state journeys, 390px layouts, both themes, source inspection, native keyboard dialog lifecycle and live account persistence/reduced geography. Actual live paths and exact limitations are in EVALUATION.md. Independent challenge reproduced and rechecked six repaired consequential defects.

Outcome A: supported URL/text journey verified, overall partial because real headline discovery is externally blocked. Outcome B: source-backed research, four functioning alternatives, shared-task comparison, reusable tokens and reversible recommendation delivered as an engineering/design checkpoint. Recommendation is simple question-led entrance plus annotated detail and optional chronology/map, not owner approval or measured reader benefit.

Engineering success is bounded to exercised inputs/sources. Human reader-task success and misinformation-resistance remain hypotheses; run the predeclared comparison with source-linked reading alone. Commercial demand/cost viability remain unvalidated. No continuous execution beyond the harness is promised.

Useful prior implementation retained at /technical. New product runtime code changed under news/; inherited src/, server/, package exports, MIT license and third-party data notices were not changed. Shared original/prepared ancestry retained. Upstream/original local push URLs remain DISABLED. No clean-mirror write, self-merge, public deployment, scheduled update, automatic merge or paid service configured.

Next: establish and exercise a reliable permitted headline discovery route with explicit story disambiguation; then conduct the documented human comparison. Do not restart verified implementation or relabel fixture support as live coverage.
