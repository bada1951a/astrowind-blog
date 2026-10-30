import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getNumberedStepsCorrectionInstruction,
  normalizeFaqMarkers,
  NUMBERED_STEPS_GUIDANCE,
  NUMBERED_STEPS_VALIDATION_ERROR,
  validateFaqStructure,
} from '../generation-markdown.mjs';

test('normalizes FAQ markers and prose split across lines without changing the words', () => {
  const input = [
    'Opening paragraph.',
    '',
    '## 5. Frequently Asked Questions (FAQ)',
    '',
    '**',
    '**Q1.**',
    '**When should I restart?**',
    '',
    '**',
    '**A1.**',
    'Restart only after saving your work and confirming unsaved files are backed up.**',
    '',
    '**Q2.** Is the cache the same as app data?**',
    '**A2.** No. Cache and saved app data are separate, and deleting app data can remove local settings.**',
    '**Q3.**',
    'Can I delete app data instead?**',
    '**A3.** Only after backing up important files and checking sign-in recovery.**',
  ].join('\n');

  assert.equal(
    normalizeFaqMarkers(input),
    [
      'Opening paragraph.',
      '',
      '## 5. Frequently Asked Questions (FAQ)',
      '',
      '**Q1.** When should I restart?',
      '',
      '**A1.** Restart only after saving your work and confirming unsaved files are backed up.',
      '',
      '**Q2.** Is the cache the same as app data?',
      '',
      '**A2.** No. Cache and saved app data are separate, and deleting app data can remove local settings.',
      '',
      '**Q3.** Can I delete app data instead?',
      '',
      '**A3.** Only after backing up important files and checking sign-in recovery.',
    ].join('\n')
  );

  const normalized = normalizeFaqMarkers(input);
  assert.equal([...normalized.matchAll(/^\*\*Q([1-3])\.\*\*\s+.+$/gm)].length, 3);
  assert.equal([...normalized.matchAll(/^\*\*A([1-3])\.\*\*\s+.+$/gm)].length, 3);
  assert.deepEqual(validateFaqStructure(normalized), []);
});

test('splits multiple FAQ markers on one line while preserving their prose', () => {
  const input = [
    '## 5. FAQ',
    '- **Q1.** Should I check the disk activity first? **A1.** Yes. Sort Task Manager by disk usage and note which process stays at the top for several minutes.',
    '**Q2.** Does high usage prove SysMain is responsible? **A2.** No. Compare the process list before changing a service, because another app or Windows task may be using the drive.',
    '**Q3.** Can I disable the service immediately? **A3.** First confirm the service is actually causing the load and save open work. If the cause remains unclear, avoid changing startup settings.',
  ].join('\\n');

  const normalized = normalizeFaqMarkers(input);
  assert.equal(
    normalized,
    [
      '## 5. FAQ',
      '',
      '**Q1.** Should I check the disk activity first?',
      '',
      '**A1.** Yes. Sort Task Manager by disk usage and note which process stays at the top for several minutes.',
      '',
      '**Q2.** Does high usage prove SysMain is responsible?',
      '',
      '**A2.** No. Compare the process list before changing a service, because another app or Windows task may be using the drive.',
      '',
      '**Q3.** Can I disable the service immediately?',
      '',
      '**A3.** First confirm the service is actually causing the load and save open work. If the cause remains unclear, avoid changing startup settings.',
    ].join('\\n')
  );
  assert.deepEqual(validateFaqStructure(normalized), []);
});

test('leaves missing FAQ prose empty instead of inventing content', () => {
  const input = '## 5. FAQ\n\n**Q1.**\n\n**A1.**';
  assert.equal(normalizeFaqMarkers(input), '## 5. FAQ\n\n**Q1.**\n\n**A1.**');
});

test('preserves formatting outside the FAQ block', () => {
  const input = 'Example:\n**Q1.** literal marker\n**\n\n## 5. FAQ\n\n**\n**Q1.** Question?\n\n**A1.** Answer.';
  assert.equal(
    normalizeFaqMarkers(input),
    'Example:\n**Q1.** literal marker\n**\n\n## 5. FAQ\n\n**Q1.** Question?\n\n**A1.** Answer.'
  );
});

