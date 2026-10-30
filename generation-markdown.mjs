export function normalizeBoldWhitespace(markdown) {
  return String(markdown).replace(/\*\*[ \t]*([^*\r\n]*?)[ \t]*\*\*/g, (_match, content) => {
    return '**' + content.trim() + '**';
  });
}

const faqMarkerPattern = /^\s*(?:\*{2,4})?\s*([QA])\s*([1-3])\s*[.．:：)]\s*(?:\*{2,4})?\s*(.*?)\s*$/i;

function cleanFaqProse(lines) {
  const prose = lines
    .filter((line) => !/^\s*\*\*\s*$/.test(line))
    .map((line) => line.trim())
    .filter(Boolean)
    .join(' ')
    .replace(/^\*\*(.*?)\*\*$/, '$1')
    .trim();

  const boldTokenCount = (prose.match(/\*\*/g) || []).length;
  if (boldTokenCount % 2 === 1) {
    if (prose.startsWith('**')) return prose.slice(2).trim();
    if (prose.endsWith('**')) return prose.slice(0, -2).trim();
  }

  return prose;
}

/**
 * Canonicalize FAQ labels and prose that the model split across lines or left
 * with stray bold markers. This changes formatting only; it never invents text.
 */
export function normalizeFaqMarkers(markdown) {
  const source = String(markdown);
  const lines = source.split(/\r?\n/);
  // Restrict repair to the fifth H2 section so examples or literal Q1/A1
  // labels in the article body are not mistaken for the FAQ.
  const faqStart = lines.findIndex((line) => /^##\s+5[.)]\s+\S/i.test(line));
  if (faqStart < 0) return source;
  const nextSection = lines.findIndex((line, index) => index > faqStart && /^##\s+/.test(line));
  const faqEnd = nextSection < 0 ? lines.length : nextSection;
  const faqLines = lines.slice(faqStart, faqEnd);
  const markerIndexes = faqLines
    .map((line, index) => (faqMarkerPattern.test(line) ? index : -1))
    .filter((index) => index >= 0);
  if (markerIndexes.length === 0) return source;

  const faqFormattingStart = Math.max(0, markerIndexes[0] - 2);
  const faqFormattingEnd = Math.min(faqLines.length - 1, markerIndexes[markerIndexes.length - 1] + 2);
  const output = [];
  let changed = false;

  for (let index = 0; index < faqLines.length; index += 1) {
    const match = faqMarkerPattern.exec(faqLines[index]);
    if (!match) {
      if (index >= faqFormattingStart && index <= faqFormattingEnd && /^\s*\*\*\s*$/.test(faqLines[index])) {
        changed = true;
        continue;
      }
      output.push(faqLines[index]);
      continue;
    }

    const proseLines = [match[3]];
    let nextIndex = index + 1;
    while (nextIndex < faqLines.length && !faqMarkerPattern.test(faqLines[nextIndex])) {
      if (/^\s*#{1,6}\s+/.test(faqLines[nextIndex])) break;
      proseLines.push(faqLines[nextIndex]);
      nextIndex += 1;
    }

    const prose = cleanFaqProse(proseLines);
    const canonical = `**${match[1].toUpperCase()}${match[2]}.**${prose ? ` ${prose}` : ''}`;
    if (canonical !== faqLines[index] || nextIndex > index + 1) changed = true;

    while (output.length > 0 && output[output.length - 1] === '') output.pop();
    if (output.length > 0) output.push('');
    output.push(canonical);
    index = nextIndex - 1;
  }

  if (!changed) return source;
  const normalizedFaq = output.join('\n');
  return [...lines.slice(0, faqStart), ...normalizedFaq.split('\n'), ...lines.slice(faqEnd)].join('\n');
}

export function validateFaqStructure(markdown) {
  const body = String(markdown);
  const errors = [];
  const questions = [...body.matchAll(/^\*\*Q([1-3])\.\*\*\s*(.+)$/gim)];
  const answers = [...body.matchAll(/^\*\*A([1-3])\.\*\*\s*(.+)$/gim)];
  if (questions.length !== 3 || new Set(questions.map((match) => match[1])).size !== 3) {
    errors.push('FAQ 질문 3개 구조 오류');
  }
  if (answers.length !== 3 || new Set(answers.map((match) => match[1])).size !== 3) {
    errors.push('FAQ 답변 3개 구조 오류');
  }
  for (const answer of answers) {
    if (answer[2].trim().length < 45) errors.push(`FAQ A${answer[1]} 답변이 너무 짧음`);
  }
  if (
    questions.some((question) => {
      const answer = answers.find((candidate) => candidate[1] === question[1]);
      return !answer || question.index >= answer.index;
    })
  ) {
    errors.push('FAQ 질문/답변 순서 오류');
  }
  return [...new Set(errors)];
}
