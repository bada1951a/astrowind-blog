import fs from 'fs';
import path from 'path';

const POSTS_BASE_DIR = path.resolve('src/data/post');

function repairMarkdownPost(content) {
  const fmMatch = content.match(/^---[\s\S]*?---\n*/);
  if (!fmMatch) return content;

  const frontmatter = fmMatch[0];
  let body = content.slice(frontmatter.length);

  // 1. 소제목(##) 강제 삽입 (문맥 기준)
  body = body
    .replace(/\n+(?=컴퓨터가 종료 명령을 내려도|시스템이 완전히 꺼지지 않고|전원이 꺼지지 않는 현상은)/g, '\n\n## 1. 시스템 종료 불량의 근본 원인 분석\n\n')
    .replace(/\n+(?=이 문제를 가장 깔끔하고 확실하게|아래 순서대로 제어판과|먼저 윈도우 작업 표시줄의)/g, '\n\n## 2. 빠른 시작 끄기 및 전원 설정 단계별 해결법\n\n')
    .replace(/\n+(?=현장에서 하드웨어 트러블슈팅을 진행할 때 주의|빠른 시작 기능을 끄더라도 부팅 속도가)/g, '\n\n## 3. 엔지니어 실무 점검 및 주의사항\n\n')
    .replace(/\n+(?=현업에서 마주치는 다양한|자주 묻는 질문들을 모았습니다)/g, '\n\n## 4. 자주 묻는 질문 (FAQ)\n\n');

  // 번호 목록(1. , 2. )으로 시작하는 다국어 패턴도 소제목화
  body = body.replace(/^(?:\s*|\n*)([1-5]\.\s+[^\n]+)/gm, '\n\n## $1\n\n');
  body = body.replace(/#{2,}\s*#{2,}/g, '##');

  // 2. 주요 UI 클릭 경로 및 핵심 단어 볼드(**) 복원
  const keyTerms = [
    '빠른 시작(Fast Startup)',
    '빠른 시작 켜기(권장)',
    '빠른 시작',
    '제어판',
    '전원 옵션',
    '전원 버튼 동작 변경',
    '현재 사용할 수 없는 설정 변경',
    '변경 내용 저장',
    '장치 관리자',
    '네트워크 어댑터',
    '전원을 절약하기 위해 컴퓨터가 이 장치를 끌 수 있음',
    '최대 절전 모드',
    'powercfg /hibernate on'
  ];

  // 단어 중복 치환 방지하며 볼드 적용
  for (const term of keyTerms) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(?<!\\*\\*)(?<![#\\w가-힣])${escaped}(?![\\w가-힣])(?!\\*\\*)`, 'g');
    body = body.replace(regex, `**${term}**`);
  }

  // 3. Q&A 줄바꿈 및 Q 강조 복구
  body = body.replace(/([^\n])\s*(Q[0-9]*\.\s*)/g, '$1\n\n**$2**');
  body = body.replace(/([^\n])\s*(A[0-9]*\.\s*)/g, '$1\n\n$2');
  body = body.replace(/(\*\*Q[0-9]*\.[^\*]+\*\*)\s*(A[0-9]*\.)/g, '$1\n\n$2');

  // 4. 인용구/안내 박스 복구
  body = body.replace(/\n+(현장 엔지니어 노트:[^\n]+)/g, '\n\n> 💡 **$1**\n\n');
  body = body.replace(/\n+(대량 데이터 처리 시 주의 박스[^\n]+)/g, '\n\n> ⚠️ **$1**\n\n');

  // 5. 과도한 빈 줄 정리
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
      const repairedText = repairMarkdownPost(originalText);

      if (originalText !== repairedText) {
        fs.writeFileSync(filePath, repairedText, 'utf-8');
        totalUpdated++;
      }
    }
  }

  console.log(`\n🎉 총 ${totalUpdated}개의 포스트 서식 및 볼드 복구 완료!`);
}

processAllPosts();
