import test from 'node:test';
import assert from 'node:assert/strict';
import { initialCategories, projectVideoOrientation, videoProfiles } from '../src/types.ts';
import { serializeLocalWorkspace } from '../src/localWorkspace.ts';
import { freshWorkspace } from '../src/workspace.ts';

test('local workspace metadata keeps stable asset IDs but never stores object URLs', () => {
  const projects = freshWorkspace();
  projects[0].project.name = 'Plant factory';
  projects[0].project.screenshots.push({ id: 'stable-shot-id', name: 'plant.png', src: 'blob:http://localhost/local-preview', caption: 'Built a clear workflow' });
  const result = serializeLocalWorkspace(projects, initialCategories);
  assert.equal(result.projects[0].project.name, 'Plant factory');
  assert.equal(result.projects[0].project.screenshots[0].id, 'stable-shot-id');
  assert.equal(result.projects[0].project.screenshots[0].src, null);
  assert.equal(JSON.stringify(result).includes('blob:'), false);
  assert.equal(result.categories.length, initialCategories.length);
});

test('video format persists per project and older projects remain landscape', () => {
  const projects = freshWorkspace();
  projects[0].project.orientation = '9:16';
  const saved = serializeLocalWorkspace(projects, initialCategories);
  assert.equal(saved.projects[0].project.orientation, '9:16');
  assert.deepEqual(videoProfiles[projectVideoOrientation(saved.projects[0].project)], { width: 1080, height: 1920, label: 'Portrait' });
  delete saved.projects[0].project.orientation;
  assert.equal(projectVideoOrientation(saved.projects[0].project), '16:9');
  saved.projects[0].project.orientation = '1:1';
  assert.deepEqual(videoProfiles[projectVideoOrientation(saved.projects[0].project)], { width: 1080, height: 1080, label: 'Square' });
});
