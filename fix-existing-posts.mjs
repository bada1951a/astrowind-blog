import fs from 'fs';
import path from 'path';

const POSTS_BASE_DIR = path.resolve('src/data/post');

function cleanMarkdownSafe(content) {
  const fmMatch = content.match(/^---[\s\S]*?---\n*/);
  if (!fmMatch) return content;

  const frontmatter = fmMatch[0];
  let body = content.slice(frontmatter.length);

  // 1. 인코딩 깨짐 복원
  body = body.replace(/ðŸ’¡/g, '💡');

  // 2. 본문 중간에 잘못 들어간 불필요한 헤딩 기호 초기화
  body = body.replace(/^#{1,6}\s+/gm, '');

  const lines = body.split('\n');
  const processedLines = lines.map(line => {
    const trimmed = line.trim();

    if (!trimmed) return line;

    // A. 진짜 대제목(H2) 판별: 본문 속 단순 번호 매기기(예: "1. 설정에서...", "3. 클립보드...")는 절대 제외하고,
    // 명확한 대단원 키워드 및 문서 구조 타이틀만 정확히 타겟팅
    const isTrueH2 = 
      /^자주\s*묻는\s*질문/i.test(trimmed) ||
      /^Frequently\s+Asked\s+Questions/i.test(trimmed) ||
      /실무\s*노트/i.test(trimmed) ||
      /실무\s*예방\s*조언/i.test(trimmed) ||
      /전문가가\s*전하는/i.test(trimmed) ||
      /주요\s*원인/i.test(trimmed) ||
      /해결\s*가이드/i.test(trimmed) ||
      /Root\s*Cause\s*Breakdown/i.test(trimmed) ||
      /Step-by-Step\s*Resolution/i.test(trimmed) ||
      /Expert\s*Advice/i.test(trimmed) ||
      // 숫자로 시작하더라도 문장형 설명이 아닌 단원 제목 형태인 경우만 허용
      (/^[1-5]\.\s+\[/.test(trimmed) && !trimmed.endsWith('.'));

    if (isTrueH2) {
      if (trimmed.endsWith('.') && trimmed.length > 40) {
        return line; // 긴 서술형 문장은 대제목에서 제외
      }
      const cleanTitle = trimmed.replace(/^#+\s*/, '').replace(/\*\*/g, '').trim();
      return `## ${cleanTitle}`;
    }

    // B. 소제목(H3) 판별 패턴
    const isH3 = /^(\[[단계\s0-9]+\]|방법\s*[0-9]+|Step\s*[0-9]+)/i.test(trimmed);
    if (isH3) {
      const cleanTitle = trimmed.replace(/^#+\s*/, '').replace(/\*\*/g, '').trim();
      return `### ${cleanTitle}`;
    }

    return line;
  });

  body = processedLines.join('\n');

  // 3. 공백 및 잔여 기호 정돈
  body = body.replace(/^\s*\*\*\s*$/gm, '');
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
      const cleaned = cleanMarkdownSafe(original);

      if (original !== cleaned) {
        fs.writeFileSync(filePath, cleaned, 'utf-8');
        totalUpdated++;
      }
    }
  }

  console.log(`\n🎉 안전 모드 마크다운 정돈 완료!`);
  console.log(`- 총 스캔된 파일: ${totalScanned}개`);
  console.log(`- 교정된 파일: ${totalUpdated}개`);
}

run();
