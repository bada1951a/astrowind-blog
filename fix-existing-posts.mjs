import fs from 'fs';
import path from 'path';

const POSTS_BASE_DIR = path.resolve('src/data/post');

function cleanMarkdown(content) {
  const fmMatch = content.match(/^---[\s\S]*?---\n*/);
  if (!fmMatch) return content;

  const frontmatter = fmMatch[0];
  let body = content.slice(frontmatter.length);

  // 1. [인코딩 및 깨진 문자 복원]
  body = body.replace(/ðŸ’¡/g, '💡');

  // 2. [단어 잘림 및 띄어쓰기 복원]
  body = body.replace(/sistem\n\na:/gi, 'sistema:');
  body = body.replace(/TerminalorCommand/g, 'Terminal or Command');
  body = body.replace(/clickRestart/g, 'click Restart');
  body = body.replace(/turn\s*onStorage/gi, 'turn on Storage');

  // 3. [대주제(H2) 깔끔한 표준화] 숫자. 형태로 시작하는 메인 섹션만 확실하게 H2 지정
  body = body.replace(/^([0-9]+\.\s+[^\n]{4,50})$/gm, '## $1');

  // 4. [단계별 소제목(H3) 표준화] '1단계', 'Step 1' 등 명확한 단계 타이틀만 H3 지정 (본문 리스트는 절대 건드리지 않음)
  const stepRegex = /^(?:#{1,4}\s*)?(\*{0,2}(?:Step|Paso|Schritt|Etape|Étape|Passo|Krok|Stap|Langkah|Bước|[0-9]+단계)\s*[0-9]+(?:\s*[:\.]|\s*[-–])\s*[^\n]+?\*{0,2})$/gim;
  body = body.replace(stepRegex, (match, p1) => {
    const cleanTitle = p1.replace(/\*\*/g, '').replace(/^#+\s*/, '').trim();
    return `### ${cleanTitle}`;
  });

  // 5. [유령 헤딩 및 잔여 기호 소거]
  body = body.replace(/^\s*\*\*\s*$/gm, '');
  body = body.replace(/^\s*#{1,4}\s*$/gm, '');
  body = body.replace(/\*{3,}/g, '**');

  // 6. [동일 헤딩 중복 방지 및 빈 줄 정돈]
  body = body.replace(/^(#{1,3}\s+[^\n]+)\n+(?:\1\n+)+/gm, '$1\n\n');
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

  console.log(`\n🎉 12개국 전체 포스트 최종 정화 완료!`);
  console.log(`- 총 스캔된 파일: ${totalScanned}개`);
  console.log(`- 서식이 교정된 파일: ${totalUpdated}개`);
}

run();
