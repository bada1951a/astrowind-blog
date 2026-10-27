import fs from 'fs';
import path from 'path';

const POSTS_DIR = path.resolve('src/data/post');

function sanitizePostContent(content) {
  let text = content;

  // 1. [FAQ 줄바꿈 정밀 복원]
  // (FAQ) 헤딩 뒤에 Q1이 바로 붙어 제목으로 끌려간 것 분리
  text = text.replace(/(FAQ\)?)\s*(Q[1-9]\.|\*\*Q[1-9]\.\*\*)/gi, '$1\n\n$2');
  // 문장 마침표 뒤에 Q1., Q2., A1., A2.가 바로 붙어 줄글로 뭉개진 것 분리
  text = text.replace(/([.!?])\s*(Q[1-9]\.|\*\*Q[1-9]\.\*\*)/g, '$1\n\n$2');
  text = text.replace(/([.!?])\s*(A[1-9]\.|\*\*A[1-9]\.\*\*)/g, '$1\n\n$2');
  text = text.replace(/(---)\s*(Q[1-9]\.)/g, '$1\n\n$2');

  // 2. [문법 찌꺼기 제거] Q1.** 처럼 앞에 여는 별표 없이 단독으로 붙어 터진 닫는 별표 제거
  text = text.replace(/([A-Za-z0-9가-힣]+)\.\*\*/g, '$1.');

  // 3. [초거대 줄바꿈 볼드 블록만 정밀 해제]
  // 일반 강조 문장(20~100자)은 절대 건드리지 않고,
  // 줄바꿈(\n)이 포함되어 150자 이상 문단 여러 개를 시커멓게 집어삼킨 괴물 볼드만 일반 텍스트로 해제
  text = text.replace(/\*\*([^\*]*?\n[^\*]*?){150,}\*\*/g, (match, p1) => {
    return match.replace(/^\*\*/, '').replace(/\*\*$/, '');
  });

  // 4. [외톨이 찌꺼기 정리] 공백 사이에 홀로 굴러다니는 무의미한 빈 ** 만 삭제
  text = text.replace(/(^|\s)\*\*(\s|$)/g, '$1$2');

  return text;
}

// 하위 폴더 재귀 탐색
function getAllMarkdownFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getAllMarkdownFiles(fullPath, fileList);
    } else if (file.endsWith('.md') || file.endsWith('.mdx')) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

function runSafeAudit() {
  console.log('🚀 [안전 검사] 마크다운 포스트 전수 문법/줄바꿈 정밀 수리 시작...');
  const allFiles = getAllMarkdownFiles(POSTS_DIR);

  let checkedCount = 0;
  let fixedCount = 0;

  for (const filePath of allFiles) {
    checkedCount++;
    const original = fs.readFileSync(filePath, 'utf-8');
    const fixed = sanitizePostContent(original);

    // 실제 변경 사항이 발생한 파일만 덮어쓰기
    if (original !== fixed) {
      fs.writeFileSync(filePath, fixed, 'utf-8');
      console.log(`🛠️ [수리 완료] ${path.basename(filePath)}`);
      fixedCount++;
    }
  }

  console.log(`\n========================================`);
  console.log(`총 검사한 파일: ${checkedCount}개`);
  console.log(`정밀 수리 완료: ${fixedCount}개`);
  console.log(`변경 없는 정상 파일: ${checkedCount - fixedCount}개`);
  console.log(`========================================`);
}

runSafeAudit();
