import fs from 'fs';
import path from 'path';

const POSTS_BASE_DIR = path.resolve('src/data/post');

function cleanMarkdown(content) {
  const fmMatch = content.match(/^---[\s\S]*?---\n*/);
  if (!fmMatch) return content;

  const frontmatter = fmMatch[0];
  let body = content.slice(frontmatter.length);

  // =========================================================================
  // 1. [핵심 해결] 문장 전체에 씌워진 ## 1. , ### 1. 헤딩을 단정한 일반 목록(1. )으로 강등
  //    (15자 이상의 긴 실행 설명 문장만 타겟팅하여 안전하게 처리)
  // =========================================================================
  body = body.replace(/^#{2,4}\s*([0-9]+[\.\)])\s*(.{15,})$/gm, '$1 $2');

  // 문장 전체가 **1. 화면 하단의...** 로 굵게 감싸진 경우 일반 목록으로 복원
  body = body.replace(/^\*\*([0-9]+[\.\)])\s*(.{15,})\*\*$/gm, '$1 $2');

  // =========================================================================
  // 2. [FAQ 고립 볼드 해결] 줄 전체에 홀로 남아 파싱을 깨뜨리는 ** 라인 완전 소거
  // =========================================================================
  body = body.replace(/^\s*\*\*\s*$/gm, '');

  // 3개 이상 연달아 붙은 별표(****) 표준화
  body = body.replace(/\*{3,}/g, '**');

  // =========================================================================
  // 3. [동일 헤딩 중복 방어] 같은 제목 라인이 연달아 복제된 경우 1개로 압축
  // =========================================================================
  body = body.replace(/^(#{1,3}\s+[^\n]+)\n+(?:\1\n+)+/gm, '$1\n\n');

  // =========================================================================
  // 4. [여백 정돈] 3줄 이상 불필요하게 벌어진 빈 줄을 단정한 2줄로 통일
  // =========================================================================
  body = body.replace(/\n{3,}/g, '\n\n').trim();

  return `${frontmatter}\n${body}\n`;
}

function run() {
  if (!fs.existsSync(POSTS_BASE_DIR)) {
    console.error(`❌ 경로를 찾을 수 없습니다: ${POSTS_BASE_DIR}`);
    return;
  }

  const langDirs = fs.readdirSync(POSTS_BASE_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

  let totalUpdated = 0;
  let totalScanned = 0;

  for (const lang of langDirs) {
    const targetDir = path.join(POSTS_BASE_DIR, lang);
    if (!fs.existsSync(targetDir)) continue;

    const files = fs.readdirSync(targetDir).filter(f => f.endsWith('.md'));

    for (const file of files) {
      totalScanned++;
      const filePath = path.join(targetDir, file);
      const original = fs.readFileSync(filePath, 'utf-8');
      const cleaned = cleanMarkdown(original);

      if (original !== cleaned) {
        fs.writeFileSync(filePath, cleaned, 'utf-8');
        totalUpdated++;
      }
    }
  }

  console.log(`\n🎉 전수 교정 완료!`);
  console.log(`- 전체 스캔된 글: ${totalScanned}개`);
  console.log(`- 문법 오류 교정된 글: ${totalUpdated}개`);
}

run();
