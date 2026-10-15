# Remotion knowledge and research

Research checked on **14 October 2026**. This is a focused integration study, not an exhaustive audit of Remotion's internals. Official documentation and repository manifests were inspected. No Remotion source was cloned, installed, or executed. Recheck version-sensitive details when implementation starts.

## Mental model

Remotion describes video frames with React. A composition pairs a component with dimensions, frame rate, and duration. At a particular frame, the component produces the visual state. This fits reusable project templates: the layout stays stable while screenshots, captions, colors, and timings vary. Frames are indexed from zero. A 30-second video at 30 fps has 900 frames, ending at frame 899. [Core idea](https://www.remotion.dev/docs/idea)

Remotion does not infer a compelling story from uploaded screenshots by itself. The product must collect facts, map them to scenes, choose crops, control pacing, and validate the result. Those are application responsibilities.

## Repository and package map

The upstream repository is a multi-package workspace. The root manifest uses Bun workspaces and Turbo for coordinated package tasks. That is upstream's development setup, not a requirement to copy its entire monorepo or toolchain into this application. The inspected core manifest on `main` reported **4.0.535**; this observation is not confirmation of the latest published registry version. [Root manifest](https://github.com/remotion-dev/remotion/blob/main/package.json), [core manifest](https://github.com/remotion-dev/remotion/blob/main/packages/core/package.json)

| Area | Relevant role in this product |
| --- | --- |
| `remotion` | Compositions, frame-based state, sequencing, core media/layout primitives |
| `@remotion/player` | Interactive in-app preview with changing input props |
| `@remotion/bundler` | Prepare composition code for the Node rendering workflow |
| `@remotion/renderer` | Select compositions and produce media/stills in a render process |
| `@remotion/transitions` | Reusable scene transitions with explicit timing |
| `@remotion/web-renderer` | Alternative browser export path with a capability matrix |
| Studio / CLI | Developer inspection and local rendering tools |
| Lambda | Optional distributed rendering infrastructure when workload justifies it |

Package roles are documented in the [API index](https://www.remotion.dev/docs/renderer), [Player guide](https://www.remotion.dev/docs/player), [transitions guide](https://www.remotion.dev/docs/transitions), and [browser rendering guide](https://www.remotion.dev/docs/client-side-rendering). Add packages only when a feature uses them. Align related Remotion package versions and test upgrades as a coordinated change.

## Preview and export

Player embeds an interactive composition inside a React application and accepts runtime inputs. Use it in the studio for immediate editing feedback. It does not replace the export pipeline. The public site can use ordinary video playback of an exported MP4 to avoid loading the composition runtime. [Player](https://www.remotion.dev/docs/player)

For Node rendering, the conceptual workflow is to prepare a bundle, resolve the chosen composition with its inputs, and render media. `renderMedia()` is the recommended high-level API over manually coordinating frames and stitching. `renderStill()` is useful for posters. Keep these operations outside the interactive web request. Reuse a versioned bundle across jobs instead of rebuilding unchanged template code for every export. [Renderer API](https://www.remotion.dev/docs/renderer), [server rendering](https://www.remotion.dev/docs/ssr)

`calculateMetadata()` can derive duration and dimensions from inputs. For this product, keep the actual timing calculation in a shared pure planner and feed its result to both Player and registered compositions. Do not assume that handing a React component to Player automatically executes composition metadata logic. [Metadata API](https://www.remotion.dev/docs/calculate-metadata)

## Frame correctness

Animate from the current frame and explicit parameters. Avoid wall-clock timers, uncontrolled randomness, or playback-history-dependent state in the composition. Seeking directly to a frame should produce the intended image. Resolve facts, AI output, and mutable remote data before rendering. Load required media and fonts before capturing affected frames; use the selected version's documented loading mechanisms.

Use sequences to organize scenes and account for their local frame origins. For overlapping transitions, total duration is the sum of scene durations minus the overlap durations, rather than simply the sum. Document the timing convention once and use it in validation, preview, audio placement, and export. [Timing primitives and transitions](https://www.remotion.dev/docs/transitions)

## Rendering options

| Option | Strength | Cost or constraint | Proposed use |
| --- | --- | --- | --- |
| Local Node process | Low infrastructure effort for a visual proof | Machine must be running; local files need explicit serving | First implementation spike |
| Dedicated Node/container worker | Controlled runtime, durable jobs, broad visual flexibility | Operate browser/runtime, storage, resource limits | Recommended hosted MVP |
| Remotion Lambda | Distributed cloud rendering | AWS configuration and workload-dependent spending | Evaluate after measurements |
| Browser export | Can avoid a render server for supported templates | Device, codec, CSS, and tab-lifetime constraints | Optional separately tested profile |

This table is a project tradeoff assessment, not a performance ranking. Use the official [server rendering overview](https://www.remotion.dev/docs/ssr) and [rendering overview](https://www.remotion.dev/docs/render) when selecting a deployment path.

The current browser renderer is documented as stable from v4.0.491 and uses WebCodecs/Mediabunny. Do not repeat older guidance that Remotion cannot export in the browser. Its default rendering path supports a subset of visual features, so matching Player appearance requires testing. The documentation also describes per-render telemetry; do not promise completely offline/private operation without reviewing the selected configuration. [Browser rendering](https://www.remotion.dev/docs/client-side-rendering)

Concrete compatibility concerns include unsupported `object-position`, perspective, and CSS `z-index` semantics in the default browser compositor; elements draw in DOM order. Optional HTML-in-canvas capture changes the constraints, but its browser/version requirements need separate verification. These details directly affect screenshot focal crops, tilted device mockups, and overlays. [Limitations](https://www.remotion.dev/docs/client-side-rendering/limitations)

## License and upstream skills

Remotion has a custom license. The inspected terms permit free use for individuals, qualifying small organizations, and other specified categories, while requiring a company license outside those categories. The license page flags changes for Remotion 5.0. Confirm the applicable release and organization/use case before launch; do not assume an MIT license or copy a fixed price into the budget. [License](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md)

Remotion publishes agent skills, including general best practices and focused rendering, markup, captions, and application guidance. They can complement the project skill during implementation. They were researched but not installed in this planning phase. The custom skill should retain portfolio-specific requirements rather than duplicate the upstream manual. [Official skills](https://www.remotion.dev/docs/ai/skills)

## What remains unproven

No performance benchmarks, visual exports, mobile playback checks, caption fit tests, deployment trials, or compatibility tests have been run. Browser export is a viable option to investigate, not a promised capability of this unbuilt app. Final package versions, runtime, hosting, costs, and template appearance remain implementation decisions.
