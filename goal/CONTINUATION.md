/goal

Continue News Evidence View through two connected outcomes:

1. Correct the current implementation so its MVP aligns with the consumer service already specified.
2. Research, explore, evaluate and develop the GUI/UX for the next version through materially different, functioning design alternatives.

Repository:
https://github.com/Shamdon/news-evidence-view

This replaces the previous alignment-correction prompt while retaining the original mission, evidence-integrity requirements and architectural acceptance gate.

Read the repository’s current goal, assignment, brief, implementation, issue register and validation records. Reconcile them with this assignment and persist the active goal under /goal.

MISSION AND AUDIENCE

News Evidence View belongs to Security, specifically källkritik: helping ordinary internet users critically examine reporting, its sources and its supporting evidence.

A person encounters an article, video, podcast, clip or other report and wants to understand:
- What it actually claims.
- Where and when the reported events occurred.
- What relevant context changes its interpretation.
- Which evidence supports or challenges its claims.
- What remains unresolved or unassessed.

They submit the source and receive an understandable, interactive account connecting the original material, claims, evidence, chronology and geography.

The service should support informed personal judgment. It must not manufacture certainty or present a convincing visualization as proof.

The intended audience is ordinary internet users. Do not design the primary experience for GIS operators, earthquake analysts or people configuring research queries.

Earthquake reporting is an implementation example. It must not determine the permanent product identity, domain schema or interface.

Market size and commercial demand remain separate questions. Do not invent validation or conduct a speculative business-planning exercise in place of this assignment.

AUTONOMY

Use the capabilities of the Codex harness and your judgment.

Work autonomously through research, implementation, design exploration, adversarial evaluation and revision. Continue while the session permits productive execution.

Do not wait for the owner to return to make ordinary reversible decisions. Record assumptions, choose a justified provisional course and proceed.

Ask only for genuinely blocking information or authority you do not have. Continue independent work when another part is blocked.

Use parallel agents where available and useful, with clear ownership and independent evaluation. Prevent conflicting edits.

Discover relevant installed design, UX, research, accessibility and implementation skills. Apply those that genuinely improve the work. Do not claim a skill was used if it was unavailable or unread.

You may create branches, modify code, run local services, commit, push and create or update draft PRs.

Do not merge your own PR, deploy publicly, purchase services, create paid subscriptions, publish submitted content or modify the clean upstream mirror.

Do not fill time with ceremonial iterations. Use remaining execution capacity to resolve consequential findings or improve acceptance evidence.

REPOSITORY SEPARATION

Original:
https://github.com/bilawalsidhu/gods-eye-view

Clean mirror:
https://github.com/Shamdon/gods-eye-view

Product:
https://github.com/Shamdon/news-evidence-view

Verify the actual current branch and commit. Do not assume a previous handoff describes the latest implementation.

Preserve shared ancestry, licenses and third-party notices. Product changes belong only in the product repository.

Incoming upstream changes must remain reviewable and adaptable. Do not reset product main to the upstream head or rewrite shared history.

OUTCOME A: MVP ALIGNMENT

Audit actual behavior against the requested reader journey:

Submit source → acquire/transcribe where supported → identify inspectable claims → resolve context → retrieve evidence → present an understandable result → explore sources and uncertainty → save/revisit.

Determine what is implemented, partial, missing or externally blocked.

Specifically examine:
- Ordinary article URL acquisition versus storing a reference URL.
- Meaningful factual claim extraction versus sentence splitting.
- Useful automatic context versus manual geographic query setup.
- Domain contracts hard-coded to USGS or earthquake records.
- Actual provider replaceability.
- Whether the submitted report drives the geographic presentation.
- Saved evidence-state preservation.
- Documentation and UI claims versus exercised capabilities.

Repair these misalignments.

Retain useful provenance, correction history, retrieval snapshots, lifecycle handling and tests. Refactor only where the product or architectural requirements justify it.

Exercise a real supported report and evidence path. Demonstrate a materially different report category without rewriting shared evidence contracts.

Broad audiovisual support remains an ambition. Implement and state supported modes accurately. Unsupported material must receive a useful explanation or supported fallback.

Do not require readers to enter coordinates, select providers or configure date-window queries before receiving useful initial context.

Ambiguity may require a targeted question or correction. Handle it explicitly rather than guessing or forcing the reader to perform the entire investigation.

OUTCOME B: NEXT-VERSION GUI/UX

The next version’s design is not settled.

Do not merely restyle the inherited cockpit, add a panel, or decorate the technical prototype. Design the experience around the reader’s task.

Research before committing to a visual direction, and produce tangible visual and interactive evidence before selecting a provisional recommendation.

Keep the aligned MVP runnable while exploring the next-version interface. Organize branches and previews so implementation alignment and speculative design work remain distinguishable and reviewable.

RESEARCH DOSSIER

Investigate the questions that materially affect this product:

- How ordinary readers submit, interpret and question reporting.
- How to make evidence, provenance, contradictions and uncertainty understandable.
- How people move between an overview and the original source.
- When maps, timelines, document views and audiovisual excerpts help.
- When geographic presentation distracts or creates unwarranted confidence.
- How to support mobile use, accessibility, low technical familiarity and different languages.
- How to communicate acquisition failure, insufficient evidence and unsupported media without making the user feel stranded.
- How to distinguish quick contextual exploration from deeper investigation.

