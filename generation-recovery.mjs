import { createHash } from 'node:crypto';

export const GENERATION_RECIPE_VERSION = '1ho-topic-led-first-person-v3';

export function createTopicFileSlug(topic) {
  if (typeof topic !== 'string' || !topic.trim()) {
    throw new TypeError('Topic must be a non-empty string.');
  }
  const normalizedTopic = topic.normalize('NFKC').trim().replace(/\s+/gu, ' ');
  const digest = createHash('sha256').update(normalizedTopic, 'utf8').digest('hex');
  return `post-${digest.slice(0, 16)}`;
}

export function canResumeGenerationManifest(manifest, topic, recipeVersion) {
  return Boolean(
    manifest &&
    manifest.version === 1 &&
    manifest.topic === topic &&
    manifest.recipeVersion === recipeVersion &&
    manifest.fileSlug &&
    manifest.locales &&
    typeof manifest.locales === 'object'
  );
}

export function createFreshGenerationManifest({ previousManifest, topic, recipeVersion, fileSlug, publishDate }) {
  const keepIdentity =
    previousManifest?.version === 1 &&
    previousManifest.topic === topic &&
    previousManifest.fileSlug &&
    previousManifest.publishDate;

  return {
    version: 1,
    recipeVersion,
    topic,
    fileSlug: keepIdentity ? previousManifest.fileSlug : fileSlug,
    publishDate: keepIdentity ? previousManifest.publishDate : publishDate,
    status: 'in_progress',
    images:
      keepIdentity && previousManifest.images && typeof previousManifest.images === 'object'
        ? previousManifest.images
        : {},
    locales: {},
  };
}
