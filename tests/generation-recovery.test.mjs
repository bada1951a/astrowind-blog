import assert from 'node:assert/strict';
import test from 'node:test';

import {
  canResumeGenerationManifest,
  createFreshGenerationManifest,
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
  assert.equal(
    canResumeGenerationManifest(savedManifest, savedManifest.topic, GENERATION_RECIPE_VERSION),
    true
  );
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
