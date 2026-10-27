import fs from 'fs';
import path from 'path';

const POSTS_DIR = path.resolve('src/data/post');

function sanitizePostContent(content) {
  let text = content;

  // 1. [핵심] 제목(FAQ, 헤딩) 뒤에 줄바꿈 없이 바로 붙은 Q1 분리 (거대 헤딩 해제)
  text = text.replace(/([#]+[^\n]*?FAQ[^\n]*?)\s*(Q[1-9]\.|\*\*Q[1-9]\.\*\*)/gi, '$1\n\n$2');
  text = text.replace(/(FAQ\)?)\s*(Q[1-9]\.|\*\*Q[1-9]\.\*\*)/gi, '$1\n\n$2');

  // 2. [FAQ 본문 줄바꿈] 마침표나 구분선 뒤에 바로 붙은 Q1/A1/Q2/A2 분리
  text = text.replace(/([.!?])\s*(Q[1-9]\.|\*\*Q[1-9]\.\*\*)/g, '$1\n\n$2');
  text = text.replace(/([.!?])\s*(A[1-9]\.|\*\*A[1-9]\.\*\*)/g, '$1\n\n$2');
  text = text.replace(/(---)\s*(Q[1-9]\.)/g, '$1\n\n$2');

  // 3. [문법 찌꺼기만 제거] Q1.** 처럼 앞에 여는 별표 없는 닫는 별표만 제거 (본문 볼드는 절대 손대지 않음)
  text = text.replace(/([A-Za-z0-9가-힣]+)\.\*\*/g, '$1.');

  // 4. 단독으로 굴러다니는 빈 ** 공백 제거
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

function runFinalFix() {
  console.log('🚀 [최종 해결] FAQ 헤딩 줄바꿈 및 문법 찌꺼기 정밀 수리 시작...');
  const allFiles = getAllMarkdownFiles(POSTS_DIR);

  let checkedCount = 0;
  let fixedCount = 0;

  for (const filePath of allFiles) {
    checkedCount++;
    const original = fs.readFileSync(filePath, 'utf-8');
    const fixed = sanitizePostContent(original);

    if (original !== fixed) {
      fs.writeFileSync(filePath, fixed, 'utf-8');
      console.log(`🛠️ [수리 완료] ${path.basename(filePath)}`);
      fixedCount++;
    }
  }

  console.log(`\n========================================`);
  console.log(`총 검사한 파일: ${checkedCount}개`);
  console.log(`FAQ 헤딩/줄바꿈 수리 완료: ${fixedCount}개`);
  console.log(`정상 파일: ${checkedCount - fixedCount}개`);
  console.log(`========================================`);
}

runFinalFix();
