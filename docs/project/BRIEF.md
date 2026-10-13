# Product brief

## Brief: what to build

A service that accepts reports and presents their geographic/temporal context, explicit claims and supporting or conflicting evidence.

Initial slice: one location-specific article supplied as text or a supported URL, source-linked claims, a map, a timeline and an evidence panel. Clips and transcription follow after this slice works. Any channel/format is the eventual ambition, not an assertion of universal source access.

### Journey

1. Submit a report through a supported input.
2. Review extracted claims alongside exact source spans or timecodes.
3. Resolve places and dates while retaining ambiguity.
4. Retrieve relevant evidence with provenance and observation dates.
5. Explore locations, chronology, contradictions and gaps.
6. Save/share a traceable account of the evidence state.

### Evidence requirements

- Keep reported claims, retrieved observations and service inferences distinct.
- Preserve claim spans, correction history, source identity and known publication/observation/retrieval times. Unknown values stay unknown.
- Do not count several repetitions of one original claim as independent confirmations.
- Overlays must distinguish sourced observations from reported or hypothetical locations. Never present an invented reconstruction as observed movement.
- Proximity does not establish causation or dependence.
- Insufficient evidence is a usable result; do not force a verdict or assign a global truth score to a person/publication.
- Use document/timeline views when geography cannot resolve a report.
- Wikipedia may help orientation/source discovery; inspect and cite underlying sources. A Wikipedia page is not evidence.

## Dossier: why

Spatial context may make reports easier to inspect. Evaluate that hypothesis against ordinary source-linked reading. Visual complexity is not evidence of improved understanding.

## Architecture

Separate ingestion, transcription, claim records, place/time resolution, retrieval, evidence storage, presentation and export. The renderer consumes a presentation model; it does not own evidence or decide truth. AI proposes extraction and explanations with inspectable correction paths.

Audience, initial report category, acquisition rights, models, storage, pricing and deployment remain unresolved. No commercial benefit or misinformation-resistance improvement has been demonstrated.
