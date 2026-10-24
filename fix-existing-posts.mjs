import fs from 'fs';
import path from 'path';

const POSTS_BASE_DIR = path.resolve('src/data/post');

function cleanMarkdown(content) {
  const fmMatch = content.match(/^---[\s\S]*?---\n*/);
  if (!fmMatch) return content;

  const frontmatter = fmMatch[0];
  let body = content.slice(frontmatter.length);

  // 1. [인코딩 복원] 깨진 전구 이모지 복원
  body = body.replace(/ðŸ’¡/g, '💡');

  // 2. [단어 잘림 및 띄어쓰기 복원]
  body = body.replace(/sistem\n\na:/gi, 'sistema:');
  body = body.replace(/TerminalorCommand/g, 'Terminal or Command');
  body = body.replace(/clickRestart/g, 'click Restart');
  body = body.replace(/turn\s*onStorage/gi, 'turn on Storage');

  // 3. [대주제(H2) 표준화 및 역슬래시 제거]
  body = body.replace(/^([0-9]+(?:\\\.|\.)\s+[^\n]{4,45})$/gm, (match) => {
    const cleanTitle = match.replace(/\\\./g, '.').trim();
    return `## ${cleanTitle}`;
  });

  // 주요 언어별 대주제 키워드 H2 승격 보장
  body = body.replace(/^#{3}\s*(Root Cause|Step-by-Step Resolution|Warum läuft|Langkah-Langkah|Akar Masalah|Causes racines|Häufig gestellte|자주 묻는 질문|FAQ|Preguntas frecuentes|Chronologie|Guida pratica)/gim, '## $1');
  body = body.replace(/^(자주 묻는 질문\s*\(?FAQ\)?|FAQ|Frequently Asked Questions|Chronologie de l'intervention|Guide de survie|Guida pratica: come rimuovere)/gim, '## $1');

  // 4. [핵심 위계 교정] 본문 내 번호 매겨진 원인/이유 항목(예: 1. Conflitto..., 2. Coda...)을 소제목(H3)으로 강제 격상
  //    - 콜론(:)이나 설명이 포함된 10자~70자 사이의 번호 항목을 완벽한 독립 소제목으로 변환
  body = body.replace(/^([1-3]\.\s+[A-ZÀ-ÖØ-ßa-zà-öø-ÿ가-힣][^\n]{10,70}[:：][^\n]*)$/gm, '### $1');

  // 5. [12개국 단계별 소제목(H3) 표준화] (Step, Paso, Schritt, Langkah, 1단계 등)
  const stepRegex = /^(?:#{1,4}\s*)?(\*{0,2}(?:Step|Paso|Schritt|Etape|Étape|Passo|Krok|Stap|Langkah|Bước|[0-9]+단계)\s*[0-9]+(?:\s*[:\.]|\s*[-–])\s*[^\n]+?\*{0,2})$/gim;
  body = body.replace(stepRegex, (match, p1) => {
    const cleanTitle = p1.replace(/\ts*/g, '').replace(/\*\*/g, '').replace(/^#+\s*/, '').trim();
    return `### ${cleanTitle}`;
  });

  // 6. [유령 헤딩 및 잔여 기호 소거]
  body = body.replace(/^\s*\*\*\s*$/gm, '');
  body = body.replace(/^\s*#{1,4}\s*$/gm, '');
  body = body.replace(/\*{3,}/g, '**');

  // 7. [동일 헤딩 중복 방지 및 빈 줄 정돈]
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

  console.log(`\n🎉 12개국 전체 포스트 최종 전수 교정 완료!`);
  console.log(`- 총 스캔된 파일: ${totalScanned}개`);
  console.log(`- 서식이 교정된 파일: ${totalUpdated}개`);
}

run();
