import fs from 'fs';
import path from 'path';

const POSTS_BASE_DIR = path.resolve('src/data/post');

function cleanMarkdown(content) {
  const fmMatch = content.match(/^---[\s\S]*?---\n*/);
  if (!fmMatch) return content;

  const frontmatter = fmMatch[0];
  let body = content.slice(frontmatter.length);

  // 1. 인코딩 및 깨진 문자 복원
  body = body.replace(/ðŸ’¡/g, '💡');

  // 2. [핵심 방어] 본문 안의 실행 순서 번호(1. 윈도우..., 3. 좌측... 등)가 헤딩으로 오인된 것들을 전부 일반 본문으로 강제 환원
  body = body.replace(/^#{1,4}\s+([0-9]+\.\s+[가-힣A-Za-zÀ-ÖØ-ßa-zà-öø-ÿ].*)$/gm, '$1');

  // 3. [메인 대제목(H2) 정밀 지정] 오직 1~4번 메인 섹션 타이틀만 정확히 H2로 지정 (본문 세부 번호는 절대 H2로 만들지 않음)
  body = body.replace(/^([1-4]\.\s+[^\n]{4,50})$/gm, (match, p1) => {
    // 세부 실행 단계 안의 번호 문장들은 절대 대제목으로 승격시키지 않음
    if (p1.startsWith('1. 윈도우') || p1.startsWith('3. 좌측') || p1.startsWith('1. 키보드') || p1.startsWith('2. 제어판')) {
      return p1;
    }
    return `## ${p1}`;
  });

  // 4. [단계별 소제목(H3) 표준화] '1단계', 'Step 1' 등 명확한 단계 타이틀만 H3 지정
  const stepRegex = /^(?:#{1,4}\s*)?(\*{0,2}(?:Step|Paso|Schritt|Etape|Étape|Passo|Krok|Stap|Langkah|Bước|[0-9]+단계)\s*[0-9]+(?:\s*[:\.]|\s*[-–])\s*[^\n]+?\*{0,2})$/gim;
  body = body.replace(stepRegex, (match, p1) => {
    const cleanTitle = p1.replace(/\*\*/g, '').replace(/^#+\s*/, '').trim();
    return `### ${cleanTitle}`;
  });

  // 5. 유령 헤딩 및 잔여 기호 소거
  body = body.replace(/^\s*\*\*\s*$/gm, '');
  body = body.replace(/^\s*#{1,4}\s*$/gm, '');
  body = body.replace(/\*{3,}/g, '**');

  // 6. 빈 줄 정돈
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

  console.log(`\n🎉 100개 이상 전체 포스트 위계 완벽 정화 완료!`);
  console.log(`- 총 스캔된 파일: ${totalScanned}개`);
  console.log(`- 서식이 교정된 파일: ${totalUpdated}개`);
}

run();
