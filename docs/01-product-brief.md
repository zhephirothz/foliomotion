# Product brief

## Outcome and audience

The product should make your work understandable within the first few seconds and give interested clients enough evidence to start a conversation. The video creates attention; the case study explains the work in detail. Neither should depend on exaggerated claims or unreadably fast effects.

There are two audiences. You, the creator, need a fast way to turn existing project material into polished presentations. A prospective client needs to identify your capabilities, your actual role, the quality of the work, and a relevant next step.

**User requirements:** screenshots plus descriptions become Remotion videos; videos feel punchy; AI assistance is optional; this phase is documentation only; other agents must be able to continue from the documentation.

**Recommended assumptions:** one owner initially, private drafts, English copy initially, desktop-oriented creation, mobile-friendly public portfolio, manual publishing, and one project per initial video. These are adjustable defaults, not confirmed user preferences.

## Creator journey

1. Create a project: name, short summary, audience/problem, your role, specific work completed, optional verified outcomes, and destination link.
2. Upload screenshots. Give each a short label explaining what it demonstrates. Reorder them and select a focal region when the full image would be too small.
3. Choose the video's purpose: project spotlight first; portfolio montage later. Select visual theme and output format.
4. Generate a deterministic first storyboard from the supplied facts. No AI is necessary: a fixed hook, overview, feature, contribution, and CTA structure is enough.
5. Edit scene copy, screenshot assignment, crop, order, and duration. Optional AI offers alternatives without replacing accepted edits.
6. Preview immediately. Surface concrete problems such as missing images or text overflow next to the relevant scene.
7. Export a saved revision. Display job progress, failure reasons, and a retry action. Editing may continue while the saved revision renders.
8. Review the exported file, choose its poster, download it, and explicitly publish a selected version to the portfolio.

Do not require a general-purpose timeline editor in the first release. A scene list with clear controls gives enough flexibility while keeping the authoring experience approachable.

## Public portfolio

| Surface | Recommended content | Intended visitor action |
| --- | --- | --- |
| Home | Clear capability statement, selected reel or strongest project, featured work, contact CTA | Recognize fit and explore |
| Project index | Poster images, short project titles, capability/category labels | Pick relevant evidence |
| Project detail | Video, problem, your role, features delivered, evidence, selected screenshots, technology summary | Understand the contribution |
| About/contact | Working style, services, contact link, availability if maintained | Start a conversation |

Use a real HTML heading and description around each video. Important information must remain accessible without playback. Prefer a poster and user-initiated playback; if a short hero loop is later enabled, make it muted, easy to pause, and sensitive to reduced-motion preferences. Keep a static fallback. Do not autoplay several project videos at once.

Project cards should communicate outcomes or capabilities, not just a list of frameworks. Technology details belong in the supporting case study. A link such as “Discuss a project like this” is more actionable than a decorative end screen alone.

## MVP scope

Include project CRUD, screenshot upload and validation, per-screenshot labels and crops, one theme, deterministic storyboard generation, manual scene editing, Player preview, saved revisions, asynchronous MP4 export, poster generation, render history, and explicit publication to a basic public project page.

The first visual proof should use 3–6 screenshots, 20–30 seconds, 1920×1080, and 30 fps. Proposed upload caps are 10 screenshots per project, 20 MB per file, and 40 megapixels per image, subject to measurement. Accept JPEG, PNG, and static WebP first. Reject unsupported formats with a useful message. These limits are product proposals, not Remotion restrictions.

Defer arbitrary user-authored templates, screen recording, voice cloning, automated website scraping, collaboration, billing, multi-tenant SaaS, freeform timeline editing, AI video synthesis, music search, automatic social posting, and template marketplaces. Add screen recordings later if real interaction needs to be demonstrated; screenshots alone cannot prove an interaction or backend behavior.

## UX states and recovery

An empty project should explain what material is needed. Partial uploads should retain successful files and offer retry for failed ones. A missing screenshot should identify affected scenes. Autosave should show saving/saved/failure and preserve unsaved text. A completed export of an older revision should remain downloadable and clearly identify its revision. Failed export must not erase the draft. Publication should show which revision is live and permit rollback to a previous successful output.

## Success measures

Measure creator time from complete inputs to first acceptable preview; record render success rate and time separately. Suggested initial usability target: a first-time owner can prepare and export a simple project without editing source code. Benchmark performance before promising a render-time SLA.

For the public site, evaluate whether someone can explain what you built and your contribution after viewing. Optional analytics can measure project opens, video starts/completions, and contact clicks. Treat attention and inquiries as signals rather than proof that video alone caused a business result.

Before visual implementation, collect one real project with representative screenshots and truthful notes. Its constraints should shape the template more than placeholder marketing copy.
