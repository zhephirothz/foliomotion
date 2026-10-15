# Proposed data contracts

These are conceptual contracts, not implemented types, migrations, or API specifications. Use a shared runtime validator when implementation begins. Keep contracts versioned and JSON-serializable; reject unsupported schema versions explicitly.

## Entities

| Entity | Important fields | Invariant |
| --- | --- | --- |
| Project | ID, owner, title, summary, audience, problem, role, contributions, evidence, links, draft revision | User facts are preserved separately from generated copy |
| Asset | ID, owner/project, object key, hash, MIME type, dimensions, byte size, status, derivatives | Ready means successfully validated and decodable |
| Brand profile | Colors, font IDs, logo asset, author/contact, theme version | Fonts/logos must be available to preview and renderer |
| Storyboard revision | ID, project revision, schema version, output profile, ordered scenes, audio choice | Saved revisions are immutable |
| Render snapshot | Storyboard, asset hashes, resolved timing, template/bundle version, runtime info | No mutable draft lookups during rendering |
| Render job | Snapshot ID, idempotency key, state, attempt, lease, progress, error, output IDs | At most one accepted terminal result per attempt chain |
| Export artifact | Job ID, object key, checksum, format, dimensions, duration, poster, created time | Only verified outputs are downloadable as successful |
| Publication | Slug, selected artifact, public case-study revision, published time | References a successful artifact owned by the project owner |
| AI suggestion | Source revision, provider/model, prompt version, suggestions, evidence references, review state | Never becomes accepted copy just by being generated |

## Facts and evidence

Keep `role` explicit: designed UI, implemented frontend, built API, integrated payments, or another user-confirmed contribution. Store each contribution as a separate fact with an optional supporting screenshot, link, or note. Team projects must not automatically become claims of sole authorship.

An outcome can be quantitative only when the owner supplies the value, unit, context, and supporting basis. “Reduced checkout abandonment by 20%” needs evidence; a checkout screenshot supports “Built a checkout flow,” not a measured conversion claim. When no result is supplied, emphasize completed capabilities or design decisions.

## Scene contract

Each scene has a stable ID, kind, asset references, headline, optional supporting text, duration in integer frames, transition out, and layout options. Suggested kinds: hook, project-overview, feature-detail, contribution, evidence, and CTA. Keep the initial set small; not every story needs every kind.

Crop configuration should use normalized source coordinates, a focal point, and a fit mode. Store crop intent independently for landscape and portrait when necessary. A feature callout may include an anchor within the screenshot, but the label's final position must also obey output safe areas.

A scene references an allowed template/layout identifier, never arbitrary JavaScript, HTML, CSS, component imports, or remote executable code. Restrict colors, font choices, and motion settings to validated values rather than unbounded style injection.

Use an explicit distinction between marketing overlay text, narration script, and timed subtitles. In the MVP, overlay text is sufficient. Subtitles later need start/end timestamps and language metadata; do not imply that changing a headline automatically changes a recorded voiceover.

## Timing and output profile

Output profile contains width, height, fps, format/codec settings, safe areas, and template compatibility. Start with 1920×1080 at 30 fps. Add 1080×1920 after creating a dedicated portrait layout. A portrait export is not just a center-cropped landscape export.

For overlapping transitions, calculate scene start times cumulatively, subtracting the previous transition overlap. Each overlap must fit within both adjacent scenes, and incoming plus outgoing overlap must leave the scene's required readable hold. Hard cuts have zero overlap. Round timing to integer frames once in the planner and share the resolved values everywhere.

The story's intended duration and computed render duration should be visible to the editor. If an edit exceeds the template's duration budget, offer to shorten copy, reduce scenes, or extend duration; do not silently truncate the ending.

## Validation layers

1. Structural: types, required values, known IDs, version, numerical ranges, serializable values.
2. Referential: every scene asset exists, belongs to the project, is ready, and has retained bytes.
3. Editorial: factual claims have sources; CTA exists; a feature has evidence; role is clear.
4. Layout: text fits with approved fonts; crop preserves the intended detail; overlays stay within bounds.
5. Temporal: valid durations, no unintended gaps, transitions fit, final CTA is readable.
6. Export: profile supported, template version exists, fonts/assets load, output can be decoded.

Structural validity cannot prove editorial quality or prevent every overflow. Keep visual review and actual exported playback in the acceptance process.

## Proposed API responsibilities

| Operation | Behavior |
| --- | --- |
| Create/update project | Authenticate, validate facts, use optimistic revision checks |
| Request/complete upload | Scope access; verify stored asset before readiness |
| Generate storyboard | Build a deterministic draft from current facts/assets |
| Save storyboard | Validate, increment revision, retain prior saved revision |
| Request AI suggestions | Explicit optional operation; identify source revision |
| Request render | Freeze snapshot; deduplicate identical submission key |
| Read/cancel job | Authorize owner; persist state independently of browser |
| Download export | Issue access only for authorized successful output |
| Publish/unpublish | Update public revision deliberately and atomically |

Use a conflict response when a save targets an outdated revision. A retry with the same idempotency key and same request should return the existing job; reuse of that key with different inputs should fail clearly. Return categorized errors with actionable messages, keeping raw worker traces private.

## Evolution and reproducibility

Store schema version, template version, asset hashes, and relevant dependency/runtime identifiers. New template versions should not silently alter old exports. To reproduce an old render, retain its compatible bundle and inputs or clearly mark reproduction unavailable. Migrations should create new revisions rather than mutating historical snapshots.

A future project export/import feature should include facts and a manifest, omit secrets, and validate every imported asset and field. This is deferred; it is not a reason to build a general serialization framework now.
