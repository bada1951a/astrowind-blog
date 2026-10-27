import fs from 'fs';
import path from 'path';

const POSTS_DIR = path.resolve('src/data/post');

// 1. 볼드 폭주 강제 정제 함수
function sanitizeMarkdownText(content) {
  let text = content;

  // Q1.** 처럼 앞에 여는 별표 없이 단독으로 튀어나온 .** 제거[cite: 4]
  text = text.replace(/([A-Za-z0-9가-힣]+)\.\*\*/g, '$1.');

  // 50자 넘게 통째로 볼드로 묶여 시커멓게 탄 문단 강제 해제 (오늘 1호기 문제)[cite: 6]
  text = text.replace(/\*\*([^*]{50,})\*\*/g, '$1');

  // 닫히지 않은 줄 단위 홀수 ** 태그 강제 정리
  text = text.split('\n').map(line => {
    const boldCount = (line.match(/\*\*/g) || []).length;
    if (boldCount % 2 !== 0) {
      return line.replace(/\*\*(?![\s\S]*\*\*)/, '');
    }
    return line;
  }).join('\n');

  // 단독으로 남은 외톨이 ** 태그 청소
  text = text.replace(/(^|\s)\*\*(\s|$)/g, '$1$2');

  return text;
}

// 2. 모든 마크다운 파일 수집
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

function runExactTargetFix() {
  console.log('🎯 [정밀 수술] 오늘 날짜(2026-10-28)가 포함된 포스트 탐색 시작...');
  const allFiles = getAllFiles(POSTS_DIR);

  let targetCount = 0;
  let fixedCount = 0;

  allFiles.forEach(filePath => {
    const original = fs.readFileSync(filePath, 'utf-8');

    // 본문에 2026-10-28이 들어간 오늘 글만 타격 (과거 글 절대 패스)[cite: 2]
    if (original.includes('2026-10-28')) {
      targetCount++;
      const fixed = sanitizeMarkdownText(original);

      if (original !== fixed) {
        fs.writeFileSync(filePath, fixed, 'utf-8');
        console.log(`🛠️ [수리 완료] ${path.basename(filePath)}`);
        fixedCount++;
      } else {
        console.log(`⏺ [이상 없음] ${path.basename(filePath)}`);
      }
    }
  });

  console.log(`\n========================================`);
  console.log(`총 발견된 오늘 글: ${targetCount}개 | 볼드 교정 완료: ${fixedCount}개`);
  console.log(`========================================`);
}

runExactTargetFix();
