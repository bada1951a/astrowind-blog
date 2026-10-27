import fs from 'fs';
import path from 'path';

const POSTS_DIR = path.resolve('src/data/post');

function cleanBrokenPost(content) {
  let text = content;

  // 1. [헤딩 뒤 Q1 엉킴 분리] 제목 끝에 바로 Q1이 붙어 거대 헤딩으로 변한 것 분리
  text = text.replace(/([#]+[^\n]*?FAQ[^\n]*?)\s*(Q[1-9]\.|\*\*Q[1-9]\.\*\*)/gi, '$1\n\n$2');
  text = text.replace(/(FAQ\)?)\s*(Q[1-9]\.|\*\*Q[1-9]\.\*\*)/gi, '$1\n\n$2');

  // 2. [FAQ 문단 줄바꿈 강제] Q1/A1/Q2/A2 앞뒤 엔터 2번 확보
  text = text.replace(/([.!?])\s*(Q[1-9]\.|\*\*Q[1-9]\.\*\*)/g, '$1\n\n$2');
  text = text.replace(/([.!?])\s*(A[1-9]\.|\*\*A[1-9]\.\*\*)/g, '$1\n\n$2');
  text = text.replace(/(---)\s*(Q[1-9]\.)/g, '$1\n\n$2');

  // 3. [동일 제목/문장 연타 반복 제거] 2번 헤딩처럼 똑같은 줄이 연속으로 반복 출력된 버그 청소
  const lines = text.split('\n');
  const cleanedLines = [];
  let prevLineTrimmed = '';

  for (const line of lines) {
    const trimmed = line.trim();
    // 빈 줄이 아니면서 바로 윗줄과 내용이 100% 똑같은 중복 줄은 건너뜀 (1개만 남김)
    if (trimmed.length > 0 && trimmed === prevLineTrimmed) {
      continue;
    }
    cleanedLines.push(line);
    prevLineTrimmed = trimmed;
  }
  text = cleanedLines.join('\n');

  // 4. [문법 찌꺼기만 제거] Q1.** 처럼 앞에 여는 별표 없는 닫는 별표만 제거 (정상 볼드는 절대 보존)
  text = text.replace(/([A-Za-z0-9가-힣]+)\.\*\*/g, '$1.');
  text = text.replace(/(^|\s)\*\*(\s|$)/g, '$1$2');

  return text;
}

// 전체 마크다운 파일 재귀 탐색
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

function runFullSanitize() {
  console.log('🚀 [과거 글 전수 조사] 중복 제목 연타 및 FAQ 서식 일괄 치료 시작...');
  const allFiles = getAllMarkdownFiles(POSTS_DIR);

  let checkedCount = 0;
  let fixedCount = 0;

  for (const filePath of allFiles) {
    checkedCount++;
    const original = fs.readFileSync(filePath, 'utf-8');
    const cleaned = cleanBrokenPost(original);

    // 실제 변경 사항(오류)이 발견된 파일만 덮어쓰기
    if (original !== cleaned) {
      fs.writeFileSync(filePath, cleaned, 'utf-8');
      console.log(`🛠️ [치료 완료] ${path.basename(filePath)}`);
      fixedCount++;
    }
  }

  console.log(`\n========================================`);
  console.log(`총 검사한 파일: ${checkedCount}개`);
  console.log(`오류 발견 및 자동 수리 완료: ${fixedCount}개`);
  console.log(`오류 없는 정상 파일: ${checkedCount - fixedCount}개 (보존됨)`);
  console.log(`========================================`);
}

runFullSanitize();
