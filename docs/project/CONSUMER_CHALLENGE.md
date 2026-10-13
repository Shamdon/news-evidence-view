# Consumer alignment and alternative-design challenge

Independent agent code review and deterministic execution, 2026-10-13. This is simulated engineering evaluation, not a human usability study. Historical first-release review is unchanged.

## Actual checks

Read the continuation assignment, active goal, brief, four-direction protocol, consumer UI/application, generic account model, interpretation/resolution, article/discovery/World Bank/investigation adapters and design implementation. Independently ran account, consumer-application and consumer-service tests: 34 passed; one HTTP-listening test was blocked by the review sandbox (`listen EPERM`), not demonstrated as a product failure. Direct Node probes below exercise wording and correction behavior outside existing tests.

No browser interactions were performed in this review. The coordinating agent owns actual desktop/mobile/browser evidence, real article acquisition and live evidence checks. A live GDELT timeout is an external incomplete discovery criterion, not an empty-result pass or a fixture-backed live result.

## Reproduced consequential findings

1. **Unrelated comparator changes the claim.** `Over three years, Sweden population was 10 million in 2024.` yields `population gt 10000000`, although “over” describes a duration. `Sweden population was 10 million in 2024, with over 5 million adults.` likewise assigns `gt` to the total. Comparators must attach to the matched quantity, or uncertainty must remain. Whole-sentence threshold detection can create erroneous numerical agreement/difference.
2. **Ordinary quantity wording is missed.** `Population of Sweden was 10 million in 2024.` resolves country/year but no measurement. The unresolved fallback is honest, but this common consumer wording is a supported-subject extraction gap.
3. **Clarification cannot repair routing.** Submit `Officials reported Sweden reached a new total in 2024.`, then clarify `Sweden population was 10 million in 2024.`. The correction records population quantity and context but leaves category `general`; the real investigator returns no capability. Route selection must inspect corrected interpretation, or category changes must be recorded with appropriate history.
4. **Prototype partial state conflicts with details.** `renderState('partial')` states the last claim is unassessed but leaves fixture status/evidence unchanged in inline detail, matrix and inspector. Guide claim/next actions call `renderState('ready')`, dropping consequential state. Failure/partial states should affect the displayed read model and survive navigation, rather than only adding a banner.
5. **Demographic subgroup becomes a country total.** `Sweden population aged over 65 was 2 million people in 2024.`, `Sweden had a population of 2 million women in 2024.` and `Sweden had a refugee population of 2 million people in 2024.` each produce a population quantity with no scope uncertainty. Automatic comparison with World Bank country totals would misrepresent what the report asserts. These subsets require explicit unsupported scope or an appropriate separate capability, rather than country-total substitution.
6. **Impossible publication date is normalized into another date.** Public HTML metadata `2025-02-30T12:00:00Z` becomes `2025-03-02T12:00:00.000Z` in `extractArticle`. Validate the supplied calendar and clock components before normalization; unavailable metadata should remain unknown rather than silently manufacture a publication day.

These findings were sent to the implementation owner for repair. Repair verification is recorded below when exercised; neither design appearance nor passing existing tests erases them.

## Independent repair checkpoint

Direct wording probes now retain `eq 10000000` for the unrelated-duration and adult-subcount examples, extract the common `Population of Sweden ...` wording, and mark the three demographic subgroup examples unsupported with no total-population measurement. The mixed total/adult example additionally preserves its subgroup remainder as unassessed.

Re-ran account and consumer-application tests independently: 27 passed. These include the earlier generic routing hint corrected through a population clarification, and a fully valid registered documentary capability completing consumer orchestration, append, save and reopen through unchanged contracts. Those are deterministic conformance results, not live public-policy evidence.

The prototype `claimView` partial-state model now removes usable evidence from the last claim for all three fixtures. Inline detail, inspector and matrix consume that state model, and guide navigation preserves account mode. Direct fixture-model probes passed; the residual raw matrix rendering was repaired and rechecked by code inspection. No browser behavior is inferred from these code/Node checks.

Publication metadata repair passed direct probes: impossible 30 February, `24:00` and minute `60` each remain `null`; a valid timestamp with `+02:00` normalizes to the correct UTC instant. Final independent account/application/service run: 39 passed; one HTTP-listening test remains sandbox-blocked here. All six reproduced findings are repaired in the exercised code paths. No critical independent code/Node finding remains within the declared support scope.

