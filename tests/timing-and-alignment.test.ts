import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateFilmTiming,
  shuffleAlignments,
  defaultAlignments,
  generateLayout,
  hashStringToSeed,
  initialCategories,
  type ProjectScreenshot,
} from '../src/types.ts';
import { screenshotForScene } from '../src/screenshotSequence.ts';

test('calculateFilmTiming: empty screenshot list fallback', () => {
  const result = calculateFilmTiming([], 30);
  assert.equal(result.scenes.length, 4);
  assert.equal(result.totalSeconds, 8.0);
  assert.equal(result.totalFrames, 240);

  // Verify scene start offsets and durations
  assert.equal(result.scenes[0].startFrame, 0);
  assert.equal(result.scenes[0].durationInFrames, 60);
  assert.equal(result.scenes[1].startFrame, 60);
  assert.equal(result.scenes[1].durationInFrames, 60);
  assert.equal(result.scenes[2].startFrame, 120);
  assert.equal(result.scenes[2].durationInFrames, 60);
  assert.equal(result.scenes[3].startFrame, 180);
  assert.equal(result.scenes[3].durationInFrames, 60);

  // Verify all scenes have default captions, alignments, and generated layouts
  for (const scene of result.scenes) {
    assert.ok(scene.caption.length > 0);
    assert.ok(defaultAlignments.includes(scene.alignment));
    assert.ok(scene.layout !== undefined);
    assert.ok(scene.layout.label.length > 0);
    assert.equal(scene.screenshot, null);
  }
});

test('calculateFilmTiming: single image duration limits (0.5s to 3.0s)', () => {
  // Test minimum duration 0.5s (15 frames)
  const minShot: ProjectScreenshot = {
    id: 'shot-min',
    name: 'min.png',
    src: 'blob:min',
    durationSeconds: 0.5,
  };
  const minRes = calculateFilmTiming([minShot], 30);
  assert.equal(minRes.totalSeconds, 0.5);
  assert.equal(minRes.totalFrames, 15);
  assert.equal(minRes.scenes[0].durationSeconds, 0.5);
  assert.equal(minRes.scenes[0].durationInFrames, 15);

  // Test maximum duration 3.0s (90 frames)
  const maxShot: ProjectScreenshot = {
    id: 'shot-max',
    name: 'max.png',
    src: 'blob:max',
    durationSeconds: 3.0,
  };
  const maxRes = calculateFilmTiming([maxShot], 30);
  assert.equal(maxRes.totalSeconds, 3.0);
  assert.equal(maxRes.totalFrames, 90);
  assert.equal(maxRes.scenes[0].durationSeconds, 3.0);
  assert.equal(maxRes.scenes[0].durationInFrames, 90);

  // Test clamping below minimum (e.g. 0.1s -> clamped to 0.5s)
  const underShot: ProjectScreenshot = {
    id: 'shot-under',
    name: 'under.png',
    src: 'blob:under',
    durationSeconds: 0.1,
  };
  const underRes = calculateFilmTiming([underShot], 30);
  assert.equal(underRes.scenes[0].durationSeconds, 0.5);
  assert.equal(underRes.scenes[0].durationInFrames, 15);

  // Test clamping above maximum (e.g. 10.0s -> clamped to 3.0s)
  const overShot: ProjectScreenshot = {
    id: 'shot-over',
    name: 'over.png',
    src: 'blob:over',
    durationSeconds: 10.0,
  };
  const overRes = calculateFilmTiming([overShot], 30);
  assert.equal(overRes.scenes[0].durationSeconds, 3.0);
  assert.equal(overRes.scenes[0].durationInFrames, 90);

  // Test default duration when omitted (should default to 2.0s / 60 frames)
  const defaultShot: ProjectScreenshot = {
    id: 'shot-default',
    name: 'default.png',
    src: 'blob:default',
  };
  const defaultRes = calculateFilmTiming([defaultShot], 30);
  assert.equal(defaultRes.scenes[0].durationSeconds, 2.0);
  assert.equal(defaultRes.scenes[0].durationInFrames, 60);
});

