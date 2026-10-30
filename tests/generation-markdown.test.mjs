import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeFaqMarkers, validateFaqStructure } from '../generation-markdown.mjs';

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
    '**Q1.** Question one?\n\n**A1.** Too short.\n\n**Q2.** Question two?\n\n**A2.** This answer is long enough to pass the minimum length check safely.\n\n**Q3.** Question three?\n\n**A3.** This answer is long enough to pass the minimum length check safely.';
  assert.deepEqual(validateFaqStructure(shortAnswer), ['FAQ A1 답변이 너무 짧음']);

  const wrongOrder =
    '**A1.** This answer is long enough to pass the minimum length check safely.\n\n**Q1.** Question one?\n\n**Q2.** Question two?\n\n**A2.** This answer is long enough to pass the minimum length check safely.\n\n**Q3.** Question three?\n\n**A3.** This answer is long enough to pass the minimum length check safely.';
  assert.ok(validateFaqStructure(wrongOrder).includes('FAQ 질문/답변 순서 오류'));
});
