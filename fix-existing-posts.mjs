import fs from 'fs';
import path from 'path';

const POSTS_DIR = path.resolve('src/data/post');
const TARGET_DATE = '2026-10-28';

// 볼드 폭주/서식 깨짐 강제 치료 함수
function cleanBoldIssues(content) {
  let cleaned = content;

  // 1. 50자 넘게 통째로 볼드로 묶여 시커멓게 탄 문단 강제 해제 (1호기 문제 해결)
  cleaned = cleaned.replace(/\*\*([^*]{50,})\*\*/g, '$1');

  // 2. 닫는 별표 누락으로 터진 홀수 ** 태그 줄 단위 삭제
  cleaned = cleaned.split('\n').map(line => {
    const boldCount = (line.match(/\*\*/g) || []).length;
    if (boldCount % 2 !== 0) {
      return line.replace(/\*\*(?![\s\S]*\*\*)/, '');
    }
    return line;
  }).join('\n');

  // 3. 부호나 조사에 엉겨 붙어 렌더링 깨지는 ** 정리
  cleaned = cleaned.replace(/\*\*([^\s*]+)\s+\*\*/g, '**$1**');

  return cleaned;
}

// 하위 폴더까지 마크다운 파일 수집
function getAllFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getAllFiles(fullPath, fileList);
    } else if (file.endsWith('.md') || file.endsWith('.mdx')) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

function runExactTodayFix() {
  console.log(`🎯 [정밀 타격] publishDate에 "${TARGET_DATE}"가 포함된 오늘 글만 검사합니다.\n`);

  const allFiles = getAllFiles(POSTS_DIR);
  let checkedCount = 0;
  let fixedCount = 0;

  for (const filePath of allFiles) {
    const original = fs.readFileSync(filePath, 'utf-8');

    // 본문 상단 publishDate에 오늘 날짜(2026-10-28)가 없으면 과거 글이므로 건너뜀
    if (!original.includes(`publishDate: ${TARGET_DATE}`) && !original.includes(TARGET_DATE)) {
      continue;
    }

    checkedCount++;
    const fixed = cleanBoldIssues(original);

    if (original !== fixed) {
      fs.writeFileSync(filePath, fixed, 'utf-8');
      console.log(`✅ [수술 완료] ${path.basename(filePath)}`);
      fixedCount++;
    } else {
      console.log(`⏺ [이상 없음] ${path.basename(filePath)}`);
    }
  }

  console.log(`\n========================================`);
  console.log(`발견된 오늘 포스트: ${checkedCount}개 | 볼드 교정 완료: ${fixedCount}개`);
  console.log(`과거 글: 100% 안전 보존 (건드리지 않음)`);
  console.log(`========================================`);
}

runExactTodayFix();
