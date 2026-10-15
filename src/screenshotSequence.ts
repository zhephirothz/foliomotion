import type { ProjectScreenshot } from './types';

export function screenshotForScene(screenshots: ProjectScreenshot[], sceneIndex: number, sceneCount = 6) {
  if (!screenshots || screenshots.length === 0) return null;
  if (screenshots.length >= sceneCount || sceneIndex < screenshots.length) {
    return screenshots[sceneIndex] ?? screenshots[screenshots.length - 1];
  }
  const index = Math.min(screenshots.length - 1, Math.floor((sceneIndex * screenshots.length) / sceneCount));
  return screenshots[index];
}
