export type SlideAlignment = 'left' | 'right' | 'center' | 'tilted-left' | 'tilted-right';

export type LayoutVariant =
  | 'editorial-right'
  | 'editorial-left'
  | 'hero-center'
  | 'magazine-spread'
  | 'staggered-focus';

export type CategoryItem = {
  id: string;
  name: string;
};

export const initialCategories: CategoryItem[] = [
  { id: 'cat-1', name: 'Selected work' },
  { id: 'cat-2', name: 'Digital product' },
  { id: 'cat-3', name: 'Brand & identity' },
  { id: 'cat-4', name: 'Web experience' },
  { id: 'cat-5', name: 'Creative development' },
  { id: 'cat-6', name: 'Product design' },
];

export type GeneratedLayout = {
  variant: LayoutVariant;
  label: string;
  description: string;
  cardRotation: number;
  cardScale: number;
  cardOffsetX: number;
  cardOffsetY: number;
  cardShadow: string;
  hasBackingCard: boolean;
  backingRotation: number;
  badgePosition: 'top-card' | 'bottom-card' | 'pill-text';
  textAlign: 'left' | 'center';
};

export type ProjectScreenshot = {
  id: string;
  name: string;
  src: string | null;
  storagePath?: string;
  durationSeconds?: number;
  caption?: string;
  summary?: string;
  description?: string;
  category?: string;
  alignment?: SlideAlignment;
  layoutSeed?: number;
};

export type Project = {
  name: string;
  headline: string;
  summary: string;
  role: string;
  category: string;
  screenshots: ProjectScreenshot[];
  aiEnabled?: boolean;
  aiConnectionId?: string;
};

export type FilmScene = {
  index: number;
  id: string;
  durationSeconds: number;
  durationInFrames: number;
  startFrame: number;
  caption: string;
  summary: string;
  category: string;
  alignment: SlideAlignment;
  layout: GeneratedLayout;
  screenshot: ProjectScreenshot | null;
};

export type FilmTiming = {
  scenes: FilmScene[];
  totalFrames: number;
  totalSeconds: number;
};

export const defaultAlignments: SlideAlignment[] = ['right', 'left', 'center', 'tilted-right', 'tilted-left'];

