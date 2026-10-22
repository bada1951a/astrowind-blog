import fs from 'fs';
import path from 'path';

const POSTS_BASE_DIR = path.resolve('src/data/post');

function cleanBrokenMarkdown(content) {
  let cleaned = content;

  // 1) 문장 끝에 Q나 A가 띄어쓰기 없이 바로 붙어 있는 경우 무조건 두 줄 개행으로 강제 분리
  cleaned = cleaned.replace(/([^\n])\s*(Q[1-9]\.)/g, '$1\n\n$2');
  cleaned = cleaned.replace(/([^\n])\s*(A[1-9]\.)/g, '$1\n\n$2');

  // 2) FAQ 영역에서 Q와 A 블록이 꼬인 경우 완벽한 2줄 개행으로 정제 (볼드체 보호)
  cleaned = cleaned.replace(/\*\*Q([0-9]+)\.\s*([\s\S]*?)\*\*A\1\./g, (match, qNum, qText) => {
    return `**Q${qNum}. ${qText.trim()}**\n\n**A${qNum}.**`;
  });

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
          console.log(`✨ FAQ 서식 정제 완료: ${path.relative(process.cwd(), fullPath)}`);
        }
      }
    }
  }
}

console.log("🚀 과거 포스트 FAQ 줄바꿈 안전 정제 시작 (볼드체 보호)...");
processDirectory(POSTS_BASE_DIR);
console.log("🎉 모든 글의 정제가 완료되었습니다!");
