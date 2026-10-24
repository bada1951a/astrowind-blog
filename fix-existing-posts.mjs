import fs from 'fs';
import path from 'path';

const POSTS_BASE_DIR = path.resolve('src/data/post');

function cleanMarkdown(content) {
  const fmMatch = content.match(/^---[\s\S]*?---\n*/);
  if (!fmMatch) return content;

  const frontmatter = fmMatch[0];
  let body = content.slice(frontmatter.length);

  // 1. [인코딩 및 깨진 특수문자 복원]
  body = body.replace(/ðŸ’¡/g, '💡');

  // 2. [단어 잘림 복원]
  body = body.replace(/sistem\n\na:/gi, 'sistema:');

  // 3. [12개국 단계별 소제목 정규화]
  //    Paso 1:, Step 1:, Etape 1:, Langkah 1:, 1단계: 등을 정식 소제목(###)으로 승격
  const stepRegex = /^(?:#{1,4}\s*)?(\*{0,2}(?:Step|Paso|Schritt|Etape|Étape|Passo|Krok|Stap|Langkah|Bước|[0-9]+단계)\s*[0-9]+(?:\s*[:\.]|\s*[-–])\s*[^\n]+?\*{0,2})$/gim;
  body = body.replace(stepRegex, (match, p1) => {
    const cleanTitle = p1.replace(/\*\*/g, '').replace(/^#+\s*/, '').trim();
    return `### ${cleanTitle}`;
  });

  // 4. [거대 폰트화된 본문 실행 리스트 정상화]
  //    15자 이상 긴 설명 문장 앞에 ## 1. 이 붙은 것은 일반 번호 리스트로 강등
  body = body.replace(/^#{2,4}\s*([0-9]+[\.\)])\s*(.{15,})$/gm, '$1 $2');
  body = body.replace(/^\*\*([0-9]+[\.\)])\s*(.{15,})\*\*$/gm, '$1 $2');

  // 5. [FAQ 고립된 ** 찌꺼기 및 유령 헤딩(#) 완전 소거]
  body = body.replace(/^\s*\*\*\s*$/gm, '');
  body = body.replace(/^\s*#{1,4}\s*$/gm, '');
  body = body.replace(/\*{3,}/g, '**');

  // 6. [동일 헤딩 중복 방어 및 빈 줄 정돈]
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

  console.log(`\n🎉 12개국 전수 교정 완료!`);
  console.log(`- 전체 스캔된 글: ${totalScanned}개`);
  console.log(`- 문법 오류 교정된 글: ${totalUpdated}개`);
}

run();