Examine relevant products and real workflows in source assessment, fact-checking, search, geographic storytelling, document analysis and consumer information tools.

Use primary research, authoritative guidance, original product documentation and directly observed behavior where available.

Maintain source links and dates. Distinguish empirical findings, vendor claims, observations, design judgments and hypotheses.

Wikipedia may be used for orientation or source discovery. Inspect and cite underlying sources; Wikipedia itself is not evidence.

Do not cherry-pick evidence to justify a preferred interface. Identify disagreement, limitations and applicability.

Convert research into actionable design implications. A bibliography without implications is insufficient.

Do not prescribe that the globe must dominate every screen. Determine how geography serves the report and when another representation should lead.

DESIGN EXPLORATION

Create at least four materially different interface directions.

You choose their concepts from the research. Differences must concern interaction and information hierarchy as well as appearance—for example, how submission, results, evidence inspection and geographic context are organised.

Changing only colour, typography or panel placement does not constitute another direction.

Use the same representative reports and tasks across alternatives so comparisons are meaningful. Include at least one adversarial or insufficient-evidence case.

For each direction, provide:
- Its reader-experience hypothesis.
- A complete submission-to-result journey.
- A result overview.
- A selected-claim/evidence-detail experience.
- Relevant map, timeline and original-source relationships.
- Desktop and mobile treatment.
- Loading, partial-success, unavailable-source and ambiguity states.
- An inspectable interactive prototype.
- Its strengths, tradeoffs and unresolved assumptions.

Prototypes may use clearly labelled fixtures for controlled comparison. Do not present fixture retrieval, fabricated sources or simulated model activity as live functionality.

Evaluate all directions before choosing a provisional recommendation. Preserve the alternatives for review.

The recommendation is not owner approval. Continue developing it as a reversible working direction while documenting why it was chosen and what could change that choice.

PRODUCT INTERACTION REQUIREMENTS

The primary interface should make the following apparent:
- What the user can submit.
- What will happen after submission.
- What the service has actually examined.
- Which findings are relevant to the submitted report.
- What the evidence establishes and what it does not.
- How to inspect a claim and its sources.
- What to do when information is missing or ambiguous.

Progressive disclosure should keep the initial journey manageable while permitting deeper investigation.

Avoid placing internal schemas, provider configuration, model routing, raw query parameters or developer terminology into the ordinary reader’s flow.

A report may contain supported facts, misleading framing, outdated statements and unresolved allegations together. Make those differences understandable. Do not force an unsupported overall true/fake verdict.

Keep the original wording or audiovisual timecode accessible.

Use suitable pictograms rather than emojis. Preserve necessary geographic attribution in every visual mode.

Do not produce fake documentary photography, counterfeit publisher branding or fabricated evidence for visual polish.

ARCHITECTURE AND EXTENSIBILITY

Preserve explicit boundaries between:
- Evidence/domain logic.
- Source acquisition and provider adapters.
- Interpretation and resolution.
- Application orchestration.
- Persistence.
- Product presentation.
- Themes.
- Geographic rendering, layers and tools.

The evidence model must not depend on CSS, layout, theme names or one provider.

Themes should have a coherent contract for relevant visual tokens and component states. Distinguish themes from layouts, globe effects and capability selection.

Provider adapters retain their own authentication, protocols, normalization, failure handling, provenance, dates, freshness, coverage and attribution.

Select product capabilities explicitly. Reduced configurations must not require unrelated layers or fake implementations to satisfy the inherited full catalog.

Hidden controls are not access control.

Executable extensions remain distinct from declarative scenes and data packs. Submitted reporting and model output must not install plugins or expand tool/provider authority.

Demonstrate:
- Two materially different interface themes without changing domain/provider modules.
- Provider addition or substitution through its boundary.
- Geographic layer or tool addition/substitution through its boundary.
- Reduced capability composition.
- Correct cancellation and cleanup.
- Relevant dependency-boundary checks.

Document the exact integration work required. Modular filenames alone do not establish extensibility.

EVIDENCE INTEGRITY

Treat submitted and retrieved content as untrusted.

Separate source assertions, observations, inferences, reconstructions and unknowns.

Retain source spans/timecodes and correction history.

Distinguish publication, observation, event and retrieval times.

Repeated reporting of one underlying assertion is not independent confirmation.

Proximity does not establish causation or involvement.

Missing evidence does not prove absence.

Present-day observations do not automatically verify historical events.

Imagery must retain acquisition dates and relevant quality limits.

Search should expose relevant conflicting evidence and alternative explanations, not merely confirm the initial report.

Insufficient evidence is a legitimate result.

Respect content access, retention and redistribution rights. Do not bypass access restrictions. Do not describe inherited or newly retrieved material as commercially cleared without checking the selected use.

DEFINITION OF DONE

