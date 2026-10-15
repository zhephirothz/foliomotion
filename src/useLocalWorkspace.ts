import { useCallback, useEffect, useRef, useState } from 'react';
import { initialCategories, type CategoryItem } from './types';
import { freshWorkspace, type WorkspaceProject } from './workspace';
import { loadLocalWorkspace, saveLocalWorkspace } from './localWorkspace';

export function useLocalWorkspace() {
  const [projects, setProjects] = useState<WorkspaceProject[]>(freshWorkspace);
  const [categories, setCategories] = useState<CategoryItem[]>(initialCategories);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedState, setSavedState] = useState('');
  const saveQueue = useRef<Promise<void>>(Promise.resolve());
  const urls = useRef(new Set<string>());
  const trackUrl = useCallback((url: string) => { urls.current.add(url); }, []);
  const clearUrls = useCallback(() => { urls.current.forEach((url) => URL.revokeObjectURL(url)); urls.current.clear(); }, []);
  const fingerprint = JSON.stringify({ projects, categories });
  const dirty = loaded && fingerprint !== savedState;

  useEffect(() => {
    let active = true;
    void loadLocalWorkspace().then((data) => {
      if (!active) {
        data.projects.forEach((item) => item.project.screenshots.forEach((shot) => { if (shot.src) URL.revokeObjectURL(shot.src); }));
        return;
      }
      data.projects.forEach((item) => item.project.screenshots.forEach((shot) => { if (shot.src) trackUrl(shot.src); }));
      setProjects(data.projects);
      setCategories(data.categories);
      setSavedState(JSON.stringify({ projects: data.projects, categories: data.categories }));
      setLoaded(true);
    }).catch((cause) => {
      if (!active) return;
      setError(cause instanceof Error ? cause.message : 'Could not open local project storage.');
      setSavedState(JSON.stringify({ projects, categories }));
      setLoaded(true);
    });
    return () => { active = false; };
  // Initial hydration is intentionally one-shot; edits made while it opens are preserved by the effect's closure only for the fallback baseline.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackUrl]);

  useEffect(() => {
    if (!loaded || fingerprint === savedState) return;
    const snapshotProjects = projects;
    const snapshotCategories = categories;
    const snapshotFingerprint = fingerprint;
    const timer = window.setTimeout(() => {
      setSaving(true);
      saveQueue.current = saveQueue.current.catch(() => undefined).then(() =>
        saveLocalWorkspace(snapshotProjects, snapshotCategories)
      ).then(() => {
        setSavedState(snapshotFingerprint);
        setError('');
      }).catch((cause) => {
        setError(cause instanceof Error ? cause.message : 'Could not save this workspace locally.');
      }).finally(() => setSaving(false));
    }, 500);
    return () => window.clearTimeout(timer);
  }, [loaded, fingerprint, savedState, projects, categories]);

  useEffect(() => () => clearUrls(), [clearUrls]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (dirty || saving) { event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty, saving]);

  return { projects, setProjects, categories, setCategories, loaded, saving, dirty, error, trackUrl };
}
