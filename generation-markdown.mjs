export const NUMBERED_STEPS_VALIDATION_ERROR = '해결 절차의 번호가 붙은 단계가 3개 미만';

export const NUMBERED_STEPS_GUIDANCE =
  'In H2 section 3, give at least three distinct, safe, ordered practical actions supported by reliable, topic-specific guidance. Put each action on its own Markdown ordered-list line beginning with the ASCII markers `1.`, `2.`, and `3.`, and continue numbering for any additional actions. Include decision points where they help the reader choose what to do next. Do not invent product behavior, facts, or actions, and do not pad the article just to reach a count. If fewer than three safe actions can be supported, keep the content accurate and allow validation to fail.';

export function getNumberedStepsCorrectionInstruction(errors) {
  if (!Array.isArray(errors) || !errors.includes(NUMBERED_STEPS_VALIDATION_ERROR)) return '';

  return '[NUMBERED STEPS CORRECTION]\n' + NUMBERED_STEPS_GUIDANCE;
}

export function normalizeBoldWhitespace(markdown) {
  return String(markdown).replace(/\*\*[ \t]*([^*\r\n]*?)[ \t]*\*\*/g, (_match, content) => {
    return '**' + content.trim() + '**';
  });
}

const faqMarkerPattern = /^\s*(?:\*{2,4})?\s*([QA])\s*([1-3])\s*[.．:：)]\s*(?:\*{2,4})?\s*(.*?)\s*$/i;

function cleanFaqProse(prose) {
  const cleaned = String(prose)
    .trim()
    .replace(/^\*\*(.*?)\*\*$/, '$1');
  const boldTokenCount = (cleaned.match(/\*\*/g) || []).length;
  if (boldTokenCount % 2 === 1) {
    if (cleaned.startsWith('**')) return cleaned.slice(2).trim();
    if (cleaned.endsWith('**')) return cleaned.slice(0, -2).trim();
  }
  return cleaned;
}

function findFaqSection(lines) {
  const start = lines.findIndex((line) => /^##\s+5[.)]\s+\S/i.test(line));
  if (start < 0) return { start: -1, end: -1 };
  const nextSection = lines.findIndex((line, index) => index > start && /^##\s+/.test(line));
  return { start, end: nextSection < 0 ? lines.length : nextSection };
}

/**
 * Canonicalize FAQ labels and prose that the model split across lines or left
 * with stray bold markers. This changes formatting only; it never invents text.
 */
function splitInlineFaqMarkerLines(lines) {
  const output = [];
  let fenceCharacter = null;
  let fenceLength = 0;
  const markerPattern = /(?:\*{2,4}\s*)?([QA])\s*([1-3])\s*[.．:：)](?:\s*\*{2,4})?/gi;

  for (const line of lines) {
    const fence = line.match(/^ {0,3}(`{3,}|~{3,})/);
    if (fenceCharacter) {
      output.push(line);
      if (fence && fence[1][0] === fenceCharacter && fence[1].length >= fenceLength) {
        fenceCharacter = null;
        fenceLength = 0;
      }
      continue;
    }
    if (fence) {
      output.push(line);
      fenceCharacter = fence[1][0];
      fenceLength = fence[1].length;
      continue;
    }

    const markers = [...line.matchAll(markerPattern)];
    if (markers.length < 2) {
      output.push(line);
      continue;
    }

    const prefix = line.slice(0, markers[0].index).trim();
    if (prefix && !/^[-*+>]+$/.test(prefix)) output.push(prefix);
    for (let index = 0; index < markers.length; index += 1) {
      const start = markers[index].index;
      const end = markers[index + 1]?.index ?? line.length;
      output.push(line.slice(start, end).trim());
    }
  }

  return output;
}

export function normalizeFaqMarkers(markdown) {
  const source = String(markdown);
  const lines = source.split(/\r?\n/);
  // Restrict repair to the fifth H2 section so examples or literal Q1/A1
  // labels in the article body are not mistaken for the FAQ.
  const { start: faqStart, end: faqEnd } = findFaqSection(lines);
  if (faqStart < 0) return source;
  const sourceFaqLines = lines.slice(faqStart, faqEnd);
  const faqLines = splitInlineFaqMarkerLines(sourceFaqLines);
  const output = [];
  let changed =
    faqLines.length !== sourceFaqLines.length || faqLines.some((line, index) => line !== sourceFaqLines[index]);
  let fenceCharacter = null;
  let fenceLength = 0;

  for (let index = 0; index < faqLines.length; index += 1) {
    const line = faqLines[index];
    const fence = line.match(/^ {0,3}(`{3,}|~{3,})/);
    if (fenceCharacter) {
      output.push(line);
      if (fence && fence[1][0] === fenceCharacter && fence[1].length >= fenceLength) {
        fenceCharacter = null;
        fenceLength = 0;
      }
      continue;
    }
    if (fence) {
      output.push(line);
      fenceCharacter = fence[1][0];
      fenceLength = fence[1].length;
      continue;
    }

    const match = faqMarkerPattern.exec(line);
    if (!match) {
      if (/^\s*\*\*\s*$/.test(line)) {
        changed = true;
        continue;
      }
      output.push(line);
      continue;
    }

    let prose = cleanFaqProse(match[3]);
    if (!prose) {
      let proseIndex = index + 1;
      while (proseIndex < faqLines.length && /^\s*(?:\*\*\s*)?$/.test(faqLines[proseIndex])) {
        proseIndex += 1;
      }
      const nextLine = faqLines[proseIndex] || '';
      if (
        proseIndex < faqLines.length &&
        !faqMarkerPattern.test(nextLine) &&
        !/^\s*#{1,6}\s+/.test(nextLine) &&
        !/^\s*(?:[-*+]|\d+[.)])\s+/.test(nextLine) &&
        !/^\s*>/.test(nextLine) &&
        !/^ {0,3}(?:`{3,}|~{3,})/.test(nextLine)
      ) {
        prose = cleanFaqProse(nextLine);
        index = proseIndex;
      }
    }

    const canonical = `**${match[1].toUpperCase()}${match[2]}.**${prose ? ` ${prose}` : ''}`;
    if (canonical !== line || (prose && !match[3].trim())) changed = true;

    while (output.length > 0 && output[output.length - 1] === '') output.pop();
    if (output.length > 0) output.push('');
    output.push(canonical);
  }

  if (!changed) return source;
  const newline = source.includes('\r\n') ? '\r\n' : '\n';
  return [...lines.slice(0, faqStart), ...output, ...lines.slice(faqEnd)].join(newline);
}

export function validateFaqStructure(markdown) {
  const lines = String(markdown).split(/\r?\n/);
  const { start, end } = findFaqSection(lines);
  const body = start < 0 ? '' : lines.slice(start, end).join('\n');
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
