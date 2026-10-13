# Four consumer interaction alternatives

Date: 2026-10-13. Preview gallery: `http://127.0.0.1:4178/design/index.html`. Keep the existing live service runnable. These prototypes use deliberately invented report/evidence fixtures; they do not retrieve or assess custom content. The label is persistent, including while inspecting evidence. No external reference documentation is represented as confirming a synthetic report.

## Evaluation protocol defined before comparison

Baseline: source-linked reading alone, showing the same complete synthetic original text and reference-document links, without claim organization, interpretation, map or timeline. Use the source wording dialog and reference documents as the reproducible content baseline; a human study must randomize presentation order, use separate equivalent texts to avoid carryover, and provide matched time limits.

Run the same tasks for baseline and each direction, for earthquake, population and hostile/unresolved examples:

1. Identify one precisely worded claim and open its original wording.
2. Explain the evidence relationship and what the evidence does not establish.
3. Identify dependent repetitions or revisions rather than counting them as independent confirmation.
4. Distinguish event/reference period, publication and recorded snapshot dates.
5. Explain whether the place is resolved and whether geographic proximity establishes causation.
6. Find the unsupported-input fallback; resolve headline selection through an explicit candidate choice.
7. Record a targeted clarification; save/reopen the unchanged synthetic account.
8. Use only keyboard at desktop and complete claim/source inspection at 390px viewport.

Task scoring: 0 = wrong/unavailable, 1 = partial/requires explanation, 2 = independently correct and traceable. Record time, wrong turns, unsupported conclusions and assistance. Critical integrity errors (synthetic data interpreted as retrieved, unresolved treated as false, dependent sources counted as independent, hostile instructions executed, fabricated location) fail the direction regardless of total score. Engineering acceptance: all interactions executable, all critical errors absent in exercised behavior, no trapped keyboard focus, mobile controls reachable. Provisional human-study threshold: at least 80% of participants complete tasks 1–7 without assistance and zero critical integrity errors; task correctness must not decline against baseline. This is a conservative product target, not a statistically powered proof; recruit diverse literacy/access needs, specify power/sample before inferential testing, and revise threshold with observed baseline variance.

Record evaluator type explicitly. Builder inspection and simulated task walkthroughs can expose defects but do not measure real reader outcomes. Independent browser evaluation is requested separately; its results must be recorded with actual viewport/actions, not inferred from this document.

## Directions

| Direction / preview | Interaction hypothesis | Desktop / mobile | Strength / tradeoff |
| --- | --- | --- | --- |
| [Question-led review](/design/index.html?direction=guide) | Readers can move from “what does it say?” to one inspectable claim, then reflect on missing evidence. | Three named steps; wide context cards become one column. | Manageable first view; extra transitions can hide a contradiction until selected. |
| [Annotated reader](/design/index.html?direction=document) | Keeping exact wording central reduces loss of source context. | Original account with claim-margin detail; stacked original and detail on mobile, inspector for source/evidence. | Source closeness; long text can overshadow evidence and mobile loses side-by-side comparison. |
| [Evidence journey](/design/index.html?direction=journey) | Separating event/reference and publication/retrieval times helps identify revisions and outdated context. | Chronology leads, claims alongside; chronological list precedes claim inspection on mobile. | Strong temporal orientation; time sequence risks a causal reading and is less useful for claims without dates. |
| [Comparison desk](/design/index.html?direction=matrix) | Readers comparing contradictions benefit from seeing claim and source dependence together. | Semantic source-family matrix; contained horizontal table scrolling on mobile plus stacked selected detail. | Contradiction/dependence overview; larger cognitive and mobile navigation burden. |

