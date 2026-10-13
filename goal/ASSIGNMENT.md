/goal

Build News Evidence View into a working service that turns submitted reporting into an inspectable geographic and temporal experience.

Repository:
https://github.com/Shamdon/news-evidence-view

Read the repository’s project records and existing goal definitions, reconcile them with this assignment, and persist the resulting goal under /goal in the repository. Do not assume that typing /goal provides any particular harness capability; use the capabilities actually available.

MISSION

A person encounters an article, news video, audio clip or other report and wants to understand what it describes.

They submit that material. The service helps them explore the reported places, chronology, events, relationships and supporting evidence through a focused geographic interface, with appropriate document and timeline views.

The experience must make it easier to inspect:
- What the report actually says.
- Where and when the reported events occurred.
- What relevant context changes the interpretation.
- Which evidence supports or challenges particular claims.
- What is unresolved, unavailable or inferred.

The original report must remain accessible alongside the service’s interpretation.

The service should support informed personal judgment. It must not manufacture certainty or substitute a theatrical presentation for evidence.

This is a product-building assignment. Carry it through research, architecture, implementation, evaluation and revision to a usable result. Documents and scaffolding alone do not complete the mission.

OPERATING AUTHORITY

Use your judgment and the full capabilities of the Codex harness.

Choose methods, libraries, interfaces and implementation approaches according to the problem. Research unfamiliar or unstable facts. Inspect existing code before deciding what to retain or replace.

Use browser verification, terminal tools, connected services and parallel agents where available and useful. When using agents, assign concrete ownership and prevent conflicting edits. Independent evaluation should challenge the implementation rather than merely restate its intentions.

Do not turn this assignment into a rigid sequence of prescribed implementation steps. The acceptance definitions below govern the outcome; you own the route.

Proceed autonomously with reversible development work. Ask only when an unresolved decision genuinely blocks progress or requires authority you do not have. Resolve ordinary choices, document significant assumptions, and continue.

You may create branches, implement changes, run checks, commit and push to this product repository, and open or update a draft pull request.

Do not deploy publicly, buy services, create paid subscriptions, publish submitted content, merge your own pull request, or change the clean mirror.

REPOSITORY CONTEXT

Original software:
https://github.com/bilawalsidhu/gods-eye-view

Clean upstream mirror:
https://github.com/Shamdon/gods-eye-view

Product repository:
https://github.com/Shamdon/news-evidence-view

The product was initialized from God’s Eye View v0.2.1:
aa16b7c3b0166a89d8c7a6089e0aff53a22faaee

The prepared project commit was:
860e5bbd3d095fdac5e84b995d33dce5bee2bfeb

The last verified product head was:
a81d32343ad70b33f92738b2e28bab0a78178fee

Verify current state rather than assuming these references remain the heads.

The current product contains inherited globe functionality and project records. News ingestion, extraction and evidence workflows were not implemented during setup.

Preserve shared ancestry. Product-specific changes belong only in the product repository. Incoming upstream changes must remain reviewable and adaptable before integration. Do not reset product main to an upstream branch or rewrite shared history.

PRODUCT JUDGMENT

Investigate the actual reader task before committing to an architecture or interface.

Compare relevant existing services and workflows. Use benchmarks to discover useful patterns and weaknesses, not to copy their marketing claims or accumulate features.

God’s Eye View is a candidate component, not the product definition. Reuse its rendering, annotations, scenes, tools and providers where they serve the mission. Replace or isolate components where their assumptions obstruct it.

The geographic experience is central when geography is relevant. It must show the submitted report in context, rather than merely opening a generic globe with unrelated live layers.

Use a document, timeline or other appropriate representation when geography contributes little. Do not invent a spatial interpretation to justify the renderer.

Choose an achievable first release that delivers a complete reader journey. Select representative report categories and adversarial cases yourself. A first supported category must not become an accidental architectural restriction on the whole service.

The ambition is broad input support. Define and implement the input modes you can support responsibly now, and make unsupported cases explicit. Do not claim universal access to every publication, channel or format.

EVIDENCE CONTRACT

Treat submitted material and retrieved content as untrusted inputs.

Maintain inspectable distinctions between:
- Statements made by a source.
- Retrieved observations or records.
- Analytical inferences.
- Hypothetical or reconstructed presentations.
- Unknown or unavailable information.

Preserve source spans or audiovisual timecodes for extracted claims.

Distinguish publication time, observation time, event time and retrieval time. Do not silently substitute one for another.

Retain ambiguity in place names, dates, entities and relationships. Support correction without erasing the earlier record.

Do not count repeated publication of the same underlying claim as independent corroboration.

Geographic proximity is not proof of causation, shared infrastructure or involvement.

A missing observation is not proof that an event did not happen.

Imagery must carry acquisition date, source and relevant quality limitations. A polished map or animation must not make a reported event appear independently observed.