export function hashStringToSeed(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function createPRNG(seed: number) {
  let s = (seed | 0) + 0x6d2b79f5;
  return function () {
    s = Math.imul(s ^ (s >>> 15), s | 1);
    s ^= s + Math.imul(s ^ (s >>> 7), s | 61);
    return ((s ^ (s >>> 14)) >>> 0) / 4294967296;
  };
}

const LAYOUT_VARIANTS: LayoutVariant[] = [
  'editorial-right',
  'editorial-left',
  'magazine-spread',
  'hero-center',
  'staggered-focus',
];

export function generateLayout(seed: number, index: number): GeneratedLayout {
  const prng = createPRNG(seed + index * 997);

  // Pick variant, avoiding identical feel across sequential slides
  const variantIndex = Math.floor(prng() * LAYOUT_VARIANTS.length);
  const variant = LAYOUT_VARIANTS[(variantIndex + index) % LAYOUT_VARIANTS.length];

  // Natural rotation within tasteful bounds (-3.8deg to +3.8deg, min magnitude 1.2deg)
  const rotSign = prng() > 0.5 ? 1 : -1;
  const rotMag = 1.2 + prng() * 2.6;
  const cardRotation = Number((rotSign * rotMag).toFixed(1));

  const cardScale = Number((1.0 + prng() * 0.05).toFixed(2));
  const cardOffsetX = Math.round((prng() - 0.5) * 32);
  const cardOffsetY = Math.round((prng() - 0.5) * 20);

  const hasBackingCard = variant === 'magazine-spread' || prng() > 0.55;
  const backingRotation = Number((-cardRotation * 0.7 + (prng() - 0.5) * 2).toFixed(1));

  let label = 'Editorial Right';
  let description = 'Text left, framed screen right with subtle tilt';
  let textAlign: 'left' | 'center' = 'left';

  switch (variant) {
    case 'editorial-left':
      label = 'Editorial Left';
      description = 'Framed screen on left, typography on right';
      break;
    case 'hero-center':
      label = 'Hero Showcase';
      description = 'High-impact widescreen center showcase';
      textAlign = 'center';
      break;
    case 'magazine-spread':
      label = 'Magazine Spread';
      description = 'Layered design print with backing plate';
      break;
    case 'staggered-focus':
      label = 'Staggered Focus';
      description = 'Elevated scale and accent shadow callout';
      break;
    case 'editorial-right':
    default:
      label = 'Editorial Right';
      description = 'Text on left, angled framed screen on right';
      break;
  }

  const badgePositions: Array<'top-card' | 'bottom-card' | 'pill-text'> = ['top-card', 'bottom-card', 'pill-text'];
  const badgePosition = badgePositions[Math.floor(prng() * badgePositions.length)];

  const cardShadow =
    variant === 'staggered-focus'
      ? '0 36px 90px rgba(37,41,34,0.18), 0 0 0 1px rgba(214,255,97,0.35)'
      : hasBackingCard
      ? '0 28px 75px rgba(37,41,34,0.16)'
      : '0 24px 65px rgba(37,41,34,0.12)';

  return {
    variant,
    label,
    description,
    cardRotation,
    cardScale,
    cardOffsetX,
    cardOffsetY,
    cardShadow,
    hasBackingCard,
    backingRotation,
    badgePosition,
    textAlign,
  };
}

export function shuffleAlignments(count: number): SlideAlignment[] {
  const result: SlideAlignment[] = [];
  for (let i = 0; i < count; i++) {
    const prev = result[i - 1];
    const available = prev ? defaultAlignments.filter((a) => a !== prev) : defaultAlignments;
    result.push(available[Math.floor(Math.random() * available.length)]);
  }
  return result;
}

export function calculateFilmTiming(
  screenshots: ProjectScreenshot[],
  fps = 30,
  projectCategory = 'Selected work'
): FilmTiming {
  const fallbackCat = projectCategory || 'Selected work';

  if (!screenshots || screenshots.length === 0) {
    const sampleCount = 4;
    const defaultDurSec = 2.0;
    const durFrames = Math.round(defaultDurSec * fps);
    const starts = [0, durFrames, durFrames * 2, durFrames * 3];
    const sampleCaptions = [
      'A little more than a screenshot.',
      'A point of view, made real.',
      'Details that do the work.',
      'Let’s make the next one matter.',
    ];
    const sampleSummaries = [
      'Show what you made, how you made it, and why it matters.',
      'A point of view, made real.',
      'Details that do the work.',
      'Let’s make the next one matter.',
    ];
    const sampleCategories = [
      fallbackCat,
      'Digital product',
      'Feature detail',
      'Selected work',
    ];
    const sampleAlignments: SlideAlignment[] = ['right', 'left', 'tilted-right', 'center'];

    return {
      scenes: Array.from({ length: sampleCount }, (_, i) => {
        const layout = generateLayout(12345 + i * 83, i);
        return {
          index: i,
          id: `sample-${i}`,
          durationSeconds: defaultDurSec,
          durationInFrames: durFrames,
          startFrame: starts[i],
          caption: sampleCaptions[i],
          summary: sampleSummaries[i],
          category: sampleCategories[i] || fallbackCat,
          alignment: sampleAlignments[i],
          layout,
          screenshot: null,
        };
      }),
      totalFrames: durFrames * sampleCount,
      totalSeconds: defaultDurSec * sampleCount,
    };
  }

  let cumulative = 0;
  const scenes: FilmScene[] = screenshots.map((shot, index) => {
    const rawSec = typeof shot.durationSeconds === 'number' ? shot.durationSeconds : 2.0;
    const sec = Math.min(3.0, Math.max(0.5, rawSec));
    const durFrames = Math.max(15, Math.round(sec * fps));
    const startFrame = cumulative;
    cumulative += durFrames;

    const seed = typeof shot.layoutSeed === 'number' ? shot.layoutSeed : hashStringToSeed(shot.id);
    const layout = generateLayout(seed, index);

    const alignment: SlideAlignment =
      shot.alignment ||
      (layout.variant === 'hero-center'
        ? 'center'
        : layout.variant === 'editorial-left'
        ? 'left'
        : layout.variant === 'magazine-spread'
        ? 'tilted-right'
        : layout.variant === 'staggered-focus'
        ? 'tilted-left'
        : 'right');

    const resolvedCategory = shot.category?.trim() || fallbackCat;
    const resolvedSummary = shot.summary?.trim() || shot.description?.trim() || '';

    return {
      index,
      id: shot.id,
      durationSeconds: sec,
      durationInFrames: durFrames,
      startFrame,
      caption: shot.caption || '',
      summary: resolvedSummary,
      category: resolvedCategory,
      alignment,
      layout,
      screenshot: shot,
    };
  });

  return {
    scenes,
    totalFrames: Math.max(15, cumulative),
    totalSeconds: cumulative / fps,
  };
}

export const initialProject: Project = {
  name: 'Your next project',
  headline: 'A little more than a screenshot.',
  summary: 'Show what you made, how you made it, and why it matters.',
  role: 'Your role',
  category: 'Selected work',
  screenshots: [],
};
