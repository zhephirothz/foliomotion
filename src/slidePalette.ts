export type PaletteColors = {
  canvas: string;
  text: string;
  accent: string;
  frame: string;
};

export type SlidePalette = PaletteColors & { presetId: string };

export const palettePresets = [
  { id: 'studio', nameEn: 'Studio Lime', nameTh: 'สตูดิโอไลม์', canvas: '#f3f1ed', text: '#1e211e', accent: '#d6ff61', frame: '#e4eadb' },
  { id: 'midnight', nameEn: 'Midnight', nameTh: 'มิดไนต์', canvas: '#111a28', text: '#f8f4e9', accent: '#ffae67', frame: '#29394d' },
  { id: 'rose', nameEn: 'Editorial Rose', nameTh: 'โรส', canvas: '#fff3f0', text: '#352730', accent: '#db6c81', frame: '#f1dce1' },
  { id: 'cobalt', nameEn: 'Cobalt', nameTh: 'โคบอลต์', canvas: '#f1f5ff', text: '#172451', accent: '#315de0', frame: '#d9e3ff' },
  { id: 'moss', nameEn: 'Moss', nameTh: 'มอส', canvas: '#eaf0e6', text: '#1b3327', accent: '#98cc77', frame: '#cddfca' },
] as const;

const defaultPalette = palettePresets[0];
const hexColor = /^#[0-9a-fA-F]{6}$/;

function safeColor(value: unknown, fallback: string): string {
  return typeof value === 'string' && hexColor.test(value) ? value.toLowerCase() : fallback;
}

export function paletteFromPreset(id: string): SlidePalette {
  const preset = palettePresets.find((item) => item.id === id) ?? defaultPalette;
  return { presetId: preset.id, canvas: preset.canvas, text: preset.text, accent: preset.accent, frame: preset.frame };
}

export function resolveSlidePalette(value?: Partial<SlidePalette> | null): SlidePalette {
  if (!value) return paletteFromPreset(defaultPalette.id);
  const base = paletteFromPreset(value.presetId || defaultPalette.id);
  return {
    presetId: value.presetId === 'custom' ? 'custom' : base.presetId,
    canvas: safeColor(value.canvas, base.canvas),
    text: safeColor(value.text, base.text),
    accent: safeColor(value.accent, base.accent),
    frame: safeColor(value.frame, base.frame),
  };
}

function luminance(color: string): number {
  const channels = [1, 3, 5].map((index) => {
    const channel = parseInt(color.slice(index, index + 2), 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

export function paletteContrastRatio(first: string, second: string): number {
  const a = luminance(safeColor(first, '#000000'));
  const b = luminance(safeColor(second, '#ffffff'));
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

export function readableTextOn(background: string): string {
  return paletteContrastRatio('#1e211e', background) >= paletteContrastRatio('#ffffff', background)
    ? '#1e211e'
    : '#ffffff';
}
