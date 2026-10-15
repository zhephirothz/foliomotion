import { initialProject, type Project } from './types.ts';

export type WorkspaceProject = { id: string; project: Project };
export function freshWorkspace(): WorkspaceProject[] {
  return [{ id: crypto.randomUUID(), project: { ...initialProject, screenshots: [] } }];
}
