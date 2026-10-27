import fs from 'fs';
import path from 'path';

const POSTS_DIR = path.resolve('src/data/post');

function sanitizePostContent(content) {
  let text = content;

  // 1. [FAQ 줄바꿈 분리] Q1., A1., Q2., A2.가 문장 뒤에 딱 붙어 뭉개진 것 강제 줄바꿈
  text = text.replace(/([.!?])\s*(Q[1-9]\.|\*\*Q[1-9]\.\*\*)/g, '$1\n\n$2');
  text = text.replace(/([.!?])\s*(A[1-9]\.|\*\*A[1-9]\.\*\*)/g, '$1\n\n$2');
  text = text.replace(/(---)\s*(Q[1-9]\.)/g, '$1\n\n$2');

  // 2. [볼드 깨짐 수리] Q1.** 처럼 앞에 여는 별표 없이 닫는 별표만 혼자 튀어나온 것 제거
  text = text.replace(/([A-Za-z0-9가-힣]+)\.\*\*/g, '$1.');

  // 3. [시커먼 거대 볼드 폭주 해제] 백틱(`) 포함 25글자 이상 통째로 묶인 볼드는 일반 텍스트로 강제 변환
  text = text.replace(/\*\*([\s\S]{25,}?)\*\*/g, '$1');

  // 4. [외톨이 별표 청소] 줄 단위로 홀수 개만 남아 렌더링 터뜨리는 ** 태그 정리
  text = text.split('\n').map(line => {
    const count = (line.match(/\*\*/g) || []).length;
    if (count % 2 !== 0) {
      return line.replace(/\*\*(?![\s\S]*\*\*)/, '');
    }
    return line;
  }).join('\n');

  // 5. 공백 사이에 홀로 남은 무의미한 빈 ** 삭제
  text = text.replace(/(^|\s)\*\*(\s|$)/g, '$1$2');

  return text;
}

// 하위 폴더(국가별, 카테고리별 등) 포함 모든 마크다운 파일 재귀 탐색
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

function runFullAudit() {
  console.log('🚀 [전수 조사 시작] src/data/post 내 모든 마크다운 파일 전수 검사...');
  const allFiles = getAllMarkdownFiles(POSTS_DIR);

  let checkedCount = 0;
  let fixedCount = 0;

  for (const filePath of allFiles) {
    checkedCount++;
    const original = fs.readFileSync(filePath, 'utf-8');
    const fixed = sanitizePostContent(original);

    // 내용에 실제 변화가 있는(오류가 발견된) 파일만 덮어쓰기
    if (original !== fixed) {
      fs.writeFileSync(filePath, fixed, 'utf-8');
      console.log(`🛠️ [수리 완료] ${path.basename(filePath)}`);
      fixedCount++;
    }
  }

  console.log(`\n========================================`);
  console.log(`총 검사한 파일: ${checkedCount}개`);
  console.log(`오류 발견 및 수리 완료: ${fixedCount}개`);
  console.log(`오류 없는 정상 파일: ${checkedCount - fixedCount}개 (보존됨)`);
  console.log(`========================================`);
}

runFullAudit();
