import fs from 'fs';
import path from 'path';

const POSTS_BASE_DIR = path.resolve('src/data/post');

function cleanMarkdownAdsenseReady(content) {
  const fmMatch = content.match(/^---[\s\S]*?---\n*/);
  if (!fmMatch) return content;

  const frontmatter = fmMatch[0];
  let body = content.slice(frontmatter.length);

  // 1. 인코딩 깨짐 복원
  body = body.replace(/ðŸ’¡/g, '💡');

  const lines = body.split('\n');
  let inCodeBlock = false;

  const processedLines = lines.map(line => {
    // 코드 블록 내부 보호
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      return line;
    }
    if (inCodeBlock) return line;

    // 기존에 잘못 붙은 헤딩 기호(#) 일단 모두 리셋
    let cleanLine = line.replace(/^#{1,6}\s+/, '').trim();
    if (!cleanLine) return '';

    // [핵심 안전 장치] 마침표(.)로 끝나거나 60자가 넘는 긴 문장은 100% 본문이므로 대제목에서 제외
    const isLongOrSentence = cleanLine.endsWith('.') || cleanLine.length > 60;

    // A. 진짜 대제목(H2) 판별
    const isH2Keyword = 
      /^자주\s*묻는\s*질문/i.test(cleanLine) ||
      /^Frequently\s+Asked\s+Questions/i.test(cleanLine) ||
      /Root\s*Cause/i.test(cleanLine) ||
      /Step-by-Step/i.test(cleanLine) ||
      /Expert\s*Advice/i.test(cleanLine) ||
      /실무\s*노트/i.test(cleanLine) ||
      /실무\s*예방\s*조언/i.test(cleanLine) ||
      /해결\s*가이드/i.test(cleanLine) ||
      /주요\s*원인/i.test(cleanLine);

    // 숫자로 시작하는 대단원 제목 (단, 문장형 설명이나 마침표가 포함된 본문 순번은 절대 제외)
    const isNumberedH2 = /^[1-5]\.\s+/.test(cleanLine) && !isLongOrSentence;

    if (isH2Keyword || isNumberedH2) {
      const titleText = cleanLine.replace(/\*\*/g, '').trim();
      return `\n\n## ${titleText}\n`;
    }

    // B. 소제목(H3) 판별 ([단계 1], Step 1 등)
    const isH3 = /^(\[[단계\s0-9]+\]|방법\s*[0-9]+|Step\s*[0-9]+)/i.test(cleanLine);
    if (isH3 && !isLongOrSentence) {
      const titleText = cleanLine.replace(/\*\*/g, '').trim();
      return `\n\n### ${titleText}\n`;
    }

    return line;
  });

  body = processedLines.join('\n');

  // 3. 공백 및 과도한 개행 정돈
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
      const cleaned = cleanMarkdownAdsenseReady(original);

      if (original !== cleaned) {
        fs.writeFileSync(filePath, cleaned, 'utf-8');
        totalUpdated++;
      }
    }
  }

  console.log(`\n🎉 애드센스 최적화 마크다운 최종 정돈 완료!`);
  console.log(`- 총 스캔된 파일: ${totalScanned}개`);
  console.log(`- 교정된 파일: ${totalUpdated}개`);
}

run();
