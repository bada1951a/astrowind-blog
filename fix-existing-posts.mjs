import fs from 'fs';
import path from 'path';

const POSTS_BASE_DIR = path.resolve('src/data/post');

function cleanMarkdownStrict(content) {
  const fmMatch = content.match(/^---[\s\S]*?---\n*/);
  if (!fmMatch) return content;

  const frontmatter = fmMatch[0];
  let body = content.slice(frontmatter.length);

  // 1. 인코딩 및 깨진 문자 복원
  body = body.replace(/ðŸ’¡/g, '💡');

  // 2. [완전 방어] 기존에 본문 안에서 헤딩으로 오인되어 붙은 모든 '#' 기호를 제거하여 순수 텍스트로 환원
  body = body.replace(/^#{1,6}\s+/gm, '');

  // 3. 줄 단위 분석 및 엄격한 위계 재적용
  const lines = body.split('\n');
  const processedLines = lines.map(line => {
    const trimmed = line.trim();

    // A. 진짜 메인 대제목(H2) 지정: 오직 정해진 핵심 대주제 키워드를 포함한 1~4번 타이틀만 허용 (본문 내 순서 번호는 절대 H2로 만들지 않음)
    if (/^[1-4]\.\s+(시스템 종료|빠른 시작|오디오 서비스|윈도우 11|Root Cause|Step-by-Step|Expert Advice|Frequently Asked Questions)/i.test(trimmed)) {
      return `## ${trimmed}`;
    }

    // B. 단계별 소제목(H3) 지정: '[단계 1]', '방법 1' 등 명시적인 키워드만 H3 허용
    if (/^(\[[단계\s0-9]+\]|방법\s*[0-9]+|Step\s*[0-9]+)/i.test(trimmed)) {
      const cleanTitle = trimmed.replace(/\*\*/g, '').replace(/^#+\s*/, '').trim();
      return `### ${cleanTitle}`;
    }

    // C. 그 외의 모든 문장(본문 내 '1. 윈도우...', '2. 제어판...' 등)은 절대 헤딩으로 바꾸지 않고 일반 본문 유지
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
      const cleaned = cleanMarkdownStrict(original);

      if (original !== cleaned) {
        fs.writeFileSync(filePath, cleaned, 'utf-8');
        totalUpdated++;
      }
    }
  }

  console.log(`\n🎉 100개 이상 전체 포스트 엄격 정화 완료!`);
  console.log(`- 총 스캔된 파일: ${totalScanned}개`);
  console.log(`- 서식이 교정된 파일: ${totalUpdated}개`);
}

run();
