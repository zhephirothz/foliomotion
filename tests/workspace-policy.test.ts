import test from 'node:test';
import assert from 'node:assert/strict';
import { freshWorkspace } from '../src/workspace.ts';

test('a new local workspace starts with one editable project and has no account policy', () => {
  const projects = freshWorkspace();
  assert.equal(projects.length, 1);
  for (let index = 0; index < 12; index += 1) {
    projects.push({ id: `project-${index}`, project: { ...projects[0].project, screenshots: [] } });
  }
  assert.equal(projects.length, 13);
  assert.equal(new Set(projects.map((project) => project.id)).size, 13);
});
