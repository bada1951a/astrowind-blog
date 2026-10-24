import fs from 'fs';
import path from 'path';

const POSTS_BASE_DIR = path.resolve('src/data/post');

function cleanAndRestructureMarkdown(content) {
  const fmMatch = content.match(/^---[\s\S]*?---\n*/);
  if (!fmMatch) return content;

  const frontmatter = fmMatch[0];
  let body = content.slice(frontmatter.length);

  // 1. 인코딩 및 깨진 문자 복원
  body = body.replace(/ðŸ’¡/g, '💡');

  // 2. [핵심] 기존에 본문 안에서 헤딩으로 오인되어 붙은 모든 불필요한 '#' 기호들을 제거하여 순수 텍스트로 환원
  body = body.replace(/^#{1,6}\s+/gm, '');

  // 3. 줄 단위로 나누어 위계 재부팅
  const lines = body.split('\n');
  const processedLines = lines.map(line => {
    const trimmed = line.trim();

    // A. 메인 대제목(H2) 지정: 숫자로 시작하는 주요 섹션 타이틀 (예: "1. 시스템 종료...", "2. 빠른 시작...", "4. 자주 묻는 질문 (FAQ)")
    if (/^[1-4]\.\s+[가-힣A-Za-z\s\(\)]+$/.test(trimmed) && trimmed.length < 60) {
      return `## ${trimmed}`;
    }

    // B. 단계별 소제목(H3) 지정: '1단계', '2단계', '방법 1', '방법 2' 등
    if (/^(?:Step|Paso|Schritt|Etape|Étape|Passo|Krok|Stap|Langkah|Bước|[0-9]+단계|방법\s*[0-9]+)/i.test(trimmed)) {
      const cleanTitle = trimmed.replace(/\*\*/g, '').replace(/^#+\s*/, '').trim();
      return `### ${cleanTitle}`;
    }

    // C. 나머지는 절대 헤딩이 되지 않는 일반 본문 텍스트 유지
    return line;
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
      const cleaned = cleanAndRestructureMarkdown(original);

      if (original !== cleaned) {
        fs.writeFileSync(filePath, cleaned, 'utf-8');
        totalUpdated++;
      }
    }
  }

  console.log(`\n🎉 100개 이상 전체 포스트 완전 리셋 및 재정렬 완료!`);
  console.log(`- 총 스캔된 파일: ${totalScanned}개`);
  console.log(`- 서식이 교정된 파일: ${totalUpdated}개`);
}

run();
