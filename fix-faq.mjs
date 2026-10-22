import fs from 'fs';
import path from 'path';

const POSTS_ROOT = path.resolve('src/data/post');

function fixMarkdownFiles(dir) {
  if (!fs.existsSync(dir)) {
    console.log(`⚠️ 디렉토리가 존재하지 않습니다: ${dir}`);
    return;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      fixMarkdownFiles(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      let content = fs.readFileSync(fullPath, 'utf-8');
      
      // FAQ 영역에서 Q와 A가 한 줄로 붙어 있는 현상을 완벽한 2줄 개행으로 강제 분리
      let updated = content.replace(/\*\*Q([0-9]+)\.\s*([\s\S]*?)\*\*A\1\./g, (match, qNum, qText) => {
        return `**Q${qNum}. ${qText.trim()}**\n\n**A${qNum}.**`;
      });

      if (content !== updated) {
        fs.writeFileSync(fullPath, updated, 'utf-8');
        console.log(`✨ 정제 완료: ${fullPath}`);
      }
    }
  }
}

console.log("🧹 과거 발행된 모든 마크다운 파일 FAQ 서식 일괄 정제 시작...");
fixMarkdownFiles(POSTS_ROOT);
console.log("🎉 모든 파일 정리가 완료되었습니다!");