All four include controlled submission, manually advanced loading preview, available/partial/unavailable/ambiguous states, selected-claim evidence inspection, original source wording, external reference documentation, candidate headline report choice, unsupported-media/custom-input fallback, targeted clarification, local save/reopen and night/paper themes. Layout changes alter workflow and hierarchy rather than only styling. Fixtures are shared and remain domain-independent. Geography uses inherited public-domain Natural Earth country geometry from `/assets/countries.json`, with exact illustrative coordinates and explanatory text. The outlined coordinate is orientation/candidate context, not an observed event pin or evidence of impact. If the background fails, textual context remains. Springfield remains unpinned.

## Architecture and design system

`news/design/fixtures.js` owns synthetic comparison data; `app.js` owns presentation state and selected-direction workflow; `style.css` owns themes and responsive composition; `index.html` owns semantic shell. No imports from provider/domain modules are needed. `geography.js` renders inherited public-domain country geometry without changing fixture evidence. This is deliberately separate from production acquisition and persistence. There is no fake network fetch or timed fake model processing.

Tokens: background, surface, raised, text, muted, border, accent, reported, observed, focus, heading-font, body-font, motion. Theme selectors only change document theme. Native interaction targets are at least 44px. Typography uses existing system fonts/Georgia with no remote assets. Color never carries uncertainty alone. No documentary imagery, counterfeit publisher branding or unlicensed cartography is introduced.

Integration work for the chosen direction: replace fixture intake with real acquisition/discovery result state, supply immutable application account/read models to claim and source views, retain provider-specific attribution and snapshot dates, adapt clarification into a recorded assertion/correction flow, and use production persistence instead of the prototype-only browser fixture key. Never import synthetic fixtures into real service orchestration.

## Comparison checkpoint (builder assessment; not reader study)

The protocol above preceded the assessment. Static behavior/code walkthrough favors question-led first contact because original-source access remains global and evidence details need one explicit claim selection. The annotated reader favors deep wording inspection. Journey is strongest for revision chronology. Matrix makes dependence visible immediately but requires horizontal navigation on narrow screens. This is a design judgment; actual browser and independent task evidence may change it. No human benefit has been measured.

Provisional recommendation: question-led entry and short summary, with an annotated claim/evidence detail view and optional chronology/context. Preserve the full four directions. Do not make the matrix or globe the default consumer entrance. Integrate real behavior incrementally and re-evaluate headline ambiguity, ordinary article acquisition and incomplete evidence; the recommendation is reversible and is not owner approval.

## Consequential-state repair after independent review

Independent code/UI review identified that the partial-state banner initially left the last claim's existing evidence visible, and guided navigation could reset the chosen state. Repaired the shared `claimView` presentation model: partial accounts retain original wording but remove the last claim's usable evidence, status and source-family display, explicitly marking it unassessed. Both inline detail and inspector read this model; the matrix does too. Guided claim selection and next/previous transitions preserve the selected account state. Save/reopen now preserves that state.

Executed `node --test news/design/test.mjs`: six checks passed across all three fixtures. They verify removal of unusable evidence, retained available evidence, unchanged fixture snapshots and restoration when returning to ready. Syntax check passed. These are executable model checks; they do not establish browser behavior or human comprehension. Root browser review remains the separate integration verification.

## Primary browser comparison evidence

All four population journeys reached overview and selected detail; earthquake and hostile/unresolved examples in every direction exercised partial, unavailable and ambiguity states. Four headline fixture journeys required explicit choice and displayed the original-unavailable fallback. Annotated missing evidence was absent from both inline and native inspector; matrix missing evidence was absent from its source-family row. Guide save/reopen retained partial mode. At 390×844 every document measured 390px wide; the matrix retains a deliberately contained scroll area. Both themes were exercised. Evidence-dialog Tab remained inside, Escape closed it and returned focus to the inspection control. This is targeted primary browser evidence, not a full accessibility audit or participant study.

These observations support preserving a simple question-led entrance and source-close annotated detail as the reversible working direction. Chronology remains optional; the matrix remains a deeper comparison tool. No numerical human-task scores are assigned to builder actions. Screenshots are retained in local handoff outputs, and EVALUATION.md records exact limits.
