# News Evidence View active goal

Build a working local service turning submitted reporting into inspectable source-linked claims, geography, chronology, retrieved evidence and uncertainty. The governing assignment is [ASSIGNMENT.md](ASSIGNMENT.md). It supersedes setup-only status; the original bootstrap remains in history.

## Release scope and assumptions

First release: readers investigating earthquake reporting. Accept pasted text and UTF-8 text files, plus an explicitly supported official USGS event URL. No video/audio transcription, unrestricted webpage scraping, causal attribution, casualty verification or universal format access. Keep unsupported claims visible. Deterministic extraction proposes sentence spans, explicit dates and magnitudes; reader correction is required for ambiguous interpretation. No model/tool execution from submitted content.

Evidence: user-initiated bounded USGS catalog retrieval across a date window and optional area, deliberately without a magnitude confirmation filter. Preserve candidates, differences, shared catalog dependence, unknowns and failures. Catalog proximity is context, not proof of event identity or causation. Same-source input and evidence are explicitly dependent. A completed insufficient-evidence case is valid.

Product entry is isolated from the inherited full globe catalog. Use a focused 2D geographic view and equivalent document/list/timeline views, two interface themes, replaceable providers and lifecycle-owned layer composition. Preserve original ancestry, license and data notices; exclude incompatible inherited assets from the product entry. No commercial clearance is asserted.

## Acceptance evidence

All thirteen Definition of Done items in the assignment govern completion. Engineering gates include real supported input and live retrieval, save/revisit without refresh, correction history, conflict/missing evidence, hostile input and service boundary tests, desktop/mobile/keyboard browser journeys, clean build, and a draft PR on a development branch. Extension demonstrations must change themes, substitute an adapter and layer, run without geography, and verify disposal/boundaries.

Before reader evaluation, use source-linked reading as baseline. Tasks: locate original wording, distinguish event/publication/retrieval times, inspect a magnitude discrepancy, identify same-source dependence, and explain empty versus failed retrieval. Score each task 0/1; engineering scenario threshold 5/5 plus no unsupported certainty. This threshold is a defect-finding gate for this small experiment, not a claim about human benefit. Independent simulated review challenges behavior. Human outcomes and commercial demand remain unvalidated.

## Done, failure and success

A usable supported end-to-end journey and all exercised engineering/extension gates are necessary; documents and fixtures alone are insufficient. Assignment failure criteria apply, especially invented evidence, claim/observation conflation, untrusted instruction execution, privacy leakage and mirror changes. Maintain the issue register and revise based on consequential findings.

Report engineering, reader-task and commercial success separately. Do not claim misinformation resistance, measured human benefit or demand without evidence. Do not deploy, merge the draft PR or publish submitted private material.

## Current state

Development started from verified main a81d32343ad70b33f92738b2e28bab0a78178fee. Branch: development/reader-journey. Work plan, research/decisions, evaluation and issues are in docs/project. Completion is pending implementation and validation.
