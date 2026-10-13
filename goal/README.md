# Active goal: consumer alignment and next-version design

News Evidence View is a consumer web app for source criticism, source evaluation and information evaluation (källkritik). Submit reporting, receive understandable context, inspect original wording and relevant evidence, explore uncertainty, and save/revisit the recorded account. The governing continuation is [CONTINUATION.md](CONTINUATION.md), retaining the original mission, evidence contract and architectural acceptance gate in [ASSIGNMENT.md](ASSIGNMENT.md).

## Product intent correction (2026-10-13)

“Check the news behind your feed. Submit a link, headline or report and explore its claims alongside relevant sources, local observations and context.” This is the intended journey, not universal-format/provider support already achieved.

Entrance: URL, headline, text or supported media. A headline initiates discovery of candidate reporting; it is not a complete factual claim. Preserve ambiguity and require selection before acquiring a candidate. Ordinary readers never select a subject checker, enter coordinates or configure provider queries. Service capabilities select relevant sources from recorded claims and expose relevance, time, coverage and dependence. Geography/local media matter when relevant; they do not verify every claim and current observations cannot prove historical accounts. Subject examples exercise generic capabilities, not separate hardcoded checker architectures.

Current divergence: the preserved prototype had earthquake identity, seismic shared fields, sentence splitting, manual queries and reference-only article URLs. This correction must reach executable orchestration, shared contracts, consumer interface and acceptance tests—not just product wording.

## Outcome A — aligned MVP

Replace the technical earthquake-first flow with source submission and useful automatic context. Implement permitted public article URL acquisition, factual claim candidates beyond sentence splitting, bounded automatic evidence retrieval/context, and provider-neutral shared records exercised by materially different reporting categories. Readers must not supply coordinates/provider/query parameters before getting initial context. Ambiguity gets a targeted question or explicit unresolved state. Preserve immutable provenance, correction history, saved retrieval snapshots, cancellation and trusted executable boundaries. Describe audiovisual and access-restricted failures honestly.

## Outcome B — evaluated GUI/UX alternatives

Research ordinary reader behavior and evidence/uncertainty presentation before visual commitment. Produce four materially different functioning directions on the same reports/tasks, including adversarial/insufficient evidence. Each covers submission, result overview, selected claim/evidence, source/map/timeline relationships, mobile/desktop and consequential failure states. Fixtures are explicit. Evaluate alternatives before choosing a reversible recommendation; preserve alternatives and implement the recommended journey against real application capabilities where feasible.

## Acceptance and success

Outcome A/B and overall Done criteria in CONTINUATION.md govern completion; neither is complete at this checkpoint. Engineering, reader-task, design and commercial success are reported separately. No human reader benefit, misinformation-resistance improvement or demand is validated. Provide a runnable human comparison protocol rather than substituting simulated agents for people.

No self-merge, public deployment, paid service, submitted-content publication or clean-mirror change. Preserve ancestry, licenses and data notices; no commercial clearance claim.

## Current evidence and next action

The consumer implementation now acquires permitted public HTML, proposes factual candidates with exact spans/unassessed remainder, resolves bounded context and selects registered evidence capabilities. A new version-2 account retains generic typed records, corrections and immutable snapshots. The primary UI has a simple source entrance, claim/evidence detail and optional geography, without manual catalog controls; the older technical desk remains at `/technical`.

Acceptance: 78 deterministic product tests passed on Node 24.19.0; 6 separate prototype model checks passed. Actual SCB population article → World Bank annual record runs automatically; the actual USGS sequence article → broad catalog path requires a targeted place/date clarification, reaches the disclosed 100-record cap and preserves publisher/catalog dependence. Four working design alternatives have desktop/mobile and consequential-state browser evidence plus source-backed research. Independent review reproduced and rechecked six repaired defects. See [evaluation](../docs/project/EVALUATION.md) and the independent challenge record.

Outcome A has a verified supported URL/text journey; the live headline discovery/candidate gate remains incomplete because the public index times out. Outcome B has an exercised engineering/design checkpoint with a provisional question-led entrance/annotated-detail recommendation; human comparison is pending. Overall goal remains incomplete: do not claim universal input/evidence support or human/commercial success. Draft review branches remain unmerged; follow the handoff for exact publication SHAs.

Next concrete action: exercise a reliable permitted headline discovery route end to end, without silently selecting reporting or treating index results as evidence; then run the defined human comparison protocol. Preserve existing acceptance evidence instead of restarting development. No continuous operation beyond harness execution is claimed.