Search and retrieval must make supporting and conflicting evidence inspectable. Do not optimise the experience solely for confirming the submitted report.

Do not assume that disagreement proves one source false. Explain what the available evidence establishes and where it cannot distinguish competing accounts.

Do not assign a global truth score to a person or publication. Any claim-level status must have explicit criteria and traceable justification.

An insufficient-evidence result is a legitimate completed result.

Wikipedia may be used for orientation and discovering sources. Visit and assess the underlying sources; do not use a Wikipedia page itself as evidence.

Rights and provider terms matter for the selected implementation. Preserve inherited licenses and attribution. Identify and exclude or replace incompatible material before representing any build as commercially cleared. Do not bypass access restrictions.

ARCHITECTURE AND EXTENSIBILITY ACCEPTANCE GATE

The product must support independent work on presentation, themes, source providers and geographic capabilities through explicit, testable interfaces.

Inspect the inherited architecture. Retain useful boundaries and repair concrete coupling that obstructs this product. Choose the architecture yourself; demonstrate its replaceability through working changes.

Required separation:

1. Evidence and domain logic
Claims, provenance, dates, source dependence, inference and case persistence must not depend on CSS, page layout, a particular theme or a specific geographic renderer.

2. Product presentation
Navigation, panels, reader workflows and responsive layouts consume application interfaces. They must not implement provider acquisition or evidence interpretation.

3. Themes
Define a coherent theme interface covering the relevant visual tokens, typography, surfaces, component states and motion.

Distinguish interface themes from globe-rendering effects and product capability selection.

Theme changes must not alter evidence records, provider behavior or domain decisions. Layout variants may require their own components; do not conceal behavioral differences inside scattered theme-name checks.

4. Source providers
Camera, weather, news, imagery and other sources use explicit adapters appropriate to their domains.

Keep provider-specific authentication, protocols, normalization and failure handling inside their adapters. Preserve provenance, observation times, freshness, coverage, attribution and capabilities.

Do not force unlike providers into an interface that loses important information.

5. Geographic layers and tools
Separate source acquisition from visual representation where practical.

Extensions must declare their required services, configuration and lifecycle. Enable, disable and disposal must handle requests, subscriptions, timers and rendering resources correctly.

6. Product composition
Select the layers, tools, providers and UI components required by the product through an explicit composition mechanism.

A reduced product must run without constructing unrelated capabilities or supplying fake implementations merely to satisfy the inherited full catalog.

Hidden controls are not access control. Apply necessary restrictions at the service boundary.

7. Extension trust
Keep executable extensions distinct from declarative scenes and data packs. Submitted reporting and model output must not install plugins, select arbitrary executable modules or expand provider access.

Acceptable demonstration:

- Exercise at least two materially different interface themes without modifying domain or provider modules.
- Add or substitute a provider through its adapter and registration boundary.
- Add or substitute a geographic layer or tool through its declared interface.
- Run a reduced capability configuration without the omitted modules being required.
- Verify lifecycle cleanup and the relevant dependency boundaries.
- Document the exact files changed for each demonstration and explain any remaining coupling.

Deterministic fixture adapters are acceptable for conformance tests, clearly labelled as fixtures. They do not replace the separate requirement to exercise a real supported input and evidence-retrieval path.

Provide concise extension documentation with working examples, required configuration and limitations.

Include these checks in the Gauntlet evaluation. Do not declare extensibility achieved solely because files have been separated or interfaces documented.

Keep the work proportional to demonstrated needs. A general plugin marketplace is not required to satisfy this gate.

DEFINITION OF DONE

The implemented release satisfies all of the following:

1. A person can complete a supported end-to-end journey:
   submit reporting → inspect its interpretation → explore relevant context → examine evidence and uncertainty → save or revisit the resulting account.

2. The supported input modes genuinely work.
   Acquisition failures, unavailable transcripts, unsupported formats and restricted access receive useful, accurate responses.

3. Extracted claims are connected to original wording or timecodes.
   Users can inspect and correct significant interpretation errors.

4. Geographic and temporal presentations are derived from recorded claims and evidence.
   Ambiguous matches remain visible and correctable.

5. The service retrieves relevant evidence from appropriate sources where configured access allows it.
   Retrieved records retain provenance and dates, and failures remain distinguishable from empty results.

6. The interface clearly separates claims, observations and inferences.
   Readers can examine supporting evidence, contradictions, source dependence and unresolved questions.

7. The account can be saved and revisited without silently replacing its recorded evidence with current data.
   Referenced content that cannot be retained or is no longer accessible is handled explicitly.

8. The interface is focused on the reader’s task.
   It works on desktop and mobile, with keyboard access and meaningful alternatives to geographic interaction.

9. The implementation separates ingestion, interpretation, resolution, retrieval, evidence storage, presentation and export sufficiently to permit replacement and further development.
   Document actual boundaries rather than claiming architectural purity.

