import fs from 'fs';
import path from 'path';

const POSTS_BASE_DIR = path.resolve('src/data/post');

function sanitizeMarkdownFormatting(content) {
  let cleaned = content;

  cleaned = cleaned.replace(/\*{3,}/g, '**');
  cleaned = cleaned.replace(/\*\*\[([^\]]+)\]\*\*/g, '[**$1**]');
  cleaned = cleaned.replace(/\*\*"([^"]+)"\*\*/g, '"**$1**"');
  cleaned = cleaned.replace(/\*\*'([^']+)'\*\*/g, '\'**$1**\'');
  cleaned = cleaned.replace(/\*\*\s+([^\*\n]+?)\s+\*\*/g, '**$1**');
  cleaned = cleaned.replace(/\*\*\s+([^\*\n]+?)\*\*/g, '**$1**');
  cleaned = cleaned.replace(/\*\*([^\*\n]+?)\s+\*\*/g, '**$1**');

  const lines = cleaned.split('\n');
  const fixedLines = lines.map(line => {
    if (line.trim().startsWith('```') || line.trim().startsWith('`')) return line;
    const matches = line.match(/\*\*/g);
    if (matches && matches.length % 2 !== 0) {
      const lastIdx = line.lastIndexOf('**');
      return line.slice(0, lastIdx) + line.slice(lastIdx + 2);
    }
    return line;
  });

  return fixedLines.join('\n');
}

function processDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) return;
  const items = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(dirPath, item.name);
    if (item.isDirectory()) {
      processDirectory(fullPath);
    } else if (item.isFile() && item.name.endsWith('.md')) {
      const fileContent = fs.readFileSync(fullPath, 'utf-8');
      const fmMatch = fileContent.match(/^---[\s\S]*?---\n*/);

      if (fmMatch) {
        const frontmatter = fmMatch[0];
        const body = fileContent.slice(frontmatter.length);
        const cleanedBody = sanitizeMarkdownFormatting(body);

        if (body !== cleanedBody) {
          fs.writeFileSync(fullPath, `${frontmatter}${cleanedBody}`, 'utf-8');
          console.log(`✨ 서식 정제 완료: ${path.relative(process.cwd(), fullPath)}`);
        }
      }
    }
  }
}

console.log("🚀 전체 포스트 마크다운 ** 서식 일괄 정제 시작...");
processDirectory(POSTS_BASE_DIR);
console.log("🎉 모든 글의 서식 정제가 완료되었습니다!");
