export function normalizeBoldWhitespace(markdown) {
  return String(markdown).replace(/\*\*[ \t]*([^*\r\n]*?)[ \t]*\*\*/g, (_match, content) => {
    return '**' + content.trim() + '**';
  });
}
