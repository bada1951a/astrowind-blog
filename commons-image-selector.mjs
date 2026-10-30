import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const API_URL = 'https://commons.wikimedia.org/w/api.php';
const USER_AGENT = 'StoryDailyViewCommonsImagePilot/0.1 (https://storydailyview.com/)';
const RESULT_LIMIT = 8;
const MAX_THUMBNAIL_BYTES = 5 * 1024 * 1024;
const MIN_WIDTH = 1200;
const MIN_HEIGHT = 675;
const LICENSE_URLS = new Set([
  'https://creativecommons.org/publicdomain/zero/1.0/',
  'https://creativecommons.org/publicdomain/zero/1.0',
]);
const MIME_EXTENSIONS = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
]);

function metadataValue(metadata, name) {
  const value = metadata?.[name]?.value;
  return typeof value === 'string' ? value.trim() : '';
}

function stripHtml(value) {
  return value
    .replace(/<[^>]*>/gu, ' ')
    .replace(/&(?:nbsp|amp|quot|lt|gt);/giu, ' ')
    .replace(/&#(?:\d+|x[\da-f]+);/giu, ' ')
    .replace(/\s+/gu, ' ')
    .trim();
}

function isExactUnrestrictedCc0(metadata) {
  const licenseName = metadataValue(metadata, 'LicenseShortName');
  const licenseUrl = metadataValue(metadata, 'LicenseUrl');
  const attributionRequired = metadataValue(metadata, 'AttributionRequired').toLowerCase();
  const restrictions = metadataValue(metadata, 'Restrictions');
  return (
    /^cc0(?:\s+1\.0)?$/iu.test(licenseName) &&
    LICENSE_URLS.has(licenseUrl) &&
    attributionRequired === 'false' &&
    !restrictions
  );
}

function topicMatchesMetadata(topic, metadata, title) {
  const stopWords = new Set([
    'about',
    'after',
    'before',
    'does',
    'each',
    'from',
    'into',
    'that',
    'them',
    'this',
    'when',
    'where',
    'with',
    'your',
  ]);
  const tokens = [
    ...new Set(
      (topic.toLocaleLowerCase().match(/[\p{L}\p{N}]{3,}/gu) || []).filter(
        (token) => token.length > 3 && !stopWords.has(token)
      )
    ),
  ];
  if (tokens.length === 0) return true;
  const searchable =
    `${title} ${stripHtml(metadataValue(metadata, 'ImageDescription'))} ${metadataValue(metadata, 'Categories')}`.toLocaleLowerCase();
  const matchedTokens = tokens.filter((token) => searchable.includes(token)).length;
  return matchedTokens >= Math.min(2, tokens.length);
}

function buildSearchUrl(topic) {
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    formatversion: '2',
    generator: 'search',
    gsrsearch: topic,
    gsrnamespace: '6',
    gsrlimit: String(RESULT_LIMIT),
    prop: 'imageinfo',
    iiprop: 'url|size|mime|sha1|extmetadata',
    iiurlwidth: String(MIN_WIDTH),
    iiextmetadatafilter:
      'ImageDescription|Artist|Credit|Categories|LicenseShortName|LicenseUrl|AttributionRequired|Restrictions',
    maxlag: '1',
  });
  return `${API_URL}?${params}`;
}

async function fetchJson(fetchImpl, url) {
  const response = await fetchImpl(url, { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(20_000) });
  if (!response.ok) throw new Error(`Wikimedia API returned HTTP ${response.status}`);
  return response.json();
}

async function readThumbnail(fetchImpl, page, imageinfo, imageProcessor) {
  const mime = imageinfo.mime?.toLowerCase();
  const extension = MIME_EXTENSIONS.get(mime);
  const thumbUrl = imageinfo.thumburl;
  if (!extension || typeof thumbUrl !== 'string' || !thumbUrl.startsWith('https://')) return null;

  const response = await fetchImpl(thumbUrl, {
    headers: { 'User-Agent': USER_AGENT },
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) return null;
  const responseMime = (response.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  if (responseMime !== mime) return null;
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length === 0 || bytes.length > MAX_THUMBNAIL_BYTES) return null;

  let dimensions;
  try {
    dimensions = await imageProcessor(bytes).metadata();
  } catch {
    return null;
  }
  if (dimensions.format !== extension.replace('jpg', 'jpeg') && !(extension === 'jpg' && dimensions.format === 'jpg'))
    return null;
  if (
    !Number.isFinite(dimensions.width) ||
    !Number.isFinite(dimensions.height) ||
    dimensions.width < MIN_WIDTH ||
    dimensions.height < MIN_HEIGHT
  ) {
    return null;
  }

  const metadata = imageinfo.extmetadata || {};
  return {
    sha1: imageinfo.sha1,
    title: page.title,
    pageUrl: imageinfo.descriptionurl,
    artist: stripHtml(metadataValue(metadata, 'Artist')),
    source: stripHtml(metadataValue(metadata, 'Credit')),
    license: metadataValue(metadata, 'LicenseShortName'),
    licenseUrl: metadataValue(metadata, 'LicenseUrl'),
    mime,
    extension,
    bytes,
  };
}

/**
 * Look up and locally cache one conservative CC0 pair for the current topic.
 * Returns null on any incomplete/ambiguous result so the caller can retain its existing image pool.
 */
export async function selectCommonsImagePair({
  topic,
  usedSha1s = new Set(),
  outputDir,
  fetchImpl = fetch,
  imageProcessor = sharp,
  writeFile = fs.writeFile,
}) {
  const createdFiles = [];
  try {
    const data = await fetchJson(fetchImpl, buildSearchUrl(topic));
    const pages = Array.isArray(data?.query?.pages) ? data.query.pages : [];
    const candidates = pages.filter((page) => {
      const info = page.imageinfo?.[0];
      const metadata = info?.extmetadata;
      return (
        info &&
        /^[a-f0-9]{40}$/iu.test(info.sha1 || '') &&
        !usedSha1s.has(info.sha1.toLowerCase()) &&
        isExactUnrestrictedCc0(metadata) &&
        topicMatchesMetadata(topic, metadata, page.title || '')
      );
    });

    const pair = [];
    for (const page of candidates) {
      const image = await readThumbnail(fetchImpl, page, page.imageinfo[0], imageProcessor);
      if (!image || pair.some((selected) => selected.sha1 === image.sha1)) continue;
      pair.push(image);
      if (pair.length === 2) break;
    }
    if (pair.length !== 2) return null;

    await fs.mkdir(outputDir, { recursive: true });
    for (const image of pair) {
      const filename = `${image.sha1}.${image.extension}`;
      const filePath = path.join(outputDir, filename);
      try {
        await writeFile(filePath, image.bytes, { flag: 'wx' });
        createdFiles.push(filePath);
      } catch (error) {
        if (error.code !== 'EEXIST') throw error;
        const existing = await fs.readFile(filePath);
        if (!existing.equals(image.bytes)) {
          throw new Error('Existing Commons cache file does not match its SHA1 name.', { cause: error });
        }
      }
      image.localUrl = `/images/commons/${filename}`;
      delete image.bytes;
      delete image.extension;
      delete image.mime;
    }
    return {
      status: 'selected',
      images: { coverUrl: pair[0].localUrl, bodyUrl: pair[1].localUrl },
      files: pair,
    };
  } catch {
    await Promise.all(createdFiles.map((filePath) => fs.unlink(filePath).catch(() => {})));
    return null;
  }
}