Outcome A is done when:
- The supported real-input journey works end to end.
- Useful initial context does not depend on manual technical query setup.
- Claims and evidence are inspectable and traceable.
- Places, dates, uncertainty and source dependence are handled accurately.
- A materially different report category works through the shared architecture.
- Saved accounts preserve their recorded evidence state.
- Functional, security, accessibility and regression checks pass for the implemented scope.
- Supported and unsupported capabilities are described accurately.

Outcome B is done when:
- A source-backed research dossier contains concrete design implications.
- At least four materially different directions have working, inspectable prototypes.
- Desktop, mobile and consequential failure/uncertainty states are represented.
- Alternatives have been challenged against the same tasks.
- A justified provisional recommendation and reusable design system are recorded.
- The recommended journey is implemented against the real application where feasible, with simulated portions clearly identified.
- Presentation/theme changes respect the architectural boundaries.
- Alternatives, previews, decisions and evaluation evidence remain available for owner review.

Overall delivery also requires:
- Relevant extensibility demonstrations.
- Committed and pushed work.
- Reviewable draft PRs with clear scope.
- Reproducible run/preview instructions.
- An unchanged clean mirror.
- Accurate /goal, issue, decision and handoff records.

External blockers must identify the precise incomplete criterion. Do not disguise blocked live behavior as completion.

DEFINITION OF SUCCESS

Engineering success:
The supported reader journey operates reliably and preserves evidence integrity.

Reader-task success:
The experience improves the reader’s ability to understand the report, locate evidence, recognise unresolved claims and avoid unwarranted conclusions.

Before evaluation, define tasks, a comparison baseline, scoring and justified acceptance thresholds.

Compare with source-linked reading alone and compare the design alternatives.

Visual attractiveness and satisfaction are not sufficient measures.

Independent simulated evaluations can expose defects. They do not establish real human outcomes. If human testing is unavailable, report reader-benefit claims as hypotheses and supply a runnable human evaluation protocol.

Design success:
The provisional recommendation has a coherent interaction model, clear hierarchy, usable mobile behavior and traceable rationale. Its tradeoffs are explicit; it is ready for informed review.

Commercial success:
Recurring need, willingness to pay and viable delivery costs require separate validation. Do not invent them.

Report these success levels separately.

DEFINITION OF FAILURE

Failure includes:
- Invented or misleading evidence, citations, dates or geographic facts.
- A convincing visualization presenting an assertion as an observation.
- A generic globe or technical control panel delivered as the consumer service.
- The user performing the acquisition and investigation work the service claims to perform.
- Earthquake/USGS assumptions embedded in shared contracts.
- Unsupported universal-input or automated-verification claims.
- Hidden uncertainty, source dependence or significant contradictions.
- A global true/fake judgement unsupported by claim-level evidence.
- Design alternatives that are merely cosmetic variations.
- Research that does not affect design decisions.
- Static mockups presented as exercised interaction.
- Accessibility or mobile use treated as a final decorative adjustment.
- Prototype fixtures presented as live retrieval.
- Domain/provider changes required merely to switch presentation.
- Security boundaries weakened for convenience.
- Product changes entering the clean mirror.
- Completion claims exceeding the actual acceptance evidence.

GAUNTLET PROCESS

Use an adaptive cycle:

Inspect and frame.
Research the important uncertainties.
Build a complete testable slice.
Challenge actual behavior independently.
Repair consequential failures.
Re-run affected checks.
Reassess the goal and design implications.

Apply it to both implementation and design.

Independent evaluators should inspect the running experience, code and evidence. They should not simply approve the builder’s narrative.

Challenge different failure mechanisms: source integrity, temporal/geographic interpretation, reader effort, cognitive clarity, accessibility, security, architecture and operational costs.

Let findings change the plan. Avoid ceremonial iteration counts, self-congratulation and feature expansion unsupported by the reader task.

If blocked in one area, continue useful independent work. Do not wait for owner preferences when a reversible provisional choice can be evaluated.

PERSISTENCE AND OVERNIGHT CONTINUITY

Keep the active plan, goal status, issue register, research sources, design alternatives, decisions and evaluation evidence in the repository.

Commit coherent checkpoints.

Before interruption or context loss, record:
- Branch and commit.
- Current executable state.
- What was exercised and its results.
- What remains unfinished or blocked.
- Significant assumptions and decisions.
- The next concrete action.

Resume from actual repository state. Do not repeat completed research or restart the project unnecessarily.

Do not claim continuous operation beyond what the harness can execute. Checkpoint rather than leaving an unreviewable partial state.

DELIVERY

Provide:
- Branches, commits and draft PR links.
- The actual supported reader journey.
- Real reports and evidence paths exercised.
- Supported input modes and limitations.
- Research findings that materially affected the design.
- Preview/run instructions for all four alternatives.
- Comparison and provisional recommendation.
- Design-system and architectural boundaries.
- Validation performed and results.
- Definition of Done status for each outcome.
- Engineering, reader-task, design and commercial success status separately.
- Remaining blockers, defects and unvalidated hypotheses.
- Verification that the clean mirror is unchanged.

End with a concise factual handoff in a text code block for the product-planning thread.

Begin by inspecting current state, correcting the goal records and choosing an execution plan. Continue autonomously toward both outcomes.
