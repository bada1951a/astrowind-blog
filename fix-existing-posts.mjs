import fs from 'fs';
import path from 'path';

const POSTS_BASE_DIR = path.resolve('src/data/post');

function cleanMarkdownPerfect(content) {
  const fmMatch = content.match(/^---[\s\S]*?---\n*/);
  if (!fmMatch) return content;

  const frontmatter = fmMatch[0];
  let body = content.slice(frontmatter.length);

  // 1. 인코딩 깨짐 복원
  body = body.replace(/ðŸ’¡/g, '💡');

  // 2. 본문 중간에 잘못 들어간 불필요한 헤딩 기호 제거
  body = body.replace(/^#{1,6}\s+/gm, '');

  const lines = body.split('\n');
  const processedLines = lines.map(line => {
    const trimmed = line.trim();

    // A. 메인 대제목(H2) 지정: 숫자로 시작하는 메인 섹션들 (예: "1. [Opening Story...", "2. [Root Cause...")
    if (/^[1-5]\.\s+\[/.test(trimmed)) {
      return `## ${trimmed}`;
    }

    // B. FAQ 섹션 타이틀을 완벽한 대제목(H2)으로 승격 (이 부분이 빠져서 일반 텍스트로 튀어나오던 문제를 근본적으로 해결)
    if (/^자주\s*묻는\s*질문/i.test(trimmed) || /^Frequently\s+Asked\s+Questions/i.test(trimmed)) {
      return `## ${trimmed}`;
    }

    // C. 단계별 소제목(H3) 지정: '[단계 1]', '방법 1', 'Step 1' 등
    if (/^(\[[단계\s0-9]+\]|방법\s*[0-9]+|Step\s*[0-9]+)/i.test(trimmed)) {
      const cleanTitle = trimmed.replace(/\*\*/g, '').trim();
      return `### ${cleanTitle}`;
    }

    // D. 본문 내 과도한 볼드체(굵은 글씨) 제거 (가독성 및 애드센스 최적화)
    if (/^[0-9]+\.\s+\*\*/.test(trimmed)) {
      return line.replace(/\*\*/g, '');
    }

    return line;
  });

  body = processedLines.join('\n');

  // 3. 공백 및 잔여 기호 정리
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
      const cleaned = cleanMarkdownPerfect(original);

      if (original !== cleaned) {
        fs.writeFileSync(filePath, cleaned, 'utf-8');
        totalUpdated++;
      }
    }
  }

  console.log(`\n🎉 마크다운 서식 최종 완벽 정돈 완료!`);
  console.log(`- 총 스캔된 파일: ${totalScanned}개`);
  console.log(`- 교정된 파일: ${totalUpdated}개`);
}

run();
