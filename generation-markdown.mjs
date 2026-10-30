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
