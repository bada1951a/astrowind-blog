import fs from 'fs';
import path from 'path';

const POSTS_BASE_DIR = path.resolve('src/data/post');

function cleanBrokenMarkdown(content) {
  let cleaned = content;

  // 1) Q1, Q2, Q3, A1, A2, A3 앞에 줄바꿈이 없어서 한 줄로 뭉친 경우 분리
  cleaned = cleaned.replace(/([^\n])\s*(Q[1-3]\.)/g, '$1\n\n$2');
  cleaned = cleaned.replace(/([^\n])\s*(A[1-3]\.)/g, '$1\n\n$2');

  // 2) 본문에 흉하게 노출되는 모든 별표(** 및 ***) 기호 완전 제거
  cleaned = cleaned.replace(/\*{2,}/g, '');

  return cleaned;
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
          console.log(`✨ 서식 정제 완료: ${path.relative(process.cwd(), fullPath)}`);
        }
      }
    }
  }
}

console.log("🚀 전체 포스트 마크다운 ** 제거 및 FAQ 줄바꿈 정제 시작...");
processDirectory(POSTS_BASE_DIR);
console.log("🎉 모든 글의 정제가 완료되었습니다!");