10. There are meaningful tests and exercised acceptance journeys covering the implemented behavior, failure paths and important security boundaries.
    Real-provider checks and deterministic fixtures are identified separately.

11. The product builds and runs from documented instructions.
    Necessary configuration, supported providers, operating costs and limitations are explained without exposing secrets.

12. Changes are committed and pushed to a development branch, with a reviewable draft PR.
    The clean mirror remains unchanged.

13. The repository records the final implementation, validation evidence, unresolved limitations and next work.
    Completion claims match what was actually exercised.

A demonstrator built entirely from hard-coded fixtures does not meet Definition of Done. Fixtures are valuable for evaluation, but at least one supported real input and evidence-retrieval path must be exercised.

If external access prevents this, finish the independently testable implementation and report the exact incomplete acceptance criterion. Do not disguise the blocker as completion.

DEFINITION OF SUCCESS

Success has three levels. Report them separately.

A. Engineering success
The service completes its supported journey reliably, preserves evidence integrity, handles failures honestly and has reviewable validation evidence.

B. Reader-task success
The experience measurably helps people inspect or interpret reporting.

Before evaluation, define:
- The reader tasks.
- A baseline, such as source-linked reading without the geographic experience.
- The scoring method.
- Acceptance thresholds justified for the experiment.

Evaluate correct interpretation of places and dates, ability to locate evidence, recognition of unsupported claims and unwarranted confidence.

Do not rely only on satisfaction or visual appeal.

Use independent evaluation where feasible. Simulated reader evaluations may reveal defects, but are not evidence of real human outcomes. If a human study cannot be conducted, distinguish engineering completion from the unvalidated reader-benefit hypothesis.

C. Commercial success
A target audience demonstrates a recurring need, willingness to pay, and a delivery model with viable costs.

You may research and document this hypothesis. Do not invent customer validation, market size, conversion rates or revenue.

The immediate assignment is to achieve engineering success and produce evidence sufficient to assess the reader-task hypothesis. Commercial success remains a separate gate.

DEFINITION OF FAILURE

The work fails its acceptance gate if any of these conditions remain:

- Fabricated evidence, citations, confirmations or locations are presented as factual.
- Reported claims are silently promoted to observed events.
- Dates, source dependence or imagery limitations materially mislead the reader.
- Retrieval reinforces the initial account while concealing relevant contradictions or missingness.
- Model instructions embedded in submitted content can escape the intended tool and data boundaries.
- Secrets or private submitted material are exposed through logs, repository files or unintended sharing.
- The product claims support for channels or providers that were not implemented or exercised.
- A generic globe, transcription page or summarisation interface is delivered without the required report-context experience.
- Documentation or screenshots stand in for functioning behavior.
- Tests mirror implementation details while failing to exercise the reader journey and meaningful failure conditions.
- Claimed success exceeds the evidence collected.
- Product changes enter the clean mirror or upstream integration destroys product work.
- Known critical defects are left unresolved while the release is declared complete.

Keep an issue register. Classify unresolved findings by their actual consequence, not by whether they are inconvenient to fix.

GAUNTLET EXECUTION

Use a recursive build-and-challenge process:

Frame the problem and acceptance evidence.
Build the smallest complete implementation that can satisfy the mission.
Challenge it using independent review and adversarial cases.
Repair consequential defects.
Re-run the affected checks.
Reassess the product journey and acceptance gates.

Repeat where new evidence warrants it. Do not perform ceremonial iterations or stop because a fixed number of rounds has elapsed.

Challenge at least:
- Source and evidence integrity.
- Temporal and geographic interpretation.
- Product usefulness.
- Security and privacy.
- Accessibility and usability.
- Architecture and upstream maintainability.
- Operational behavior and cost.

Choose evaluation methods that test different failure mechanisms. An evaluator should inspect actual behavior and evidence, not merely approve the builder’s explanation.

Research findings and implementation decisions should change the plan when justified. Keep the plan current; do not preserve a weak approach merely because it was chosen first.

Do not cripple exploration through premature implementation prescriptions. Equally, do not expand into a general intelligence platform before the core reader journey works.

PERSISTENCE

Maintain /goal, the work plan, decision records, evaluation findings and an issue register in the repository.

Commit useful checkpoints. Before context loss or interruption, record:
- Current branch and commit.
- What works and how it was verified.
- What is unfinished or blocked.
- Decisions and significant assumptions.
- The next concrete action.

Resume from evidence and repository state. Do not restart completed work unnecessarily.

DELIVERY

Return:
- The implemented reader journey.
- Supported inputs and evidence sources.
- How to run and inspect it.
- Branch, commits and draft PR.
- Validation performed, with results.
- Definition of Done status.
- Engineering, reader-task and commercial success status separately.
- Remaining defects, limitations and external blockers.
- Upstream mirror verification.

End with a concise factual handoff in a text code block for the product-planning thread.

Begin by inspecting the repository and environment. Establish the goal and acceptance evidence, then carry the work through to the usable result.
