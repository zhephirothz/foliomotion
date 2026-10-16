import test from 'node:test';
import assert from 'node:assert/strict';
import { paletteContrastRatio, paletteFromPreset, palettePresets, readableTextOn, resolveSlidePalette } from '../src/slidePalette.ts';
import { calculateFilmTiming, type ProjectScreenshot } from '../src/types.ts';
import { serializeLocalWorkspace } from '../src/localWorkspace.ts';
import { initialCategories, initialProject } from '../src/types.ts';

test('palette presets are distinct and keep readable slide text', () => {
  assert.equal(new Set(palettePresets.map((preset) => preset.id)).size, palettePresets.length);
  for (const preset of palettePresets) {
    const palette = paletteFromPreset(preset.id);
    assert.ok(paletteContrastRatio(palette.text, palette.canvas) >= 4.5, preset.id);
    assert.ok(paletteContrastRatio(readableTextOn(palette.accent), palette.accent) >= 4.5, preset.id);
  }
});

test('each slide resolves its own palette and old slides keep the studio look', () => {
  const shots: ProjectScreenshot[] = [
    { id: 'old', name: 'old.png', src: null },
    { id: 'blue', name: 'blue.png', src: null, palette: paletteFromPreset('cobalt') },
    { id: 'custom', name: 'custom.png', src: null, palette: { ...paletteFromPreset('rose'), presetId: 'custom', accent: '#123456' } },
  ];
  const scenes = calculateFilmTiming(shots).scenes;
  assert.deepEqual(scenes[0].palette, paletteFromPreset('studio'));
  assert.deepEqual(scenes[1].palette, paletteFromPreset('cobalt'));
  assert.equal(scenes[2].palette.accent, '#123456');
  assert.equal(scenes[2].palette.presetId, 'custom');
  assert.equal(shots[0].palette, undefined);
});

test('custom colors persist in workspace metadata and malformed colors fall back safely', () => {
  const palette = { ...paletteFromPreset('midnight'), presetId: 'custom', canvas: '#203040' };
  const saved = serializeLocalWorkspace([
    { id: 'project-1', project: { ...initialProject, screenshots: [{ id: 'slide-1', name: 'screen.png', src: 'blob:test', palette }] } },
  ], initialCategories);
  assert.deepEqual(saved.projects[0].project.screenshots[0].palette, palette);
  assert.equal(saved.projects[0].project.screenshots[0].src, null);
  assert.equal(resolveSlidePalette({ ...palette, accent: 'red' }).accent, paletteFromPreset('studio').accent);
});
