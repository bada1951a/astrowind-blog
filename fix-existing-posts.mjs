import fs from 'fs';
import path from 'path';

const POSTS_DIR = path.resolve('src/data/post');

function cleanAllDuplicates(content) {
  let text = content;

  // 1. [FAQ 헤딩 및 줄바꿈 복원]
  text = text.replace(/([#]+[^\n]*?FAQ[^\n]*?)\s*(Q[1-9]\.|\*\*Q[1-9]\.\*\*)/gi, '$1\n\n$2');
  text = text.replace(/(FAQ\)?)\s*(Q[1-9]\.|\*\*Q[1-9]\.\*\*)/gi, '$1\n\n$2');
  text = text.replace(/([.!?])\s*(Q[1-9]\.|\*\*Q[1-9]\.\*\*)/g, '$1\n\n$2');
  text = text.replace(/([.!?])\s*(A[1-9]\.|\*\*A[1-9]\.\*\*)/g, '$1\n\n$2');
  text = text.replace(/(---)\s*(Q[1-9]\.)/g, '$1\n\n$2');

  // 2. [빈 줄 무시 중복 헤딩/문장 전수 압축]
  // 중간에 빈 줄이 끼어 있어도, 앞서 나온 헤딩과 내용이 같으면 모조리 삭제
  const lines = text.split('\n');
  const cleanedLines = [];
  let lastSeenHeadingText = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // 마크다운 헤딩(#)인 경우
    if (/^#{1,6}\s+/.test(trimmed)) {
      // '#' 기호와 앞뒤 공백을 뗀 순수 텍스트만 추출
      const headingClean = trimmed.replace(/^#{1,6}\s+/, '').replace(/\*\*/g, '').trim();

      // 바로 이전에 나왔던 헤딩 텍스트와 똑같다면 건너뜀 (삭제)
      if (headingClean.length > 0 && headingClean === lastSeenHeadingText) {
        continue;
      }
      lastSeenHeadingText = headingClean;
    } else if (trimmed.length > 0) {
      // 일반 본문 문장이 시작되면 헤딩 중복 추적 초기화
      lastSeenHeadingText = '';
    }

    cleanedLines.push(line);
  }

  text = cleanedLines.join('\n');

  // 3. 문법 찌꺼기만 제거 (정상 본문 볼드는 건드리지 않음)
  text = text.replace(/([A-Za-z0-9가-힣]+)\.\*\*/g, '$1.');
  text = text.replace(/(^|\s)\*\*(\s|$)/g, '$1$2');

  return text;
}

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

function runAudit() {
  console.log('🔍 [전수 조사] 수백 개 포스트 중복 헤딩 및 FAQ 서식 정밀 압축 시작...');
  const allFiles = getAllMarkdownFiles(POSTS_DIR);

  let fixedCount = 0;

  for (const filePath of allFiles) {
    const original = fs.readFileSync(filePath, 'utf-8');
    const cleaned = cleanAllDuplicates(original);

    if (original !== cleaned) {
      fs.writeFileSync(filePath, cleaned, 'utf-8');
      console.log(`🛠️ [수정됨] ${path.basename(filePath)}`);
      fixedCount++;
    }
  }

  console.log(`\n========================================`);
  console.log(`총 파일 수: ${allFiles.length}개`);
  console.log(`중복 헤딩/FAQ 오류 수정된 파일: ${fixedCount}개`);
  console.log(`========================================`);
}

runAudit();
