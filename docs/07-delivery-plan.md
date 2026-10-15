# Current workspace update — 16 October 2026

The product is now free to use without an account or project-count tier. Projects, categories, and screenshots auto-save in the current browser profile through IndexedDB; they do not sync between devices. Firebase Authentication and cloud project storage have been removed from the app. The previously provisioned Firebase data and rules are left intact and are documented as legacy in [workspace storage and Firebase history](08-membership-and-firebase.md). No site has been deployed.

# Delivery plan and agent handoff

## Current status

The local prototype is implemented. It has a six-scene Remotion composition, live Player, unlimited local projects, editable project name/headline/summary/role/category, ordered PNG/JPEG/WebP screenshot uploads (up to ten per project, 20 MB each), IndexedDB workspace and asset persistence, a portfolio preview surface with a selectable work index, caption drafting from typed notes, and client-side MP4 export for supported browsers. There is no hosted project backend or publication service. Optional hosted inference runs through the local AI gateway.

Dependencies are managed with Bun and pinned to Remotion 4.0.535 across the Remotion packages. `bun run build` is the production build command. No exported MP4 has yet been generated or played through. The browser UI was opened and visually inspected; the first-frame blank issue was fixed, and displayed scene timings were aligned with composition cuts. The build reports a large lazy-loaded WebCodecs/encoder chunk warning. No model/provider or upstream Remotion skills were installed.

Browser rendering is available through `@remotion/web-renderer`, stable from v4.0.491, with WebCodecs-dependent format support and documented telemetry. Check actual browser support before export. Draft assets remain in the current browser profile and are not available to another device or visitor.

## Dynamic video length, image captions, and page placement update

The film duration is now fully dynamic and calculated from the attached images:
- **Per-Image Duration (0.5s – 3.0s)**: Each screenshot has an interactive hold slider and quick preset pills (0.5s, 1.0s, 1.5s, 2.0s, 2.5s, 3.0s). The total video duration in frames and seconds is computed dynamically across the Player preview, timeline inspector, and browser MP4 export.
- **Per-Image Captions**: Creators can write dedicated captions for each screenshot (up to 84 characters) to highlight interface thinking, feature details, or specific outcomes.
- **Procedural Generative Page Composition**: Instead of rigid manual alignment toggles, layouts are automatically and procedurally randomized with high-end editorial balance:
  - Generates organic card rotations (-3.8° to +3.8°), scale, subtle organic card offsets, layered decorative backing plates (magazine moodboard style), and contextual badge placements.
  - Features 5 editorial composition archetypes: *Editorial Right*, *Editorial Left*, *Hero Showcase*, *Magazine Spread*, and *Staggered Focus*.
  - A tactile "Re-roll layout" button per image and a global "Re-randomize all layouts" button let creators effortlessly generate fresh, balanced visual arrangements.
  - Deterministically seeded per screenshot ID/seed to ensure zero frame jitter during playback, direct seeking, and MP4 rendering.
- Up to 10 screenshots per project are supported with full reordering, deletion, and IndexedDB persistence.

## Category master data update

Categories for projects and individual slides are now managed as user-configurable **master data**:
- **Master Data Management**: A dedicated Master Data modal allows creators to add new custom categories, rename existing categories (with automatic cascading updates across all projects and slides), delete obsolete categories (with a minimum 1 category guardrail), and reset to standard defaults.
- **Project & Slide Flexibility**: Categories can be chosen at the project level, and overridden on individual slides so different screenshots can showcase distinct disciplines (e.g., Brand & identity, Web experience, Product design).
- **Video & UI Integration**: The active category is dynamically stamped in the Remotion video header (`FM / CATEGORY`) and sticker badges (`01 · CATEGORY`), matching the slide's specific discipline.
- **Persistence**: Stored locally in `localStorage` under `folio-motion-categories-v1`, keeping user categories preserved across sessions without requiring server or account setup.


## Screenshot sequence update

A project stores an ordered list of screenshots. The creator adds them one at a time, can move them earlier or later, and can remove one independently. Each image is stored under its own stable ID in IndexedDB; localStorage keeps only project copy and image metadata. The original single-image browser draft is read as a legacy first screenshot so existing work remains available. The same composition handles live preview and browser export. The sample sequence remains when no screenshots are attached.

## Studio design update

The studio uses a consolidated, readable stylesheet rather than layered font-size overrides. Form inputs are 16px, primary controls have at least 46px height, and the project editor has more horizontal space. Wide screens keep the preview visible alongside the form. At 1250px and below, the preview and form stack; at 760px and below, navigation moves above the workspace and project switching remains available. Scene cards use three columns, dropping to two on the smallest screens. Local AI settings retain LM Studio as the default and expose their expanded state to assistive technology.

The production build passes. Dynamic timing, alignment variations, and per-image editing controls were verified.


## Per-slide AI update — 15 October 2026

AI Settings supports named LM Studio, Ollama, OpenAI, Gemini, Claude, Grok (xAI), and OpenRouter connections. Projects save an independent AI mode and provider selection. Each attachment stores its own source description and editable accepted headline; generation presents options for that slide only. Hosted keys pass through a local Vite gateway and remain in server memory. See [Optional AI](06-optional-ai.md) for the prompt, persistence rules, runtime limitations, and verification details.

## Decision register

