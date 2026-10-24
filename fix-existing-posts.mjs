import fs from 'fs';
import path from 'path';

const POSTS_BASE_DIR = path.resolve('src/data/post');

function cleanMarkdownFinal(content) {
  const fmMatch = content.match(/^---[\s\S]*?---\n*/);
  if (!fmMatch) return content;

  const frontmatter = fmMatch[0];
  let body = content.slice(frontmatter.length);

  // 1. 인코딩 및 깨진 문자 복원
  body = body.replace(/ðŸ’¡/g, '💡');

  // 2. [핵심] 기존에 본문 안에서 헤딩으로 오인되어 붙은 모든 '#' 기호를 제거하여 순수 텍스트로 환원
  body = body.replace(/^#{1,6}\s+/gm, '');

  // 3. 줄 단위 분석 및 대제목/소제목만 엄격하게 재적용
  const lines = body.split('\n');
  const processedLines = lines.map(line => {
    const trimmed = line.trim();

    // A. 진짜 대제목(H2) 지정: 숫자로 시작하며 메인 섹션 타이틀인 경우만 허용 (본문 내 실행 번호는 절대 제외)
    // 예: "1. 시스템 종료...", "2. 빠른 시작...", "3. Step-by-Step...", "4. Frequently Asked Questions" 등
    if (/^[1-5]\.\s+[A-Za-z가-힣\s\-]+$/.test(trimmed) && trimmed.length < 60) {
      // 본문 안의 설명 문장(예: "1. 사내 IT 보안 감사팀의...")은 길이가 길거나 마침표/서술어로 끝나므로 대제목에서 철저히 제외
      if (!trimmed.endsWith('.') && !trimmed.endsWith('상황') && !trimmed.includes('분기별')) {
        return `## ${trimmed}`;
      }
    }

    // B. 소제목(H3) 지정: '[단계 1]', '방법 1', 'Step 1' 등 명시적인 단계/방법 키워드만 허용
    if (/^(\[[단계\s0-9]+\]|방법\s*[0-9]+|Step\s*[0-9]+)/i.test(trimmed)) {
      // 소제목 안의 과도한 볼드체 제거
      const cleanTitle = trimmed.replace(/\*\*/g, '').replace(/^#+\s*/, '').trim();
      return `### ${cleanTitle}`;
    }

    // C. 과도한 볼드체(굵은 글씨) 남발 완화: 본문 내 리스트 항목의 불필요한 볼드 처리 제거 (선택적용)
    // 예: "1. **작업 관리자 호출:** ..." -> "1. 작업 관리자 호출: ..."
    let cleanedLine = line;
    if (/^[0-9]+\.\s+\*\*/.test(trimmed)) {
      cleanedLine = line.replace(/\*\*/g, '');
    }

    // D. 그 외의 모든 문장은 일반 본문 유지
    return cleanedLine;
  });

  body = processedLines.join('\n');

  // 4. 잔여 기호 및 과도한 공백 정돈
  body = body.replace(/^\s*\*\*\s*$/gm, '');
  body = body.replace(/\*{3,}/g, '**');
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
      const cleaned = cleanMarkdownFinal(original);

      if (original !== cleaned) {
        fs.writeFileSync(filePath, cleaned, 'utf-8');
        totalUpdated++;
      }
    }
  }

  console.log(`\n🎉 전체 포스트 대소제목 및 볼드 정돈 완료!`);
  console.log(`- 총 스캔된 파일: ${totalScanned}개`);
  console.log(`- 서식이 교정된 파일: ${totalUpdated}개`);
}

run();
