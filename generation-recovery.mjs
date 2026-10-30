import { createHash } from 'node:crypto';

export const GENERATION_RECIPE_VERSION = '1ho-topic-specific-headings-v6';

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

export function decidePublishLocales(targetLanguages, successfulLocaleCodes, minimum = 10) {
  if (!Array.isArray(targetLanguages) || targetLanguages.length === 0) {
    throw new TypeError('targetLanguages must be a non-empty array.');
  }
  if (!Array.isArray(successfulLocaleCodes) && !(successfulLocaleCodes instanceof Set)) {
    throw new TypeError('successfulLocaleCodes must be an array or Set.');
  }

  const localeCode = (locale) => (typeof locale === 'string' ? locale : locale?.code);
  const targetCodes = targetLanguages.map(localeCode);
  if (targetCodes.some((code) => typeof code !== 'string' || !code.trim())) {
    throw new TypeError('Every target locale must have a non-empty code.');
  }
  if (new Set(targetCodes).size !== targetCodes.length) {
    throw new TypeError('Target locale codes must be unique.');
  }
  if (!Number.isInteger(minimum) || minimum < 1 || minimum > targetCodes.length) {
    throw new RangeError('minimum must be an integer within the target locale count.');
  }

  const successfulCodes = new Set(successfulLocaleCodes);
  const targetCodeSet = new Set(targetCodes);
  const unknownCodes = [...successfulCodes].filter((code) => !targetCodeSet.has(code));
  if (unknownCodes.length > 0) {
    throw new RangeError('Unknown successful locale codes: ' + unknownCodes.join(', '));
  }

  const passingLocales = targetLanguages.filter((locale) => successfulCodes.has(localeCode(locale)));
  const passingCodes = passingLocales.map(localeCode);
  const failedCodes = targetCodes.filter((code) => !successfulCodes.has(code));
  return {
    total: targetCodes.length,
    minimum,
    passingLocales,
    passingCodes,
    failedCodes,
    canPublish: passingCodes.length >= minimum,
  };
}