| Decision | Status | Reason / when to revisit |
| --- | --- | --- |
| Documentation-only current phase | User requirement | Advance when user requests implementation |
| Screenshots plus notes produce video | User requirement | Core product workflow |
| AI optional | User requirement | Manual path remains complete |
| Private studio plus public portfolio | Recommendation | Separates authoring from client viewing |
| One owner first | Assumption | Revisit if other creators need accounts |
| One shared Remotion composition for current preview/export | Implemented | Same input props drive Player and browser render |
| Trusted templates, no generated code | Recommendation | Predictability and bounded execution |
| One 20–30-second landscape template first | Recommendation | Validate storytelling with narrow scope |
| Node render worker for hosted MVP | Recommendation, not implemented | Consider when durable hosted projects and public delivery are added |
| Browser export as an optional profile | Alternative | Choose after compatibility testing |
| React/TypeScript; Next.js candidate | Recommendation | Share composition code and public/studio application |
| User-configurable category master data | Implemented | Replaces hardcoded categories with local master data CRUD and slide overrides |
| Hosted PostgreSQL and object storage | Recommendation | Durable revisions and media identity |
| No provider or deployment commitment | Open | Needs budget and hosting preferences |

## Milestones after implementation is requested

### 1. Validate the visual concept

Collect one actual project, 3–6 screenshots, the user's role, factual notes, and a CTA. Implement only the shared story contract and one composition with manually supplied inputs. Produce a local preview and an exported file. Inspect the entire export and scene/transition frames.

**Exit:** the user can understand the project, contribution, and CTA; screenshot details and text are readable. Record actual render time and memory observations. Do not build upload infrastructure before confirming the template can present real work convincingly.

**Progress:** first composition and local studio exist. A real user screenshot and a completed MP4 review are still needed.

### 2. Add manual authoring

Build project inputs, asset validation, scene list editing, crop controls, saved revisions, and Player preview. Share planner/validation logic. Establish meaningful error states and autosave conflict behavior.

**Exit:** an owner can upload screenshots, edit captions, reorder scenes, reload the app, and recover the saved storyboard without touching source code. Missing/invalid images fail clearly. No AI credentials are required.

### 3. Make export durable

Add immutable snapshots, persistent jobs, a worker, bounded retries, progress, cancellation, posters, and downloads. Start with low concurrency. Verify font and asset loading in the actual worker environment.

**Exit:** refresh does not lose a job; duplicate submission does not produce duplicate accepted work; a worker crash can recover; edits do not alter an in-flight export; expired access can be refreshed or staged safely; failed renders preserve drafts.

### 4. Publish the portfolio

Add public project pages, curated cards, contact path, metadata, and accessible video playback. Publish selected successful revisions. Separate public material from private originals and notes.

**Exit:** an unauthenticated visitor sees only published content; mobile playback and poster fallback work; the page communicates the contribution without video; unpublish and rollback behave as described.

### 5. Add optional AI and format variants

Implement one provider mode first according to the owner's preference. Evaluate text-only suggestions before screenshot understanding. Introduce portrait layout as a separately reviewed profile. Add voiceover, montage, or additional templates only after demand is clear.

**Exit:** provider failure does not block authoring/export; claims stay grounded; manual edits survive suggestions; portrait copy and crops remain readable.

## Meaningful verification plan

| Area | Cases worth testing |
| --- | --- |
| Contracts | Unknown scene kinds, invalid references, cross-owner assets, unsupported schema versions |
| Timing | Zero/negative durations, overlaps longer than scenes, adjacent overlaps consuming hold time, final frame |
| Editorial | Missing outcome, team contribution, unsupported metric, very long headline |
| Media | Corrupt image, huge dimensions, tall page, low resolution, transparency, unavailable font |
| Rendering | Direct seek, full playback, preview/export comparison, missing/stale asset access |
| Jobs | Duplicate delivery, retry exhaustion, worker crash, lease takeover, cancel/complete race |
| Persistence | Concurrent save conflict, stale AI result, edit while rendering |
| Access | Unauthenticated studio access, asset/job enumeration, private URL leakage, publication isolation |
| Public site | Small screen, keyboard controls, reduced-motion behavior, no-playback fallback |

Use unit tests for pure timing/validation invariants, integration tests for persistence and job transitions, and visual/export checks for presentation. Do not replace actual playback with snapshot tests of component structure. No tests are required for speculative code that has not been built.

## Main risks and responses

| Risk | Practical response |
| --- | --- |
| Attractive animation but unclear work | Start with real facts and client comprehension review |
| Tiny screenshot UI | Use crop-aware layouts and separate mobile composition |
| Unreliable previews/exports | Share inputs/planner/fonts; verify the final file |
| Excessive scope | Ship one template and a scene editor before freeform editing |
| Rendering cost or instability | Measure representative jobs; cap concurrency and inputs |
| Unsupported AI claims | Fact references, explicit acceptance, manual fallback |
| Private client material exposed | Private originals, redacted derivatives, explicit publishing |
| Stale upstream assumptions | Recheck chosen version's docs, license, and browser constraints |
| Local AI inaccessible from hosted app | Choose the topology deliberately; defer companion bridge |

## Information useful before implementation

The next conversation should establish the first representative project, visual references/brand, preferred contact destination, whether authoring is local or hosted, a rough operating budget, and whether landscape or social portrait is the priority. These are product decisions; do not ask for API keys in chat. AI provider choice can wait until the core manual experience works.

## Next-agent starting procedure

Read the root README and AGENTS.md, then this decision register. Inspect the current workspace again because implementation may have happened after this document was written. Read only the domain documents required by the new user request. Use the `portfolio-remotion` skill if available. Recheck official Remotion APIs before installing/pinning dependencies.

When the user requests implementation, begin with milestone 1 unless they explicitly choose another scope. Report actual files changed, verification performed, limitations found, and the next bounded milestone. Update proposed decisions to accepted/implemented only when supported by the work or user instruction.

## Planning completion checks

The documentation should have working local links, consistent terminology, a clear phase boundary, traceable technical sources, and a discoverable validated skill. Application performance, design quality, and render correctness remain unverified until implementation. Do not turn completion of this document into a claim that those milestones are complete.
