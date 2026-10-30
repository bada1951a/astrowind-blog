import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { selectCommonsImagePair } from '../commons-image-selector.mjs';
import { createFreshGenerationManifest, GENERATION_RECIPE_VERSION } from '../generation-recovery.mjs';

const png = Buffer.from('mock image bytes');

function makeCandidate(index, overrides = {}) {
  const sha1 = String(index).padStart(40, '0');
  const metadata = {
    ImageDescription: { value: '<p>Laptop troubleshooting guide image.</p>' },
    Artist: { value: 'Example artist' },
    Credit: { value: 'Example source' },
    Categories: { value: 'Laptop computers' },
    LicenseShortName: { value: 'CC0 1.0' },
    LicenseUrl: { value: 'https://creativecommons.org/publicdomain/zero/1.0/' },
    AttributionRequired: { value: 'false' },
    Restrictions: { value: '' },
    ...overrides.metadata,
  };
  return {
    title: `File:Laptop troubleshooting ${index}.jpg`,
    imageinfo: [
      {
        sha1,
        mime: 'image/png',
        thumburl: `https://thumb.wikimedia.org/${index}.png`,
        descriptionurl: `https://commons.wikimedia.org/wiki/File:${index}`,
        extmetadata: metadata,
        ...overrides.imageinfo,
      },
    ],
  };
}

function makeFetch(pages, options = {}) {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url: String(url), init });
    if (options.apiError) throw new Error('network unavailable');
    if (String(url).includes('w/api.php')) {
      return new Response(JSON.stringify({ query: { pages } }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }
    if (options.thumbnailError) return new Response('error', { status: 503 });
    return new Response(png, { status: 200, headers: { 'content-type': options.mime || 'image/png' } });
  };
  fetchImpl.calls = calls;
  return fetchImpl;
}

async function withOutputDir(run) {
  const outputDir = await fs.mkdtemp(path.join(os.tmpdir(), 'commons-cc0-test-'));
  try {
    return await run(outputDir);
  } finally {
    await fs.rm(outputDir, { recursive: true, force: true });
  }
}

const imageProcessor = () => ({ metadata: async () => ({ format: 'png', width: 1400, height: 900 }) });

test('selects and caches two exact CC0 images with descriptive sequential requests', async () => {
  await withOutputDir(async (outputDir) => {
    const fetchImpl = makeFetch([makeCandidate(1), makeCandidate(2)]);
    const result = await selectCommonsImagePair({
      topic: 'Laptop troubleshooting',
      outputDir,
      fetchImpl,
      imageProcessor,
    });

    assert.equal(result.status, 'selected');
    assert.deepEqual(
      result.files.map((file) => file.license),
      ['CC0 1.0', 'CC0 1.0']
    );
    assert.notEqual(result.images.coverUrl, result.images.bodyUrl);
    assert.equal(fetchImpl.calls.length, 3);
    assert.match(fetchImpl.calls[0].url, /gsrlimit=8/u);
    assert.match(fetchImpl.calls[0].url, /gsrnamespace=6/u);
    assert.equal(
      fetchImpl.calls[0].init.headers['User-Agent'],
      'StoryDailyViewCommonsImagePilot/0.1 (https://storydailyview.com/)'
    );
    assert.equal((await fs.readdir(outputDir)).length, 2);
  });
});

test('rejects CC BY-SA and candidates with missing license metadata', async () => {
  await withOutputDir(async (outputDir) => {
    const ccBySa = makeCandidate(1, {
      metadata: {
        LicenseShortName: { value: 'CC BY-SA 4.0' },
        LicenseUrl: { value: 'https://creativecommons.org/licenses/by-sa/4.0/' },
        AttributionRequired: { value: 'true' },
      },
    });
    const missing = makeCandidate(2, { metadata: { LicenseShortName: undefined, LicenseUrl: undefined } });
    const fetchImpl = makeFetch([ccBySa, missing]);
    const result = await selectCommonsImagePair({
      topic: 'Laptop troubleshooting',
      outputDir,
      fetchImpl,
      imageProcessor,
    });

    assert.equal(result, null);
    assert.equal(fetchImpl.calls.length, 1);
    assert.deepEqual(await fs.readdir(outputDir), []);
  });
});

test('returns safe fallback on API and thumbnail errors', async () => {
  await withOutputDir(async (outputDir) => {
    assert.equal(
      await selectCommonsImagePair({
        topic: 'Laptop troubleshooting',
        outputDir,
        fetchImpl: makeFetch([], { apiError: true }),
        imageProcessor,
      }),
      null
    );
    assert.equal(
      await selectCommonsImagePair({
        topic: 'Laptop troubleshooting',
        outputDir,
        fetchImpl: makeFetch([makeCandidate(1), makeCandidate(2)], { thumbnailError: true }),
        imageProcessor,
      }),
      null
    );
    assert.deepEqual(await fs.readdir(outputDir), []);
  });
});

test('filters used and duplicate hashes before choosing a pair', async () => {
  await withOutputDir(async (outputDir) => {
    const first = makeCandidate(1);
    const third = makeCandidate(3);
    const result = await selectCommonsImagePair({
      topic: 'Laptop troubleshooting',
      usedSha1s: new Set([first.imageinfo[0].sha1]),
      outputDir,
      fetchImpl: makeFetch([first, makeCandidate(2), makeCandidate(2), third]),
      imageProcessor,
    });

    assert.deepEqual(
      result.files.map((file) => file.sha1),
      [makeCandidate(2).imageinfo[0].sha1, third.imageinfo[0].sha1]
    );
  });
});

test('recovery manifest keeps the selected pair so all locale image records can reuse it', () => {
  const selection = {
    status: 'selected',
    images: { coverUrl: '/images/commons/a.png', bodyUrl: '/images/commons/b.png' },
    files: [{ sha1: 'a' }, { sha1: 'b' }],
  };
  const previous = {
    version: 1,
    topic: 'Laptop troubleshooting',
    recipeVersion: GENERATION_RECIPE_VERSION,
    fileSlug: 'post-stable',
    publishDate: '2026-10-31T10:00:00.000Z',
    commonsImageSelection: selection,
    images: { ko: selection.images },
  };
  const next = createFreshGenerationManifest({
    previousManifest: previous,
    topic: previous.topic,
    recipeVersion: GENERATION_RECIPE_VERSION + '-next',
    fileSlug: 'post-new',
    publishDate: '2026-11-01T10:00:00.000Z',
  });
  assert.deepEqual(next.commonsImageSelection, selection);
  assert.deepEqual(next.images, previous.images);

  const generatorSource = readFileSync(new URL('../generate-all.mjs', import.meta.url), 'utf8');
  assert.match(
    generatorSource,
    /for \(const lang of TARGET_LANGS\) generationManifest\.images\[lang\.code\] = commonsSelection\.images/u
  );
});
