import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import {
  getNumberedStepsCorrectionInstruction,
  normalizeBoldWhitespace,
  NUMBERED_STEPS_GUIDANCE,
  NUMBERED_STEPS_VALIDATION_ERROR,
} from '../generation-markdown.mjs';

import {
  canResumeGenerationManifest,
  createFreshGenerationManifest,
  createTopicFileSlug,
  decidePublishLocales,
  GENERATION_RECIPE_VERSION,
} from '../generation-recovery.mjs';

const savedManifest = {
  version: 1,
  recipeVersion: GENERATION_RECIPE_VERSION,
  topic: 'Diagnose a slow laptop startup',
  fileSlug: 'post-stable-slug',
  publishDate: '2026-10-30T10:00:00.000Z',
  status: 'in_progress',
  images: {
    ko: { coverUrl: '/images/cover.jpg', bodyUrl: '/images/body.jpg' },
  },
  locales: { ko: { status: 'validated' } },
};

test('the generator requests topic-specific headings and rejects boilerplate claims', () => {
  const source = readFileSync(new URL('../generate-all.mjs', import.meta.url), 'utf8');
  assert.ok(source.includes('Make each concise and specific to the exact topic and its section'));
  assert.ok(source.includes('Do not claim guaranteed resolution times or outcomes'));
  assert.ok(source.includes("headingNumbers.join(',') !== '1,2,3,4,5'"));
});

test('numbered-step guidance matches the validator format without permitting invented actions', () => {
  assert.match(NUMBERED_STEPS_GUIDANCE, /H2 section 3/);
  assert.match(NUMBERED_STEPS_GUIDANCE, /own Markdown ordered-list line/);
  assert.match(NUMBERED_STEPS_GUIDANCE, /ASCII markers `1\.`, `2\.`, and `3\.`/);
  assert.match(NUMBERED_STEPS_GUIDANCE, /Do not invent product behavior, facts, or actions/);
  assert.match(NUMBERED_STEPS_GUIDANCE, /allow validation to fail/);

  const instruction = getNumberedStepsCorrectionInstruction([NUMBERED_STEPS_VALIDATION_ERROR]);
  assert.match(instruction, /^\[NUMBERED STEPS CORRECTION\]/);
  assert.ok(instruction.includes(NUMBERED_STEPS_GUIDANCE));
  assert.equal(getNumberedStepsCorrectionInstruction(['unrelated validator error']), '');
});

