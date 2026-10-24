import fs from 'fs';
import path from 'path';

const POSTS_BASE_DIR = path.resolve('src/data/post');

function repairMarkdownPost(content) {
  const fmMatch = content.match(/^---[\s\S]*?---\n*/);
  if (!fmMatch) return content;

  const frontmatter = fmMatch[0];
  let body = content.slice(frontmatter.length);

  // 1. 주요 섹션 번호 패턴(1., 2., 3., 4., 5.)이 일반 줄글 첫머리에 있을 때 소제목(## )으로 승격
  body = body.replace(/^(?:\s*|\n*)([1-5]\.\s+[^\n]+)/gm, '\n\n## $1\n\n');

  // 중복된 마크다운 샵 정리 (## ## -> ##)
  body = body.replace(/#{2,}\s*#{2,}/g, '##');

  // 2. Q&A 머리말 강제 2줄 개행 분리
  body = body.replace(/([^\n])\s*(\*\*?[QA][0-9]*\s*[:.]\*\*?)/gi, '$1\n\n$2');
  body = body.replace(/([^\n])\s+([QA][0-9]*\s*[:.])/g, '$1\n\n$2');
  body = body.replace(/([.!?])\s*(\*\*?[QA][0-9]*\s*[:.]\*\*?|[0-9]+\.\s+)/gi, '$1\n\n$2');

  // 3. 물음표 뒤 띄어쓰기 복구 (?단어 -> ? 단어)
  body = body.replace(/\?([A-Za-z\u00C0-\u024F\u1EA0-\u1EF9가-힣])/g, '? $1');

  // 4. 과도한 빈 줄 정리
  body = body.replace(/\n{3,}/g, '\n\n').trim();

  return `${frontmatter}\n${body}\n`;
}

function processAllPosts() {
  if (!fs.existsSync(POSTS_BASE_DIR)) {
    console.error(`❌ 경로를 찾을 수 없습니다: ${POSTS_BASE_DIR}`);
    return;
  }

  const langDirs = fs.readdirSync(POSTS_BASE_DIR, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  let totalUpdated = 0;

  for (const lang of langDirs) {
    const targetDir = path.join(POSTS_BASE_DIR, lang);
    const files = fs.readdirSync(targetDir).filter(f => f.endsWith('.md'));

    for (const file of files) {
      const filePath = path.join(targetDir, file);
      const originalText = fs.readFileSync(filePath, 'utf-8');
      const repairedText = repairMarkdownPost(originalText);

      if (originalText !== repairedText) {
        fs.writeFileSync(filePath, repairedText, 'utf-8');
        totalUpdated++;
      }
    }
  }

  console.log(`\n🎉 총 ${totalUpdated}개의 포스트 서식 복구 완료!`);
}

processAllPosts();