test('calculateFilmTiming: multi-image dynamic timeline calculation and layout attachment', () => {
  const screenshots: ProjectScreenshot[] = [
    { id: 'shot-1', name: 'shot1.png', src: 'blob:1', durationSeconds: 0.5, caption: 'Opening screen', layoutSeed: 101 },
    { id: 'shot-2', name: 'shot2.png', src: 'blob:2', durationSeconds: 1.5, caption: 'Product dashboard', layoutSeed: 202 },
    { id: 'shot-3', name: 'shot3.png', src: 'blob:3', durationSeconds: 2.2, caption: 'Filter interaction', layoutSeed: 303 },
    { id: 'shot-4', name: 'shot4.png', src: 'blob:4', durationSeconds: 3.0, caption: 'Final checkout flow', layoutSeed: 404 },
  ];

  const timing = calculateFilmTiming(screenshots, 30);
  assert.equal(timing.scenes.length, 4);

  // Expected frame counts: 15, 45, 66, 90 -> total 216 frames
  assert.equal(timing.scenes[0].durationInFrames, 15);
  assert.equal(timing.scenes[0].startFrame, 0);

  assert.equal(timing.scenes[1].durationInFrames, 45);
  assert.equal(timing.scenes[1].startFrame, 15);

  assert.equal(timing.scenes[2].durationInFrames, 66);
  assert.equal(timing.scenes[2].startFrame, 60);

  assert.equal(timing.scenes[3].durationInFrames, 90);
  assert.equal(timing.scenes[3].startFrame, 126);

  assert.equal(timing.totalFrames, 216);
  assert.equal(timing.totalSeconds, 216 / 30);

  // Verify per-image captions are preserved
  assert.equal(timing.scenes[0].caption, 'Opening screen');
  assert.equal(timing.scenes[1].caption, 'Product dashboard');
  assert.equal(timing.scenes[2].caption, 'Filter interaction');
  assert.equal(timing.scenes[3].caption, 'Final checkout flow');

  // Verify procedural layouts were generated
  for (let i = 0; i < timing.scenes.length; i++) {
    const scene = timing.scenes[i];
    assert.ok(scene.layout !== undefined);
    assert.ok(scene.layout.cardRotation >= -4.5 && scene.layout.cardRotation <= 4.5);
    assert.ok(scene.layout.cardScale >= 1.0 && scene.layout.cardScale <= 1.06);
  }
});

test('generateLayout: deterministic procedural generation and organic variety', () => {
  // Test determinism: identical seed + index must produce 100% identical layout
  const layoutA1 = generateLayout(98765, 0);
  const layoutA2 = generateLayout(98765, 0);
  assert.deepEqual(layoutA1, layoutA2);

  // Test diversity: different seeds produce different rotations and styles
  const layoutB = generateLayout(11111, 0);
  const layoutC = generateLayout(22222, 1);
  const layoutD = generateLayout(33333, 2);

  const rotations = [layoutA1.cardRotation, layoutB.cardRotation, layoutC.cardRotation, layoutD.cardRotation];
  const uniqueRotations = new Set(rotations);
  assert.ok(uniqueRotations.size >= 3, 'Expected diverse rotation angles across seeds');

  // Verify all rotations stay within tasteful bounds (-4.5 to +4.5)
  for (const rot of rotations) {
    assert.ok(rot >= -4.5 && rot <= 4.5);
    assert.notEqual(rot, 0);
  }
});

test('calculateFilmTiming: frame seeking simulation across scene boundaries', () => {
  const screenshots: ProjectScreenshot[] = [
    { id: 's1', name: 's1.png', src: 'blob:1', durationSeconds: 1.0 },
    { id: 's2', name: 's2.png', src: 'blob:2', durationSeconds: 2.0 },
    { id: 's3', name: 's3.png', src: 'blob:3', durationSeconds: 0.5 },
  ];
  const { scenes, totalFrames } = calculateFilmTiming(screenshots, 30);
  assert.equal(totalFrames, 105);

  function getActiveSceneIndex(frame: number) {
    for (let i = 0; i < scenes.length; i++) {
      if (frame >= scenes[i].startFrame && (i === scenes.length - 1 || frame < scenes[i + 1].startFrame)) {
        return i;
      }
    }
    return 0;
  }

  // First frame
  assert.equal(getActiveSceneIndex(0), 0);
  // Mid scene 0
  assert.equal(getActiveSceneIndex(15), 0);
  // Last frame of scene 0
  assert.equal(getActiveSceneIndex(29), 0);
  // Exactly at boundary: first frame of scene 1
  assert.equal(getActiveSceneIndex(30), 1);
  // Mid scene 1
  assert.equal(getActiveSceneIndex(60), 1);
  // Last frame of scene 1
  assert.equal(getActiveSceneIndex(89), 1);
  // Exactly at boundary: first frame of scene 2
  assert.equal(getActiveSceneIndex(90), 2);
  // Very last frame of the video
  assert.equal(getActiveSceneIndex(totalFrames - 1), 2);
});

test('shuffleAlignments: guarantees non-repeating adjacent alignments', () => {
  const count = 20;
  const shuffled = shuffleAlignments(count);
  assert.equal(shuffled.length, count);

  for (let i = 0; i < shuffled.length; i++) {
    assert.ok(defaultAlignments.includes(shuffled[i]), `Invalid alignment: ${shuffled[i]}`);
    if (i > 0) {
      assert.notEqual(
        shuffled[i],
        shuffled[i - 1],
        `Adjacent duplicate found at index ${i}: ${shuffled[i]}`
      );
    }
  }
});

