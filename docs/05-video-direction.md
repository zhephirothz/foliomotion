# Video direction and editorial system

## Creative objective

Make the client understand the project quickly: what it is, what you contributed, and why that contribution is relevant. “Punchy” means a clear first impression, purposeful changes of scale, and concise copy. Constant motion makes screenshots harder to inspect and weakens the evidence.

Start with the strongest finished screen and a specific headline. Avoid a long logo intro. Let the screenshot remain the main subject; decoration should frame it rather than compete with it. A restrained, consistent template will be more reusable than a large collection of unrelated effects.

## Example 24-second story

The following is an illustrative structure, not claims about an actual user project. It uses hard cuts for simple timing: 720 frames at 30 fps. If crossfades are added, recalculate duration using the shared overlap convention.

| Time | Frames, inclusive | Scene | Copy intent | Visual treatment |
| --- | --- | --- | --- | --- |
| 0–3 s | 0–89 | Hook | “A clearer way to browse the collection” | Strongest screen, quick controlled reveal |
| 3–7 s | 90–209 | Context | Explain who the site serves and the problem | Full screen in a restrained browser frame |
| 7–12 s | 210–359 | Feature | “Filter products without losing your place” if supplied as a fact | Zoom into the relevant interface area |
| 12–17 s | 360–509 | Contribution | “I designed and built the responsive interface” only if accurate | Second screenshot, one precise callout |
| 17–21 s | 510–629 | Evidence | Supplied outcome, or “Desktop and mobile layouts” with evidence | Comparison or supporting screen |
| 21–24 s | 630–719 | CTA | Name, service, contact destination | Stable final card; enough time to read |

If only one screenshot exists, use a full-screen view and meaningful detail crops rather than pretending there are several different product states. If there is no measurable result, use a delivered capability. If the screenshot does not demonstrate a stated feature, add a better asset or revise the claim.

## Template vocabulary

Begin with one template provisionally called **Project Spotlight**: neutral background, one accent color, large title, crisp screenshot framing, and small role/category labels. Support a light and dark token set only if both receive visual review. Choose actual branding after seeing real projects.

The implemented studio now offers five per-screenshot color presets (Studio Lime, Midnight, Editorial Rose, Cobalt, Moss) and four editable colors: canvas, text, accent, and screenshot frame. Existing slides use Studio Lime. The same resolved palette travels with each scene into the shared Remotion composition for preview and export. Custom text/canvas combinations below a 4.5:1 contrast ratio receive a warning in the editor; the creator should review the actual slide, especially with long copy and in portrait or square format. Preset selection resets that slide's custom colors.

Reusable scene primitives should include screenshot stage, headline block, feature callout, contribution list, optional evidence card, and end card. Keep scene content separate from appearance. Store typography scale, spacing, radii, color, and motion values in a template-level design system.

## Copy rules

Use one idea per scene. Suggested starting limits: headlines of 4–9 words and supporting lines of 8–18 words. These are editorial targets, not universal hard limits; actual font metrics, language, and viewing size determine fit. Prefer concrete verbs: built, designed, integrated, simplified, organized.

Preserve project names and factual language. Avoid unsupported adjectives such as “industry-leading” and claims like “10× faster” without evidence. Name technologies where they clarify the work; do not devote the opening to a stack logo wall.

Use manual line breaks only when the template and language justify them. For Thai or other scripts, test actual font coverage and segmentation; character counts are not a reliable proxy for rendered width or reading time. Never keep shrinking text until every paragraph fits.

## Screenshot handling

Use containment for the opening overview and deliberate cropping for detail scenes. Very tall screenshots need selected regions or slow, bounded pans; scaling an entire long page down makes it unreadable. Do not zoom past the useful source resolution. Warn about insufficient resolution and offer a less aggressive crop.

Maintain true aspect ratio. A browser/device frame should match the content's context, not imply features the project lacks. Make crop controls understandable in the editor and let the creator reset them. Highlight one area at a time, keeping labels away from the evidence they explain.

Screenshot edits that remove private data should be applied to stored publishable derivatives. Private information must not remain visible in a zoom, poster, transition, or downloadable original.

## Motion and pacing

Use brief entrances followed by a readable hold. Suggested starting values: 0.3–0.6-second entrances, 3–5-second information scenes, and 2–3 seconds for the CTA. Test with actual text rather than enforcing these values mechanically.

Choose a small motion vocabulary: opacity, translation, controlled scale, and one transition family. Avoid continuous camera drift on every scene, frequent flashes, excessive overshoot, or spinning screenshots. The animation should direct attention to a feature, reveal hierarchy, or signal a new section.

Keep the start and end meaningful as stills. Review arbitrary seek positions, not just uninterrupted playback. Motion derived from frames should remain consistent when previewing, seeking, and exporting. [Remotion's frame model](https://www.remotion.dev/docs/idea)

## Audio and captions

The first video should work with sound off. Optional music can add energy after the silent version is clear; use properly licensed tracks and record attribution/usage information. Do not make music acquisition a dependency for export. Add short fades and avoid clipping.

Voiceover adds recording/synthesis, timing, pronunciation, and revision complexity. Defer it until the visual template works. If added, regenerate or re-align subtitles whenever narration changes. Marketing overlay copy and accessibility subtitles are distinct artifacts and may coexist.

## Format and accessibility

Landscape emphasizes desktop interfaces. Portrait should rearrange text and screenshot regions, often using closer crops; it must get its own composition layout and review. Use a conservative safe margin such as 5–8% as a starting point, then adapt to the destination platform's current overlays. Do not claim one safe-area preset works everywhere.

On the website, provide accessible controls and written case-study content. Honor reduced motion in page behavior and offer a static poster. A rendered video cannot dynamically change its animation based on the viewer's preference, so controls and alternatives matter.

## Visual review checklist

- Can a viewer identify the project and your role without reading the detailed case study?
- Does the opening show real work before decorative branding consumes attention?
- Are screenshot details readable at the intended viewing size, including mobile playback?
- Does each claim match the supplied notes or evidence?
- Are the longest headline, smallest screenshot, and portrait crop acceptable?
- Are fonts loaded, text uncut, and callouts clear at scene boundaries?
- Are transitions free of blank frames, flicker, and hidden final text?
- Does the export match preview in framing, timing, typography, and audio?
- Does the CTA remain visible long enough, and does the surrounding webpage supply a clickable destination?

For future implementation, inspect frames at each scene's beginning, readable hold, and end, plus transition midpoints. Also watch the entire exported file at normal speed. Contact-sheet review alone cannot establish pacing or audio quality.
