import fs from 'fs';
import path from 'path';

const POSTS_BASE_DIR = path.resolve('src/data/post');

/**
 * 기존 뭉개진 마크다운 글 복구 함수
 */
function repairMarkdownPost(content) {
  const fmMatch = content.match(/^---[\s\S]*?---\n*/);
  if (!fmMatch) return content;

  const frontmatter = fmMatch[0];
  let body = content.slice(frontmatter.length);

  // 1. 주요 섹션 번호 패턴(1., 2., 3., 4., 5.)이 일반 줄글이나 단락 첫머리에 있을 때 소제목(## )으로 승격
  // 예: "2. 원인 분석" 또는 "2. Root Cause" 등을 소제목으로 복원
  body = body.replace(/^(?:\s*|\n*)([1-5]\.\s+[^\n]+)/gm, '\n\n## $1\n\n');

  // 혹시 이미 ## 이 붙어있는 곳에 중복 적용된 경우 정리 (## ## -> ##)
  body = body.replace(/#{2,}\s*#{2,}/g, '##');

  // 2. Q&A 머리말 강제 줄바꿈 및 분리
  // "Q1.", "Q:", "A1.", "A:" 등이 앞 문장과 붙어있는 경우 강제 2줄 개행
  body = body.replace(/([^\n])\s*(\*\*?[QA][0-9]*\s*[:.]\*\*?)/gi, '$1\n\n$2');
  body = body.replace(/([^\n])\s+([QA][0-9]*\s*[:.])/g, '$1\n\n$2');
  body = body.replace(/([.!?])\s*(\*\*?[QA][0-9]*\s*[:.]\*\*?|[0-9]+\.\s+)/gi, '$1\n\n$2');

  // 3. 물음표 뒤 띄어쓰기 복구 (?단어 -> ? 단어)
  body = body.replace(/\?([A-Za-z\u00C0-\u024F\u1EA0-\u1EF9가-힣])/g, '? $1');

  // 4. 불필요하게 3줄 이상 벌어진 빈 줄 정리
  body = body.replace(/\n{3,}/g, '\n\n').trim();

  return `${frontmatter}\n${body}\n`;
}

/**
 * 모든 언어 폴더 순회 및 일괄 업데이트
 */
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