## Actual design differences and cognitive risks

- Question-led review changes the journey into understand/inspect/reflect steps. It reduces initial load but hides nonselected conflicting detail until another action. Preserve missingness across steps and keep original access global.
- Annotated reader places source spans before the inspector and uses a stacked mobile reading flow. Exact wording remains central; its dialog can interrupt comparisons across claims.
- Evidence journey leads with dates and context, then selects claims. Distinct labels prevent publication/event substitution. A chronological list can still suggest a causal chain, so its explicit caveat and absence of invented event location matter.
- Comparison desk provides a semantic relationship matrix and selected detail, with contained horizontal scrolling on mobile. Dependence is visible immediately; readers must still distinguish one family from several confirming organizations. It carries the highest simultaneous information load.

These are materially different interaction hierarchies, not four color variations. All share fixtures and simulated acquisition/state controls. Custom content receives a fallback; no fixture result should be represented as analyzing custom content. Synthetic coordinates are labeled as orientation, unresolved Springfield is unpinned, and reference links explicitly do not confirm synthetic reports. A provisional direction remains a hypothesis pending matched-task browser checks and human evaluation.

## Architecture, integrity and operating boundaries

The ordinary entry submits URL/headline/text and automatic initial investigation without asking for coordinates, providers or date-window parameters. Six initial claims bound acquisition; later claims remain inspectable and unvisited. Population and seismic use the same generic account/measurement/period/source-family/correction/snapshot contract. Documentary public-policy records can fit the schema without changing presentation or provider identities. Capability registration is trusted code; report text cannot install modules or authorize fetch targets.

The article adapter validates HTTPS targets, public DNS sets, pinned connection addresses and redirects; checks content/stream size/timeouts, strips executable/UI HTML and recognizes declared restricted pages. Submitted text is not sent to model execution. External evidence APIs receive generated constrained parameters; deliberate headline discovery transmits its index query and article acquisition contacts the selected publisher. Claims are submitted to the loopback service, which does not persist accounts. Explicit browser save/export remains unencrypted. These are concrete boundaries, not a guarantee of universal safety or article completeness.

Country mentions are context without inferred event coordinates. Actual seismic investigator support is currently Turkey/Syria country boxes or previously recorded points, with bounded single UTC-day search. The separate resolution planning helper has broader country envelopes/date expansion, but its test does not establish those behaviors in the live investigator. World Bank annual estimates may use different reference dates/methods and reuse national statistics; comparison is conditional context, not independent confirmation. General allegations remain unassessed.

Provider-registration testing should include a fully schema-valid third-category capability through consumer orchestration, append/save/reopen. A minimal fixture return that cannot be persisted proves dispatch only. Documentation must reflect new dependency acquisition (`linkedom`), modes, privacy and live routing; historical manual-USGS/setup-only run instructions cannot describe the new default entry.

The added documentary capability roundtrip described above now satisfies the deterministic registration-to-persistence demonstration. The root/news READMEs and issue register were still historical at this review checkpoint; their alignment must be verified in final delivery.

## Remaining acceptance gates

Outcome A requires recorded real public article acquisition plus automatic evidence, materially different subjects, corrected clarification routes, saved as-of reopen, security/lifecycle/build/boundary checks and desktop/mobile/keyboard journeys. Headline live discovery remains externally blocked until actually retrieved and selected. Unsupported video/audio, arbitrary languages, access-restricted or nonreadable pages and uncovered evidence categories must stay explicit.

Outcome B requires matched tasks across all four alternatives, consequential states that function coherently, desktop/mobile/keyboard evidence, source-backed implications, a justified provisional choice and working recommended consumer integration. This review supplies code/Node defects and architecture scrutiny; it does not substitute for those browser checks. Human reader benefit, misinformation resistance and commercial demand are unvalidated. Overall completion additionally needs pushed commits/draft PRs, reproducible previews, unchanged mirror and truthful goal/issue/handoff records.

Precise external incomplete criterion: live headline discovery-to-candidate-selection is not established because the GDELT request timed out. The adapter exposes `error`, not `empty`; a controlled candidate fixture proves only interface/selection handling. Supported URL and text entry may complete independently. Final root evaluation must separately record real article/evidence and browser/design results, full authorized HTTP/build/boundary checks, documentation reconciliation, publication and mirror verification. None is claimed solely from this independent review. Human comparative evaluation remains unperformed, with the runnable protocol as the handoff for that separate success gate.