test('numbered-step guidance is shared by generation and only added to matching corrections', () => {
  const source = readFileSync(new URL('../generate-all.mjs', import.meta.url), 'utf8');
  assert.match(source, /NUMBERED_STEPS_GUIDANCE/);
  assert.match(source, /getNumberedStepsCorrectionInstruction\(prepared\.errors\)/);
  assert.match(source, /while \(prepared\.errors\.length > 0 && correctionAttempts < 2\)/);
  assert.match(source, /decidePublishLocales\(/);
});

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

const publicationTargets = ['ko', 'en', 'ja', 'de', 'fr', 'es', 'it', 'pt', 'nl', 'pl', 'id', 'vi'].map((code) => ({
  code,
}));

test('publication gate allows exactly passing locales at 9/12, 10/12, and 12/12', () => {
  const nine = decidePublishLocales(
    publicationTargets,
    publicationTargets.slice(0, 9).map(({ code }) => code)
  );
  assert.equal(nine.canPublish, false);
  assert.deepEqual(
    nine.passingCodes,
    publicationTargets.slice(0, 9).map(({ code }) => code)
  );
  assert.deepEqual(
    nine.failedCodes,
    publicationTargets.slice(9).map(({ code }) => code)
  );

  const ten = decidePublishLocales(
    publicationTargets,
    publicationTargets.slice(0, 10).map(({ code }) => code)
  );
  assert.equal(ten.canPublish, true);
  assert.deepEqual(ten.passingLocales, publicationTargets.slice(0, 10));
  assert.deepEqual(
    ten.failedCodes,
    publicationTargets.slice(10).map(({ code }) => code)
  );

  const twelve = decidePublishLocales(
    publicationTargets,
    publicationTargets.map(({ code }) => code)
  );
  assert.equal(twelve.canPublish, true);
  assert.deepEqual(twelve.passingLocales, publicationTargets);
  assert.deepEqual(twelve.failedCodes, []);
});

test('generator uses the tested publication plan to gate and stage locales', () => {
  const source = readFileSync(new URL('../generate-all.mjs', import.meta.url), 'utf8');
  assert.match(source, /decidePublishLocales\(TARGET_LANGS, successfulLocales, 10\)/);
  assert.match(source, /if \(!publication\.canPublish\)/);
  assert.match(source, /for \(const lang of publication\.passingLocales\)/);
});

test('generator prompt requires truthful first-person guidance without invented scenes or details', () => {
  const source = readFileSync(new URL('../generate-all.mjs', import.meta.url), 'utf8');
  assert.ok(source.includes('roughly 30% narrator reasoning'));
  assert.ok(source.includes('70% practical explanations'));
  for (const directive of [
    "Use first person only for the guide narrator's present reasoning and recommendations, such as what I would check next; do not claim past events.",
    "Open with the assigned topic's symptom, reader question, or decision point, then explain what I would check and why. Do not stage a personal scene.",
    "Unless the user supplied it as verified fact, do not invent or imply a narrator's past event, commute, customer interaction, meeting, named person, specific city, date, time, or case.",
    'Do not add a disclaimer that a scene is hypothetical, fictional, illustrative, or not a real customer case.',
  ]) {
    assert.ok(source.includes(directive), 'Missing truthful narration directive: ' + directive);
  }
  const localeStart = source.indexOf('const TARGET_LANGS = [');
  const localeEnd = source.indexOf('const delay =', localeStart);
  assert.notEqual(localeStart, -1);
  assert.notEqual(localeEnd, -1);
  const localeConfig = source.slice(localeStart, localeEnd);
  const localeContexts = localeConfig
    .split('\n')
    .filter((line) => line.includes('localeContext:'))
    .join('\n')
    .toLowerCase();
  for (const place of [
    'seoul',
    'silicon valley',
    'new york',
    'nyc',
    'tokyo',
    'marunouchi',
    'shinagawa',
    'frankfurt',
    'munich',
    'münchen',
    'berlin',
    'paris la défense',
    'madrid',
    'milan',
    'milano',
    'são paulo',
    'amsterdam',
    'zuidas',
    'warsaw',
    'warszawa',
    'jakarta',
    'ho chi minh',
    'quận 1',
    'hà nội',
  ]) {
    assert.equal(localeContexts.includes(place), false, 'locale context must not seed a city: ' + place);
  }
});

test('generator prompt specifies the FAQ markers required by its structural validator', () => {
  const source = readFileSync(new URL('../generate-all.mjs', import.meta.url), 'utf8');
  for (const marker of ['**Q1.**', '**A1.**', '**Q2.**', '**A2.**', '**Q3.**', '**A3.**']) {
    assert.ok(source.includes(marker));
  }
  assert.ok(source.includes('Keep the question and answer prose in the target locale'));
  assert.ok(source.includes('separate every question from its answer with a blank line'));
});

test('targeted FAQ correction prompt separates its guidance with real line breaks', () => {
  const source = readFileSync(new URL('../generate-all.mjs', import.meta.url), 'utf8');
  assert.ok(source.includes("'\\n\\nFor FAQ structure"));
  assert.equal(source.includes("'\\\\n\\\\nFor FAQ structure"), false);
});

test('bold whitespace normalization preserves Q&A labels and blank lines', () => {
  const input = [
    '**Q1.** What does this check?',
    '',
    '**A1.** It checks the marker and keeps this answer on its own paragraph.',
    '',
    '**Q2.** What if spacing is inconsistent?',
    '',
    '**A2.** The normalizer trims spaces inside bold tokens without joining lines.',
    '',
    '**Q3.** Does the third pair remain ordered?',
    '',
    '**A3.** Yes. The final pair remains separate and ordered.',
    '',
    '** spaced keyword ** stays on this line.',
  ].join('\n');

  const normalized = normalizeBoldWhitespace(input);
  assert.match(normalized, /\*\*Q1\.\*\* What does this check\?\n\n\*\*A1\.\*\*/);
  assert.match(normalized, /\*\*Q2\.\*\* What if spacing is inconsistent\?\n\n\*\*A2\.\*\*/);
  assert.match(normalized, /\*\*Q3\.\*\* Does the third pair remain ordered\?\n\n\*\*A3\.\*\*/);
  assert.match(normalized, /\*\*spaced keyword\*\* stays on this line\./);

  const questions = [...normalized.matchAll(/^\*\*Q([1-3])\.\*\*/gm)];
  const answers = [...normalized.matchAll(/^\*\*A([1-3])\.\*\*/gm)];
  assert.deepEqual(
    questions.map((match) => match[1]),
    ['1', '2', '3']
  );
  assert.deepEqual(
    answers.map((match) => match[1]),
    ['1', '2', '3']
  );
  for (const [index, question] of questions.entries()) {
    assert.equal(question[1], String(index + 1));
    assert.equal(answers[index][1], question[1]);
    assert.ok(question.index < answers[index].index);
  }
});

test('locale personas avoid unsupported credentials or experience claims', () => {
  const source = readFileSync(new URL('../generate-all.mjs', import.meta.url), 'utf8');
  const personas = [...source.matchAll(/persona:\s*(['"])(.*?)\1/g)].map((match) => match[2].toLowerCase());
  assert.equal(personas.length, 12);
  const unsupportedClaim =
    /(experienced|senior|expert|engineer|technician|specialist|professional|consultant|architect|現役|経験|専門家|エンジニア|기술자|전문가|경력|수리 기사|실무 경험|técnico|experto|especialista|technicien|ingénieur|esperto|experiente|techniker|ingenieur|serwisant|inżynier|chuyên gia|kỹ sư|teknisi senior)/i;
  for (const persona of personas) {
    assert.equal(
      unsupportedClaim.test(persona),
      false,
      'Persona must not imply credentials or personal experience: ' + persona
    );
    assert.ok(persona.length > 0);
  }
});
