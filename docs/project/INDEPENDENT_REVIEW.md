# Independent challenge review

This is an agent code review and simulated reader challenge, not a human outcome study. It does not establish reader benefit, misinformation resistance or demand.

## Checks performed

- Read the assignment, goal, inherited lifecycle/source boundaries and new domain, controller, persistence, provider, HTTP, composition and presentation implementation.
- Reviewed official USGS catalog API, GeoJSON schema and catalog search workflow: https://earthquake.usgs.gov/fdsnws/event/1/, https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php, https://earthquake.usgs.gov/earthquakes/search/.
- Used native Chrome through CUA in a separate tab. Browser-provider inventory was unavailable. Opened a separately titled challenge account with a magnitude/date statement, magnitude range, relative date/ambiguous place, and script/instruction-like source text.
- Verified visibly that exact source text remained available, four source-linked statements appeared, the single ISO date and magnitude were proposed, the magnitude range and relative date remained unresolved, and script-like content appeared literally.
- Submitted a bounded live catalog query (2023-02-06, centre 37.2/37, radius 30 km). The UI showed pending retrieval. The final result was not independently observed because native interaction reported that the app had changed and shell access to the existing server failed. This review does not claim that path passed.
- Ran direct Node domain probes for URL-containing wording and same-source measurement disagreement.
- Ran the domain and service Node tests independently: 23 passed; four HTTP-listening tests were blocked by this review environment's `listen EPERM` sandbox restriction. Those four are neither verified passes nor demonstrated product failures here.

## Findings sent for repair

1. **Consequential source-span omission:** `Read https://example.com/article for evidence.` produced only `com/article for evidence.` as a proposed statement. The sentence regex dropped the prefix around nondecimal periods. Original text remained accessible, but interpretation omitted meaningful wording. Repair requires contiguous source coverage and URL/abbreviation cases, not only checking that each surviving span is internally valid.
2. **Same-source discrepancies underdescribed:** a reported magnitude 9.0 with a USGS source URL compared with a retrieved magnitude 7.8 returned only a dependency assessment. Dependence and measurement difference are separate dimensions and should both remain inspectable.

## Independent repair verification

Re-ran direct Node probes against the repaired working tree. The complete URL sentence is now retained with an exact matching source span. A USGS-source report with magnitude 9 on 2023-02-06 compared with a USGS record of magnitude 7.8 on 2023-02-07 now explicitly describes both disagreements alongside the same-source dependency and conditional-event-identity caveat. Both reported defects are repaired in the exercised paths.

Also attempted to replace `getState().current.source.text`; the assignment throws a `TypeError` and the original text remains unchanged. Application snapshots are recursively frozen at assignment. Independently re-ran the domain and application tests: 26 passed, zero failed. These are deterministic engineering checks, not real-provider or human-reader evidence.

## Remaining limitations and challenges

- Geographic context uses simplified public-domain boundaries and coordinates, with no acquired imagery or implied shaking footprint. Query radius is described as text; country labels are primarily hover titles. This is orientation, not event reconstruction or location verification.
- Negative magnitudes and complex attribution/abbreviations require conservative interpretation or reader correction. An explicit unsupported extraction limitation is preferable to inventing values.
- Imported JSON schema/provenance validation cannot authenticate the claimed upstream source; its disclosure must remain visible.
- The new entry avoids the inherited eager full catalog and global provider defaults. Composition uses trusted code registration and finite geographic modes. Provider acquisition remains outside presentation and the domain uses serializable records. The previously identified mutable application snapshot exposure was hardened and independently checked as described above.
- Host/Origin allowlisting, fixed endpoint reconstruction, redirect rejection, bounded query/body/response sizes, rate limits, local-only persistence, inert text rendering and request abort ownership are concrete implemented controls. Tests cover important boundaries; this review did not independently exercise all HTTP security checks against the running server.
- Independently unexercised browser paths: saved snapshot reopen, official acquisition, both themes, coordinates/off composition, mobile layout and complete keyboard journey. Their evidence must come from actual separate checks, not this review.

## Interpretation

The design offers a useful inspectable account beyond catalog search: original wording, correction history, candidate context, as-of snapshots and explicit unresolved claims. A single catalog remains one source family. Numeric agreement is conditional context, missing records are not disproof, and source dependence does not eliminate the need to show disagreement.

Within the explicitly supported earthquake scope, this independent review has no unresolved critical finding after the exercised repairs. This conclusion covers reviewed code and enumerated checks; it does not expand the recorded browser verification or validate human or commercial success.
