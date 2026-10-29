export const GENERATION_RECIPE_VERSION = '1ho-topic-led-first-person-v3';

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
