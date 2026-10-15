# Agent entry point

## Current scope

This workspace has a working local prototype. The user authorized implementation on 14 October 2026. Continue building the product from the current code. It is a free, account-free local workspace with IndexedDB persistence, a local AI gateway, and no public deployment. Firebase Authentication and account storage are no longer part of the app; docs/08-membership-and-firebase.md records the legacy setup and data implications. Read the relevant domain document before changing storage or deployment.

## Read efficiently

Start with [README.md](README.md) and [the delivery plan](docs/07-delivery-plan.md). The `src/` directory is implemented code; architecture sections describing hosted services and publishing remain proposals. Read the domain-specific document before changing that domain. Distinguish user requirements, implemented behavior, recommended defaults, and unresolved decisions.

The companion skill is `~/.codex/skills/portfolio-remotion/SKILL.md`; read it if available when planning or implementing this screenshot-to-video portfolio. If absent on another machine, the documents here are sufficient to continue.

## Project invariants

- Preserve user-entered project facts; do not invent client results, metrics, authorship, or testimonials.
- Manual editing, preview, and export must work without AI credentials.
- Preview and rendering must consume the same validated storyboard revision and composition logic.
- Store assets by stable identity; resolve browser and worker access separately.
- Never execute user- or AI-supplied source code as a template.
- Render completion and public publication are separate actions.
- Keep draft screenshots, secrets, and unpublished project material private.
- Keep Remotion-specific details in the video and render boundaries, not throughout product logic.
- The local MVP uses browser rendering. Disclose its Remotion telemetry and capability requirements; do not imply durable cloud export.

## Handoff discipline

After meaningful work, state what actually exists, what was checked, unresolved decisions, and the smallest useful next step. Update the relevant document when a proposal becomes a decision. Do not claim a rendered preview was verified if only documentation or types were checked. Check current official API documentation before implementing version-sensitive behavior.