test('preserves FAQ code fences and marker-like examples inside the FAQ section', () => {
  const fencedExample = [
    '## 5. FAQ',
    'Example source:',
    '```md',
    '**Q1.** Example question',
    '**A1.** Example answer',
    '```',
    '**Q1.**',
    'The real question follows the example.',
    '**A1.**',
    'The real answer is long enough to pass the minimum length check safely.',
  ].join('\n');

  assert.equal(
    normalizeFaqMarkers(fencedExample),
    [
      '## 5. FAQ',
      'Example source:',
      '```md',
      '**Q1.** Example question',
      '**A1.** Example answer',
      '```',
      '',
      '**Q1.** The real question follows the example.',
      '',
      '**A1.** The real answer is long enough to pass the minimum length check safely.',
    ].join('\n')
  );
});

test('preserves FAQ paragraph boundaries and continuation lines when repairing a split answer', () => {
  const multilineAnswer = [
    '## 5. FAQ',
    '',
    '**Q1.** Why should I check the backup first?',
    '**A1.**',
    'A backup protects files before a reset.',
    'Check that the copy opens on another device.',
    '',
    'Keep the original until the restored copy is verified.',
  ].join('\n');

  assert.equal(
    normalizeFaqMarkers(multilineAnswer),
    [
      '## 5. FAQ',
      '',
      '**Q1.** Why should I check the backup first?',
      '',
      '**A1.** A backup protects files before a reset.',
      'Check that the copy opens on another device.',
      '',
      'Keep the original until the restored copy is verified.',
    ].join('\n')
  );
});

test('validator ignores Q/A examples before the FAQ section', () => {
  const input = [
    '## 1. Example',
    '**Q1.** Example question?',
    '**A1.** This example answer is long enough that it would pass the validator if counted.',
    '## 5. FAQ',
    '**Q1.** First question?',
    '**A1.** This answer is long enough to pass the minimum length check safely.',
    '**Q2.** Second question?',
    '**A2.** This answer is long enough to pass the minimum length check safely.',
    '**Q3.** Third question?',
    '**A3.** This answer is long enough to pass the minimum length check safely.',
  ].join('\n\n');
  assert.deepEqual(validateFaqStructure(input), []);
});

test('normalizes plain and doubled-bold Q/A labels with full-width punctuation inside the FAQ section', () => {
  const input =
    '## 5. よくある質問 (FAQ)\n\nQ1：これは質問ですか？\nA1：これは回答です。\n\n****Q2．**** 別の質問ですか？\n**A2.** はい、確認できます。';
  assert.equal(
    normalizeFaqMarkers(input),
    '## 5. よくある質問 (FAQ)\n\n**Q1.** これは質問ですか？\n\n**A1.** これは回答です。\n\n**Q2.** 別の質問ですか？\n\n**A2.** はい、確認できます。'
  );
});

test('is idempotent after canonical FAQ formatting', () => {
  const input = '## FAQ\n\n**Q1.** Question?\n\n**A1.** Answer.';
  const normalized = normalizeFaqMarkers(input);
  assert.equal(normalizeFaqMarkers(normalized), normalized);
});

test('validator rejects missing, short, or out-of-order FAQ pairs', () => {
  const missingPair =
    '## 5. FAQ\n\n**Q1.** First question?\n\n**A1.** This answer is long enough to pass the minimum length check safely.\n\n**Q2.** Second question?\n\n**A2.** This answer is also long enough to pass the minimum length check safely.';
  assert.deepEqual(validateFaqStructure(missingPair), ['FAQ 질문 3개 구조 오류', 'FAQ 답변 3개 구조 오류']);

  const shortAnswer =
    '## 5. FAQ\n\n**Q1.** Question one?\n\n**A1.** Too short.\n\n**Q2.** Question two?\n\n**A2.** This answer is long enough to pass the minimum length check safely.\n\n**Q3.** Question three?\n\n**A3.** This answer is long enough to pass the minimum length check safely.';
  assert.deepEqual(validateFaqStructure(shortAnswer), ['FAQ A1 답변이 너무 짧음']);

  const wrongOrder =
    '## 5. FAQ\n\n**A1.** This answer is long enough to pass the minimum length check safely.\n\n**Q1.** Question one?\n\n**Q2.** Question two?\n\n**A2.** This answer is long enough to pass the minimum length check safely.\n\n**Q3.** Question three?\n\n**A3.** This answer is long enough to pass the minimum length check safely.';
  assert.ok(validateFaqStructure(wrongOrder).includes('FAQ 질문/답변 순서 오류'));
});

test('numbered-step guidance matches the validator format and correction error without permitting invented actions', () => {
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
