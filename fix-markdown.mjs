import fs from 'fs';
import path from 'path';

const POSTS_BASE_DIR = path.resolve('src/data/post');

function cleanBrokenMarkdown(content) {
  let cleaned = content;

  // 1) Q와 A 사이에 문장이 붙어 있는 경우 강제 두 줄 개행
  cleaned = cleaned.replace(/([^\n])\s*(Q[1-9]\.)/g, '$1\n\n$2');
  cleaned = cleaned.replace(/([^\n])\s*(A[1-9]\.)/g, '$1\n\n$2');

  // 2) FAQ 영역에서 양 끝에 붙은 찌꺼기 별표 정제
  cleaned = cleaned.replace(/\*\*Q([0-9]+)\.\s*([\s\S]*?)\*\*/g, (match, qNum, qText) => {
    return `Q${qNum}. ${qText.trim()}`;
  });

  // 3) 문서 전체에 남아 있는 모든 마크다운 볼드(**) 기호 일괄 제거
  const lines = cleaned.split('\n');
  const fixedLines = lines.map(line => {
    let trimmed = line.trim();
    if (trimmed === '**') return '';
    if (trimmed.startsWith('```') || trimmed.startsWith('`')) return line;
    return line.replace(/\*\*/g, '');
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
        const cleanedBody = cleanBrokenMarkdown(body);

        if (body !== cleanedBody) {
          fs.writeFileSync(fullPath, `${frontmatter}${cleanedBody}`, 'utf-8');
          console.log(`✨ 마크다운 찌꺼기 제거 완료: ${path.relative(process.cwd(), fullPath)}`);
        }
      }
    }
  }
}

console.log("🚀 과거 포스트 볼드 찌꺼기 일괄 제거 시작...");
processDirectory(POSTS_BASE_DIR);
console.log("🎉 모든 과거 글의 정제가 완료되었습니다!");
