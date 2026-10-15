# Folio Motion

Folio Motion is a free, open-source studio for turning project screenshots and truthful contribution notes into short portfolio videos. It uses React, TypeScript, and Remotion. The project is licensed under the [MIT License](LICENSE).

## Run it locally

### Requirements

- Git
- Node.js 20.19+ or 22.12+ ([Vite's current requirement](https://vite.dev/guide/))
- [Bun](https://bun.sh/) 1.3.10 (the version recorded in `package.json`)
- A recent Chrome or Chromium browser for the most reliable MP4 export support

### Clone and start

```sh
git clone https://github.com/zhephirothz/foliomotion.git
cd foliomotion
bun install --frozen-lockfile
bun run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`, to use the studio. Leave the `bun run dev` process running while using the app, especially when generating AI headlines. The introductory landing page is maintained separately in [foliomotion-landing](https://github.com/zhephirothz/foliomotion-landing).

## Firebase Hosting

The studio is live at [foliomotion-web.web.app](https://foliomotion-web.web.app). After authenticating with `firebase login`, build and deploy only Hosting from this repository:

```sh
bun run build
firebase deploy --only hosting --project foliomotion-web
```

This deploys the studio site only; it does not deploy Firestore or Storage rules. The landing page has its own Firebase Hosting site and deployment instructions in its [repository](https://github.com/zhephirothz/foliomotion-landing).

The studio build supports a configurable Vite base path. Standalone builds use `/`; the landing repository builds a second copy with `VITE_BASE_PATH=/studio/` so it can serve the app at `foliomotion.app/studio` on the same origin.

### Common commands

```sh
bun run test       # Run automated tests
bun run build      # Type-check and create the production bundle in dist/
bun run preview    # Serve dist/ locally, including the local AI gateway
```

After building, `bun run preview` prints its local URL. Stop a running server with `Ctrl+C`.

## Make a portfolio video

1. Add a project and enter its name, opening line, summary, role, and category.
2. Add screenshots one at a time. Each project supports up to ten PNG, JPEG, or WebP screenshots, up to 20 MB each.
3. Describe what you personally built or contributed on each screenshot. Edit each headline and arrange the order, timing, and layout.
4. Use the live preview to review the sequence, then choose **Export film** to download an MP4.

Manual editing, preview, and export work without AI credentials. The browser exporter needs supported WebCodecs/MP4 capabilities; use a recent Chrome or Chromium browser if export is unavailable. Remotion's browser renderer sends its documented render telemetry.

## Local workspace and privacy

The app has no login, account tier, or project-count limit. Project text, categories, and screenshot files autosave in IndexedDB in the browser profile for the current site origin. Data stays on that browser/device and is not synced to another device. Clearing that browser's site data removes the local workspace. Visiting through another origin (for example, a different localhost port or a deployed domain) opens a separate workspace.

The previous Firebase Authentication and cloud workspace implementation has been removed from the app. Existing Firebase resources and any previously saved account data remain untouched, but the app does not load or import them. See [workspace storage and Firebase history](docs/08-membership-and-firebase.md).

## Optional AI headline assistance

Open **AI Settings** to add an LM Studio or Ollama local model, or use an API key with OpenAI, Gemini, Claude, Grok (xAI), or OpenRouter. OpenRouter can connect to additional models. Then enable AI for a project, choose its provider, and request headline suggestions separately for each screenshot. Review and edit suggestions before accepting them. API keys are entered in Settings, held in the local gateway's memory, and never saved to browser storage or project data. Reconnect after refreshing the page or restarting the server.

Local AI needs its provider server running on the same machine. Hosted AI needs the app's local gateway, so use `bun run dev` or `bun run preview`; static Firebase Hosting by itself does not include this gateway. A model API may charge for usage. See [AI setup and data handling](docs/06-optional-ai.md).

## For coding agents

Start with [AGENTS.md](AGENTS.md), then [the delivery plan](docs/07-delivery-plan.md). Read the domain document relevant to the requested change; the documentation separates implemented behavior from future proposals. The `src/` tree is the working application.

- Use Bun for dependency installation and project scripts.
- Keep manual project editing, preview, and export usable without AI.
- Preserve the user's stated facts; do not invent results, technologies, clients, or authorship.
- Keep screenshots in browser storage and API credentials out of source, project data, localStorage, logs, and Remotion props.
- Use the same composition and validated project data for preview and export.
- Run `bun run test` and `bun run build` after code changes.
- Do not publish or deploy unless the user explicitly asks.

The project-specific [portfolio-remotion skill](~/.codex/skills/portfolio-remotion/SKILL.md) provides additional workflows when available. The repository docs are sufficient if that local skill is not installed.

## Project map

| Path | Purpose |
| --- | --- |
| `src/ui/App.tsx` | Studio, project editor, preview, and export controls |
| `src/ProjectFilm.tsx` | Shared Remotion composition |
| `src/types.ts` | Project data and shared film timing/layout logic |
| `src/localWorkspace.ts` | IndexedDB project metadata and screenshot storage |
| `src/aiProviders.ts` | AI provider setup, prompt, and response validation |
| `server/aiGateway.ts` | Local-only AI gateway; API keys stay in process memory |
| `docs/` | Product, architecture, video, AI, and delivery guidance |

Public project pages, cross-device workspace sync, hosted AI infrastructure, and publishing are not implemented. Firebase Hosting configuration is retained, but building `dist/` alone does not provide those services.
