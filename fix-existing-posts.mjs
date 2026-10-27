import fs from 'fs';
import path from 'path';

const POSTS_DIR = path.resolve('src/data/post');

// [절대 원칙] 오늘 날짜만 타격 (과거 글 완전 배제)
const TARGET_DATE = '2026-10-28';

function cleanBoldIssues(content) {
  let cleaned = content;

  // 1. 50자 넘게 문단 전체가 볼드로 시커멓게 뭉친 부분만 해제 (1호기 현상)
  cleaned = cleaned.replace(/\*\*([^*]{50,})\*\*/g, '$1');

  // 2. 닫는 별표 누락으로 터진 홀수 ** 태그만 줄 단위 제거
  cleaned = cleaned.split('\n').map(line => {
    const boldCount = (line.match(/\*\*/g) || []).length;
    if (boldCount % 2 !== 0) {
      return line.replace(/\*\*(?![\s\S]*\*\*)/, '');
    }
    return line;
  }).join('\n');

  return cleaned;
}

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

function runSafeFix() {
  console.log(`🔒 [안전 모드] 과거 글 보호 활성화`);
  console.log(`🎯 [타격 대상] 파일명에 "${TARGET_DATE}"가 포함된 오늘 글만 검사합니다.\n`);

  const allFiles = getAllFiles(POSTS_DIR);
  let checkedCount = 0;
  let fixedCount = 0;

  for (const filePath of allFiles) {
    const fileName = path.basename(filePath);

    // 과거 글은 아예 열어보지도 않고 즉시 통과 (SKIP)
    if (!fileName.includes(TARGET_DATE)) {
      continue;
    }

    checkedCount++;
    const original = fs.readFileSync(filePath, 'utf-8');
    const fixed = cleanBoldIssues(original);

    if (original !== fixed) {
      fs.writeFileSync(filePath, fixed, 'utf-8');
      console.log(`✅ [수술 완료] 오늘 글: ${fileName}`);
      fixedCount++;
    } else {
      console.log(`⏺ [이상 없음] 오늘 글: ${fileName}`);
    }
  }

  console.log(`\n========================================`);
  console.log(`검사한 오늘 글: ${checkedCount}개 | 볼드 교정 완료: ${fixedCount}개`);
  console.log(`과거 글: 1개도 건드리지 않고 100% 안전 유지됨`);
  console.log(`========================================`);
}

runSafeFix();
