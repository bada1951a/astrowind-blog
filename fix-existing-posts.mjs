import fs from 'fs';
import path from 'path';

const POSTS_BASE_DIR = path.resolve('src/data/post');

function cleanAndRepairPost(content, lang) {
  const fmMatch = content.match(/^---[\s\S]*?---\n*/);
  if (!fmMatch) return content;

  const frontmatter = fmMatch[0];
  let body = content.slice(frontmatter.length);

  // =========================================================================
  // 1. [한국어 ko] 중복 누적된 소제목 라인들을 정식 마크다운 헤딩(##) 1개로 단일화
  // =========================================================================
  if (lang === 'ko') {
    body = body.replace(/(?:#*\s*[0-9]\.\s*시스템 종료 불량의 근본 원인 분석[\s\n]*)+/g, '\n\n## 1. 시스템 종료 불량의 근본 원인 분석\n\n');
    body = body.replace(/(?:#*\s*[0-9]\.\s*빠른 시작.*단계별 해결[법번][\s\n]*)+/g, '\n\n## 2. 빠른 시작 끄기 및 전원 설정 단계별 해결법\n\n');
    body = body.replace(/(?:#*\s*[0-9]\.\s*엔지니어 실무 점검 및 주의사항[\s\n]*)+/g, '\n\n## 3. 엔지니어 실무 점검 및 주의사항\n\n');
    body = body.replace(/(?:#*\s*[0-9]\.\s*자주 묻는 질문\s*\(FAQ\)[\s\n]*)+/g, '\n\n## 4. 자주 묻는 질문 (FAQ)\n\n');
  }

  // =========================================================================
  // 2. [전 세계 공통] 인용구(Callout) 마크다운 문법 정상화 (> 💡 )
  // =========================================================================
  const noteKeywords = 'Quick Diagnostic Tip|Pro Technical Note|Nota del técnico|Consejo profesional|Catatan Teknisi|Tips Tambahan|현장 엔지니어 노트|대량 데이터';
  // 앞뒤에 붙은 불필요한 따옴표나 별표 기호 제거
  body = body.replace(new RegExp(`^\\s*[\\*"\\”\']\\s*(${noteKeywords})`, 'gm'), '$1');
  body = body.replace(new RegExp(`(${noteKeywords})(:[^\\n]+)[\\*"\\”\']`, 'g'), '$1$2');
  // 인용구 블록(> 💡 )으로 변환
  body = body.replace(new RegExp(`(?:^|\\n)(${noteKeywords}):?([^\\n]+)`, 'g'), '\n\n> 💡 **$1**:$2\n\n');

  // =========================================================================
  // 3. [전 세계 공통] 엉킨 Q&A 볼드 문법(**Q1. ****, **01****) 완벽 표준화
  // =========================================================================
  // 질문 머리말: **Q1.** 형태로 통일
  body = body.replace(/(?:^|\n)\s*\*{0,4}(?:Q|0)?([1-9])[\.\)]?\s*\*{0,4}\s*(?=[¿¡\w가-힣])/gi, '\n\n**Q$1.** ');
  
  // 답변 머리말: A1. 형태로 통일 및 줄바꿈 확보
  body = body.replace(/(?:^|\n)\s*\*{0,4}(?:A|0)?([1-9])[\.\)]\s*\*{0,4}\s*/gi, '\n\nA$1. ');

  // 본문 중에 3개 이상 연달아 붙어버린 찌꺼기 별표(***, ****)는 2개(**)로 정상화
  body = body.replace(/\*{3,}/g, '**');

  // =========================================================================
  // 4. [공통] 레이아웃 여백 정리 (3줄 이상 빈 줄을 표준 2줄 개행으로 정돈)
  // =========================================================================
  body = body.replace(/\n{3,}/g, '\n\n').trim();

  return `${frontmatter}\n${body}\n`;
}

function processAllPosts() {
  if (!fs.existsSync(POSTS_BASE_DIR)) {
    console.error(`❌ 경로를 찾을 수 없습니다: ${POSTS_BASE_DIR}`);
    return;
  }

  const langDirs = fs.readdirSync(POSTS_BASE_DIR, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  let totalUpdated = 0;

  for (const lang of langDirs) {
    const targetDir = path.join(POSTS_BASE_DIR, lang);
    if (!fs.existsSync(targetDir)) continue;

    const files = fs.readdirSync(targetDir).filter(f => f.endsWith('.md'));

    for (const file of files) {
      const filePath = path.join(targetDir, file);
      const originalText = fs.readFileSync(filePath, 'utf-8');
      const repairedText = cleanAndRepairPost(originalText, lang);

      if (originalText !== repairedText) {
        fs.writeFileSync(filePath, repairedText, 'utf-8');
        totalUpdated++;
      }
    }
  }

  console.log(`\n🎉 구조 전용 마크다운 복구 완료! (수정된 파일: ${totalUpdated}개)`);
}

processAllPosts();
