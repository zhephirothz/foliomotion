# Workspace storage and Firebase history

Updated 16 October 2026. The product no longer has accounts, a guest tier, a project-count gate, or Firebase-backed project saving.

## Current product behavior

- Anyone can create projects and use the editor without signing in. There is no free-tier project cap.
- Project copy, categories, and screenshot blobs auto-save to IndexedDB in the current browser profile.
- Work remains available after refresh in that profile. It does not sync to another browser or device.
- Clearing the browser's site data deletes the local workspace. Browser storage quotas vary by browser and device; this is local software storage, not a hosted backup.
- Screenshot upload remains limited to PNG/JPEG/WebP, 20 MB per file, and ten screenshots per project. These are editor/media limits, not account tiers.
- AI API keys remain in the local gateway's memory as described in [Optional AI](06-optional-ai.md). They are not saved with local projects.
- The app is deployed as a static site at [https://foliomotion-web.web.app](https://foliomotion-web.web.app). Project content and screenshots still stay in each visitor's browser; deployment does not add shared portfolio URLs or cross-device sync.

## Implementation map

| Module | Responsibility |
| --- | --- |
| `src/useLocalWorkspace.ts` | Load/save workspace state, debounce autosave, expose local save status |
| `src/localWorkspace.ts` | IndexedDB metadata and screenshot blob persistence by stable screenshot ID |
| `src/workspace.ts` | New-workspace defaults and workspace project type |
| `src/ui/App.tsx` | Unrestricted project creation and account-free storage/status UI |

Workspace metadata and screenshot blobs are stored separately in IndexedDB. The browser resolves each stable screenshot ID to a fresh object URL at load time. Object URLs and provider credentials are not persisted in project records. Deleted screenshot blobs are cleaned up on the next successful workspace save.

## Legacy Firebase resources and user data

Firebase Authentication, Firestore, and Cloud Storage code has been removed from the app. The existing Firebase project `foliomotion-web`, its rules, Storage CORS settings, Hosting configuration, and any stored account data have not been deleted or modified by this change.

The prior browser verification restored two projects and their screenshot attachments from the Firebase account workspace. Those cloud projects are not automatically imported into the new browser-local workspace, and this app no longer has a sign-in screen or cloud-save path. The data remains in Firebase under the existing private owner-only rules. Do not delete or loosen those rules/buckets as part of local workspace changes. A deliberate account-data export/import tool would be needed to move that work into IndexedDB.

Firebase Hosting serves the static studio from the existing `foliomotion-web` site. The separate introductory website is deployed from [foliomotion-landing](https://github.com/zhephirothz/foliomotion-landing) to `foliomotion-landing.web.app`. Static Hosting does not provide cross-device project sync or a production AI gateway. The hosted studio detects that its local gateway is unavailable and points visitors to run the app locally for AI headline assistance.

## Verification

- A prior browser session confirmed IndexedDB project and screenshot persistence in the prototype before the Firebase membership path replaced it. The new IndexedDB implementation has been build-checked; browser reload and screenshot-blob round-trip verification is still required.
- The previous Firebase setup created Firestore and Storage in Singapore, applied owner-only rules, and configured CORS for local and default Hosting origins. That setup remains intact but is no longer used by the app.
- Run `bun run test` and `bun run build` for normal checks. Firebase rules tests validate retained legacy rules only; they are not part of the current app workspace flow.

## Open-source release note

The repository uses the MIT License; see [`LICENSE`](../LICENSE). The app is free to use without an account. `package.json` remains marked private because this is an application repository rather than an npm package; that setting does not restrict the repository's source license.
