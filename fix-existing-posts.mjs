import fs from 'fs';
import path from 'path';

const POSTS_DIR = path.resolve('src/data/post');

// 볼드 에러 치료 함수
function sanitizeMarkdownText(content) {
  let text = content;

  // 1. Q1.** 처럼 앞에 여는 별표 없이 단독으로 튀어나온 .** 제거
  text = text.replace(/([A-Za-z0-9가-힣]+)\.\*\*/g, '$1.');

  // 2. 50자 넘게 통째로 볼드로 묶여 시커멓게 탄 문단 강제 해제
  text = text.replace(/\*\*([^*]{50,})\*\*/g, '$1');

  // 3. 줄 단위 짝 안 맞는 홀수 ** 태그 강제 정리 (줄 끝 덜 닫힌 ** 삭제)
  text = text.split('\n').map(line => {
    const boldCount = (line.match(/\*\*/g) || []).length;
    if (boldCount % 2 !== 0) {
      return line.replace(/\*\*(?![\s\S]*\*\*)/, '');
    }
    return line;
  }).join('\n');

  // 4. 단독으로 남아있는 외톨이 ** 태그 청소
  text = text.replace(/(^|\s)\*\*(\s|$)/g, '$1$2');

  return text;
}

// 하위 폴더 재귀 탐색
function getAllFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getAllFiles(fullPath, fileList);
    } else if (file.endsWith('.md') || file.endsWith('.mdx')) {
      fileList.push({
        path: fullPath,
        name: file,
        mtime: fs.statSync(fullPath).mtimeMs,
      });
    }
  }
  return fileList;
}

function runActionFix() {
  const allFiles = getAllFiles(POSTS_DIR);
  // 가장 최신 수정된 상위 48개 포스트만 정밀 타격 (과거 글 보호)
  allFiles.sort((a, b) => b.mtime - a.mtime);
  const targetFiles = allFiles.slice(0, 48);

  console.log(`🎯 최신 포스트 ${targetFiles.length}개 정밀 수술 시작...`);
  let fixedCount = 0;

  targetFiles.forEach(item => {
    const original = fs.readFileSync(item.path, 'utf-8');
    const fixed = sanitizeMarkdownText(original);

    if (original !== fixed) {
      fs.writeFileSync(item.path, fixed, 'utf-8');
      console.log(`🛠️ [수리 완료] ${item.name}`);
      fixedCount++;
    }
  });

  console.log(`\n🎉 수리 완료: 총 ${fixedCount}개 포스트 수정됨.`);
}

runActionFix();