test('screenshotForScene: backwards compatibility helper', () => {
  // Empty list
  assert.equal(screenshotForScene([], 0), null);

  // Single screenshot mapped across any scene count
  const single = [{ id: 'single', name: 'single.png', src: 'blob:single' }];
  assert.equal(screenshotForScene(single, 0)?.id, 'single');
  assert.equal(screenshotForScene(single, 5)?.id, 'single');

  // Multiple screenshots
  const multi: ProjectScreenshot[] = [
    { id: '1', name: '1.png', src: 'blob:1' },
    { id: '2', name: '2.png', src: 'blob:2' },
    { id: '3', name: '3.png', src: 'blob:3' },
  ];
  assert.equal(screenshotForScene(multi, 0)?.id, '1');
  assert.equal(screenshotForScene(multi, 1)?.id, '2');
  assert.equal(screenshotForScene(multi, 2)?.id, '3');
});

test('initialCategories: default master data integrity', () => {
  assert.ok(Array.isArray(initialCategories));
  assert.ok(initialCategories.length >= 4);

  const ids = new Set<string>();
  const names = new Set<string>();

  for (const cat of initialCategories) {
    assert.ok(cat.id.length > 0, 'Category ID must not be empty');
    assert.ok(cat.name.length > 0, 'Category name must not be empty');
    assert.ok(!ids.has(cat.id), `Duplicate category ID detected: ${cat.id}`);
    assert.ok(!names.has(cat.name.toLowerCase()), `Duplicate category name detected: ${cat.name}`);
    ids.add(cat.id);
    names.add(cat.name.toLowerCase());
  }

  assert.ok(names.has('selected work'));
  assert.ok(names.has('digital product'));
  assert.ok(names.has('brand & identity'));
});

test('calculateFilmTiming: slide-specific category override and project category fallback', () => {
  const screenshots: ProjectScreenshot[] = [
    {
      id: 'shot-1',
      name: 'screen1.png',
      src: 'blob:1',
      durationSeconds: 2.0,
      category: 'Brand & identity', // Explicit slide override
    },
    {
      id: 'shot-2',
      name: 'screen2.png',
      src: 'blob:2',
      durationSeconds: 1.5,
      category: '', // Empty -> should fall back to project category
    },
    {
      id: 'shot-3',
      name: 'screen3.png',
      src: 'blob:3',
      durationSeconds: 2.5,
      // category omitted -> should fall back to project category
    },
    {
      id: 'shot-4',
      name: 'screen4.png',
      src: 'blob:4',
      durationSeconds: 1.0,
      category: 'Web experience', // Explicit slide override
    },
  ];

  // Test with project category provided
  const resultWithProjectCat = calculateFilmTiming(screenshots, 30, 'Digital product');
  assert.equal(resultWithProjectCat.scenes.length, 4);
  assert.equal(resultWithProjectCat.scenes[0].category, 'Brand & identity');
  assert.equal(resultWithProjectCat.scenes[1].category, 'Digital product');
  assert.equal(resultWithProjectCat.scenes[2].category, 'Digital product');
  assert.equal(resultWithProjectCat.scenes[3].category, 'Web experience');

  // Test with empty project category fallback -> defaults to 'Selected work'
  const resultWithoutProjectCat = calculateFilmTiming(screenshots, 30, '');
  assert.equal(resultWithoutProjectCat.scenes[0].category, 'Brand & identity');
  assert.equal(resultWithoutProjectCat.scenes[1].category, 'Selected work');
  assert.equal(resultWithoutProjectCat.scenes[2].category, 'Selected work');
  assert.equal(resultWithoutProjectCat.scenes[3].category, 'Web experience');
});

test('calculateFilmTiming: slide-specific summary and description fallback', () => {
  const screenshots: ProjectScreenshot[] = [
    {
      id: 'shot-1',
      name: 'screen1.png',
      src: 'blob:1',
      caption: 'Hook 1',
      summary: 'Custom summary for slide 1',
    },
    {
      id: 'shot-2',
      name: 'screen2.png',
      src: 'blob:2',
      caption: 'Hook 2',
      description: 'Legacy notes for slide 2', // fallback when summary is omitted
    },
    {
      id: 'shot-3',
      name: 'screen3.png',
      src: 'blob:3',
      caption: 'Hook 3',
      summary: 'Priority summary',
      description: 'Secondary description', // summary should take precedence
    },
    {
      id: 'shot-4',
      name: 'screen4.png',
      src: 'blob:4',
      caption: 'Hook 4',
      // both summary and description omitted
    },
  ];

  const result = calculateFilmTiming(screenshots, 30);
  assert.equal(result.scenes.length, 4);
  assert.equal(result.scenes[0].summary, 'Custom summary for slide 1');
  assert.equal(result.scenes[1].summary, 'Legacy notes for slide 2');
  assert.equal(result.scenes[2].summary, 'Priority summary');
  assert.equal(result.scenes[3].summary, '');
});

