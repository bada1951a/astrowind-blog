import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

import {
  canResumeGenerationManifest,
  createFreshGenerationManifest,
  createTopicFileSlug,
  GENERATION_RECIPE_VERSION,
} from '../generation-recovery.mjs';

const savedManifest = {
  version: 1,
  recipeVersion: GENERATION_RECIPE_VERSION,
  topic: 'Diagnose a slow laptop startup',
  fileSlug: 'post-stable-slug',
  publishDate: '2026-10-30T10:00:00.000Z',
  status: 'in_progress',
  images: { ko: { coverUrl: '/images/cover.jpg', bodyUrl: '/images/body.jpg' } },
  locales: { ko: { status: 'validated' } },
};

test('same recipe version resumes validated locale drafts', () => {
  assert.equal(canResumeGenerationManifest(savedManifest, savedManifest.topic, GENERATION_RECIPE_VERSION), true);
});

test('changed recipe version invalidates drafts but preserves set identity', () => {
  const nextRecipeVersion = GENERATION_RECIPE_VERSION + '-next';
  assert.equal(canResumeGenerationManifest(savedManifest, savedManifest.topic, nextRecipeVersion), false);

  const freshManifest = createFreshGenerationManifest({
    previousManifest: savedManifest,
    topic: savedManifest.topic,
    recipeVersion: nextRecipeVersion,
    fileSlug: 'post-new-slug',
    publishDate: '2026-10-31T10:00:00.000Z',
  });

  assert.equal(freshManifest.recipeVersion, nextRecipeVersion);
  assert.equal(freshManifest.fileSlug, savedManifest.fileSlug);
  assert.equal(freshManifest.publishDate, savedManifest.publishDate);
  assert.deepEqual(freshManifest.images, savedManifest.images);
  assert.deepEqual(freshManifest.locales, {});
});

test('generator passes locale code and index to the image recovery lookup', () => {
  const generatorSource = readFileSync(new URL('../generate-all.mjs', import.meta.url), 'utf8');
  assert.match(generatorSource, /function getPostImages\(localeCode, index\)/);
  assert.match(generatorSource, /postImages = await getPostImages\(lang\.code, index\);/);
});

test('topic file slugs are deterministic, normalized, and topic-scoped', () => {
  const topic = 'Diagnose a slow laptop startup';
  const slug = createTopicFileSlug(topic);

  assert.equal(slug, createTopicFileSlug(topic));
  assert.equal(slug, createTopicFileSlug(`  ${topic}  `));
  assert.equal(slug, createTopicFileSlug(topic.replace(/\s+/gu, '   ')));
  assert.match(slug, /^post-[a-f0-9]{16}$/);
  assert.notEqual(slug, createTopicFileSlug('Diagnose a slow laptop battery'));
});
