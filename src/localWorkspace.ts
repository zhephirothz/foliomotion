import { initialCategories, type CategoryItem } from './types.ts';
import { freshWorkspace, type WorkspaceProject } from './workspace.ts';

const DATABASE = 'folio-motion-local-workspace';
const VERSION = 1;
const WORKSPACE_STORE = 'workspace';
const ASSET_STORE = 'assets';
type SavedWorkspace = { projects: WorkspaceProject[]; categories: CategoryItem[] };

export function serializeLocalWorkspace(projects: WorkspaceProject[], categories: CategoryItem[]): SavedWorkspace {
  return JSON.parse(JSON.stringify({
    projects: projects.map((item) => ({
      ...item,
      project: { ...item.project, screenshots: item.project.screenshots.map((shot) => ({ ...shot, src: null, storagePath: undefined })) },
    })),
    categories,
  }));
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in globalThis)) return reject(new Error('This browser does not support local project storage.'));
    const request = indexedDB.open(DATABASE, VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(WORKSPACE_STORE)) db.createObjectStore(WORKSPACE_STORE);
      if (!db.objectStoreNames.contains(ASSET_STORE)) db.createObjectStore(ASSET_STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Could not open local project storage.'));
  });
}

function requestValue<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Local project storage request failed.'));
  });
}

export async function loadLocalWorkspace(): Promise<SavedWorkspace> {
  const db = await openDatabase();
  try {
    const tx = db.transaction([WORKSPACE_STORE, ASSET_STORE], 'readonly');
    const saved = await requestValue(tx.objectStore(WORKSPACE_STORE).get('current')) as SavedWorkspace | undefined;
    if (!saved || !Array.isArray(saved.projects)) return { projects: freshWorkspace(), categories: initialCategories };
    const assets = tx.objectStore(ASSET_STORE);
    const projects = await Promise.all(saved.projects.map(async (item) => {
      const screenshots = await Promise.all(item.project.screenshots.map(async (shot) => {
        const blob = await requestValue(assets.get(shot.id)) as Blob | undefined;
        return { ...shot, src: blob ? URL.createObjectURL(blob) : null, storagePath: undefined };
      }));
      return { ...item, project: { ...item.project, screenshots } };
    }));
    return { projects: projects.length ? projects : freshWorkspace(), categories: Array.isArray(saved.categories) ? saved.categories : initialCategories };
  } finally { db.close(); }
}

export async function saveLocalWorkspace(projects: WorkspaceProject[], categories: CategoryItem[]): Promise<void> {
  const db = await openDatabase();
  try {
    const read = db.transaction(ASSET_STORE, 'readonly').objectStore(ASSET_STORE);
    const existingKeys = new Set((await requestValue(read.getAllKeys())).map(String));
    const assetBlobs = new Map<string, Blob>();
    for (const item of projects) for (const shot of item.project.screenshots) {
      if (existingKeys.has(shot.id) || !shot.src) continue;
      try { assetBlobs.set(shot.id, await (await fetch(shot.src)).blob()); }
      catch { throw new Error(`Could not store “${shot.name}” in this browser. Check available storage space and try again.`); }
    }

    const assetIds = new Set(projects.flatMap((item) => item.project.screenshots.map((shot) => shot.id)));
    const snapshot = serializeLocalWorkspace(projects, categories);
    const tx = db.transaction([WORKSPACE_STORE, ASSET_STORE], 'readwrite');
    const workspaceStore = tx.objectStore(WORKSPACE_STORE);
    const assetStore = tx.objectStore(ASSET_STORE);
    workspaceStore.put(snapshot, 'current');
    for (const [id, blob] of assetBlobs) assetStore.put(blob, id);
    for (const id of existingKeys) if (!assetIds.has(id)) assetStore.delete(id);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('Could not save this workspace in the browser.'));
      tx.onabort = () => reject(tx.error ?? new Error('Workspace save was interrupted.'));
    });
  } finally { db.close(); }
}
