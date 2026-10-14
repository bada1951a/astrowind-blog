import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY 환경변수가 설정되지 않았습니다.");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
const POSTS_BASE_DIR = path.resolve('src/data/post');
const TOPICS_FILE = path.resolve('topics.txt');

if (!fs.existsSync(TOPICS_FILE)) {
  console.error("❌ topics.txt 파일이 존재하지 않습니다.");
  process.exit(1);
}

const fileContent = fs.readFileSync(TOPICS_FILE, 'utf-8');
const lines = fileContent.split('\n').map(l => l.trim()).filter(l => l.length > 0);

if (lines.length === 0) {
  console.log("⚠️ topics.txt에 남은 주제가 없습니다. 생성을 건너뜁니다.");
  process.exit(0);
}

const currentTopic = lines[0];
console.log(`📌 오늘 처리할 주제: "${currentTopic}"`);

// 검증된 고화질 IT/하드웨어 전문 Unsplash 이미지 풀 (40장 분산)
const TECH_IMAGE_POOL = [
  "photo-1597872200969-2b65d56bd16b", // M.2 SSD / Storage
  "photo-1518770660439-4636190af475", // Circuit Board / Chipset
  "photo-1587202372775-e229f172b9d7", // Mechanical Keyboard / Switches
  "photo-1550751827-4bd374c3f58b", // Cybersecurity / Tech Server
  "photo-1563770660941-20978e870e26", // Hardware Electronics Lab
  "photo-1526374965328-7f61d4dc18c5", // Terminal / Code / Matrix
  "photo-1591799264318-7e6ef8ddb7ea", // CPU Processor / Heatsink
  "photo-1544197150-b99a580bb7a8", // Server Rack / Cabling
  "photo-1588508065123-287b28e013da", // Tech Workshop / Repair Desk
  "photo-1629654297299-c8506221ca97", // High-end Motherboard
  "photo-1519389950473-47ba0277781c", // IT Workspace / Engineer Team
  "photo-1555680202-c86f0e12f086", // Data Center Diagnostics
  "photo-1531297484001-80022131f5a1", // Modern Laptop & Hardware
  "photo-1607604276583-eef5d076aa5f", // Soldering & Circuit Repair
  "photo-1517430816045-df4b7de11d1d", // Hardware Testing Equipment
  "photo-1581092160607-ee22621dd758", // Microchip & Precision Tools
  "photo-1581092335397-9583fe92d232", // Network Switches & LAN Cables
  "photo-1527443224154-c4a3942d3acf", // Desktop Workstation Setup
  "photo-1581091226825-a6a2a5aee158", // Industrial Lab Testing
  "photo-1591488320449-011701bb6704", // GPU Graphics Card Architecture
  "photo-1542751371-adc38448a05e", // Gaming Gear & Mechanical Keys
  "photo-1558494949-ef010cbdcc31", // Cloud Server Racks
  "photo-1515378791036-0648a3ef77b2", // System Diagnostics on Screen
  "photo-1504384308090-c894fdcc538d", // Tech Support Team Desk
  "photo-1516321318423-f06f85e504b3", // Digital Hardware Workspace
  "photo-1546776310-eef45dd6d63c", // AI & Robotics Hardware
  "photo-1618005182384-a83a8bd57fbe", // Minimalist Tech Architecture
  "photo-1600132806370-bf17e65e942f", // Custom Keyboard PCB & Caps
  "photo-1563986768609-322da13575f3", // Digital Cloud Architecture
  "photo-1550745165-9bc0b252726f", // Retro Tech Gear / Cassette Era
  "photo-1580927752452-89d86da3fa0a", // Developer Coding Screen
  "photo-1579546929518-9e396f3cc809", // Abstract Modern Tech Mesh
  "photo-1581092795360-fd1ca04f0952", // Professional Multimeter / Testing
  "photo-1518773553398-650c184e0bb3", // Micro Electronics Macro Shot
  "photo-1525547719571-a2d4ac8945e2", // Precision Screwdrivers & Parts
  "photo-1534972195531-a756b1126f24", // Tech Field Terminal & Logs
  "photo-1618761714954-0b8cd0026356", // High-Speed NVMe Storage Drive
  "photo-1614064641938-3bbee52942c7", // Modern Circuit Trace Architecture
  "photo-1581092580497-e0d23cbdf1dc", // IT Quality Assurance Station
  "photo-1581092918056-0c4c3acd3789"  // Advanced Fiber Optics / Cables
];

// 고유 시드 기반으로 절대 겹치지 않는 2장의 이미지 선택 함수
function getDistributedImages(langIndex, seedStr) {
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash << 5) - hash + seedStr.charCodeAt(i);
    hash |= 0;
  }
  const baseOffset = Math.abs(hash) % TECH_IMAGE_POOL.length;

  // 커버 이미지: 언어 인덱스와 해시를 조합한 위치
  const coverIdx = (baseOffset + langIndex * 3) % TECH_IMAGE_POOL.length;
  // 본문 이미지: 커버와 겹치지 않도록 충분한 거리(17칸)를 둔 위치
  const bodyIdx = (coverIdx + 17) % TECH_IMAGE_POOL.length;

  const coverPhotoId = TECH_IMAGE_POOL[coverIdx];
  const bodyPhotoId = TECH_IMAGE_POOL[bodyIdx];

  const coverUrl = `https://images.unsplash.com/${coverPhotoId}?auto=format&fit=crop&w=1200&h=630&q=85`;
  const bodyUrl = `https://images.unsplash.com/${bodyPhotoId}?auto=format&fit=crop&w=1000&h=550&q=80`;

  return { coverUrl, bodyUrl };
}

// 30가지 고유 시각 스타일 및 글 구조 테마 프리셋
const THEME_PRESETS = [
  { id: 1, name: "Cyberpunk Terminal", primaryColor: "#00ffcc", bgColor: "#111827", layout: "CLI/터미널 콘솔 스타일, 명령어 박스 최상단 배치, 기술 스택 진단 중심" },
  { id: 2, name: "Modern Minimalist Slate", primaryColor: "#3b82f6", bgColor: "#f8fafc", layout: "애플 가이드 스타일, 여백 중심의 깔끔한 단계별 넘버링, 직관적 핵심 요약" },
  { id: 3, name: "Industrial Blueprint", primaryColor: "#f59e0b", bgColor: "#1e293b", layout: "엔지니어링 청사진 스타일, 부품 및 회로 구조 분석, 3단 비교 테이블 포함" },
  { id: 4, name: "Retro Monokai", primaryColor: "#a6e22e", bgColor: "#272822", layout: "개발자 에디터 스타일, 실시간 디버깅 로그 형태의 전개, 에러 코드 팁 박스" },
  { id: 5, name: "Nordic Clean Ice", primaryColor: "#0284c7", bgColor: "#f0f9ff", layout: "북유럽 감성 클린 레이아웃, 인용구 중심 도입부, 소프트 체크리스트" },
  { id: 6, name: "Dark Velvet Obsidian", primaryColor: "#a855f7", bgColor: "#0f172a", layout: "고급 다크 모드, 전문가 독점 팁 배너, 단계별 문제 해결 타임라인" },
  { id: 7, name: "Crimson Emergency Field", primaryColor: "#ef4444", bgColor: "#fff1f2", layout: "긴급 장애 복구 매뉴얼 스타일, 위험 경고 박스 최우선 강조, FAQ 아코디언형" },
  { id: 8, name: "Forest Emerald Bio", primaryColor: "#10b981", bgColor: "#f0fdf4", layout: "장기 유지보수 및 수명 연장 가이드 스타일, 안정성 지표 박스, 친절한 어조" },
  { id: 9, name: "Solarized Amber Warm", primaryColor: "#d97706", bgColor: "#fef3c7", layout: "하드웨어 공방 노트 스타일, 실측 데이터 및 측정값 분석표, 자가 수리 팁" },
  { id: 10, name: "Deep Ocean Cobalt", primaryColor: "#2563eb", bgColor: "#eff6ff", layout: "엔터프라이즈 인프라 표준 지침서, 원인 분석 심층 다이어그램 텍스트, 정책 권고" },
  { id: 11, name: "Tokyo Neon Violet", primaryColor: "#8b5cf6", bgColor: "#2e1065", layout: "게이밍 기어 벤치마크 스타일, 입력 지연 및 반응 속도 비교, 커스텀 세팅 팁" },
  { id: 12, name: "Graphite Technical Paper", primaryColor: "#475569", bgColor: "#f1f5f9", layout: "학술 엔지니어링 논문 스타일, 정밀 원인 가설 및 검증 절차, 표준화된 결론" },
  { id: 13, name: "High-Contrast Charcoal", primaryColor: "#e11d48", bgColor: "#18181b", layout: "고대비 엔지니어링 경보 스타일, 치명적 결함 방지 수칙, 긴급 CMD 박스" },
  { id: 14, name: "Warm Coffee Latte", primaryColor: "#78350f", bgColor: "#fefae0", layout: "초보자를 위한 친절한 하드웨어 수필 가이드, 쉬운 비유법, 차근차근 따라하기" },
  { id: 15, name: "Steel Silver Metallic", primaryColor: "#64748b", bgColor: "#e2e8f0", layout: "장비 수리 센터 접수증 스타일, 입고 증상 체크리스트, 사전 진단표" },
  { id: 16, name: "Sunset Horizon Coral", primaryColor: "#f97316", bgColor: "#fff7ed", layout: "주말 DIY 하드웨어 튜닝 스타일, 전후 비교 표, 추천 도구 모음 배너" },
  { id: 17, name: "Mint Fresh Engineering", primaryColor: "#059669", bgColor: "#ecfdf5", layout: "가벼운 시스템 최적화 매뉴얼, 리소스 절약 팁, 간결한 한 줄 명쾌 솔루션" },
  { id: 18, name: "Midnight Navy Royal", primaryColor: "#1d4ed8", bgColor: "#172554", layout: "서버 관리자 야간 당직 로그 스타일, 장애 극복 타임스탬프, 재발 방지책" },
  { id: 19, name: "Matte Black stealth", primaryColor: "#ffffff", bgColor: "#09090b", layout: "전문 스펙 비교 스타일, 불필요한 서술 배제, 직관적인 단계별 코드 블록" },
  { id: 20, name: "Teal Matrix Digital", primaryColor: "#14b8a6", bgColor: "#042f2e", layout: "디지털 신호 및 인터페이스 분석 스타일, 핀 배열 및 포트 점검 체크리스트" },
  { id: 21, name: "Pastel Lavender Tech", primaryColor: "#7c3aed", bgColor: "#faf5ff", layout: "사용자 경험 중심 가이드, 자주 묻는 질문 5선 최상단 요약 배치" },
  { id: 22, name: "Bronze Artisan Workshop", primaryColor: "#b45309", bgColor: "#fffbeb", layout: "스위치 및 접점 분해 조립 정밀 가이드, 세척제 사용 주의 박스, 공구 목록" },
  { id: 23, name: "Cobalt Enterprise Lab", primaryColor: "#1e40af", bgColor: "#dbeafe", layout: "품질 보증(QA) 테스트 랩 리포트 형식, 불량률 및 내구성 수치 인용" },
  { id: 24, name: "Rosewood Hardware Guide", primaryColor: "#be123c", bgColor: "#ffe4e6", layout: "하드웨어 매니아 분석기, 미세한 조작감 변화 설명, 윤활제 선택 기준표" },
  { id: 25, name: "Deep Indigo System", primaryColor: "#4338ca", bgColor: "#e0e7ff", layout: "OS 커널 및 드라이버 충돌 분석 형식, 레지스트리/디바이스 ID 식별법" },
  { id: 26, name: "Acid Lime Hacker Space", primaryColor: "#84cc16", bgColor: "#14532d", layout: "오픈소스 하드웨어 펌웨어 패치 가이드, 깃허브 오픈 툴 연동 안내" },
  { id: 27, name: "Sandstone Desert Minimal", primaryColor: "#a16207", bgColor: "#fefce8", layout: "깔끔한 매뉴얼 북 스타일, 소제목 하단 1줄 핵심 팁 강조 배너" },
  { id: 28, name: "Dracula Purple Dev", primaryColor: "#bd93f9", bgColor: "#282a36", layout: "전통 드라큘라 테마 스타일, 숏컷 단축키 및 복구 키 조합 하이라이트" },
  { id: 29, name: "Electric Cyan Speed", primaryColor: "#06b6d4", bgColor: "#ecfeff", layout: "초고속 3분 해결 가이드 형식, 빠른 조치법 -> 심층 조치법 2단계 분리" },
  { id: 30, name: "Pure Titanium Clean", primaryColor: "#334155", bgColor: "#ffffff", layout: "초고화질 매뉴얼 스타일, 볼드 타이포그래피 강조, 깔끔한 구분선과 블록인용" }
];

const TARGET_LANGS = [
  { code: 'ko', name: 'Korean', persona: '한국 IT 인프라/하드웨어 엔지니어', osUi: '장치 관리자, 디스크 관리, 명령 프롬프트' },
  { code: 'en', name: 'English', persona: 'Silicon Valley Senior Systems Engineer', osUi: 'Device Manager, Disk Management, Command Prompt' },
  { code: 'ja', name: 'Japanese', persona: '日本のITインフラエンジニア', osUi: 'デバイス マネージャー, ディスクの管理, コマンド プロンプト' },
  { code: 'de', name: 'German', persona: 'Deutscher IT-Systemadministrator', osUi: 'Geräte-Manager, Datenträgerverwaltung, Eingabeaufforderung' },
  { code: 'fr', name: 'French', persona: 'Ingénieur système informatique français', osUi: 'Gestionnaire de périphériques, Gestion des disques, Invite de commandes' },
  { code: 'es', name: 'Spanish', persona: 'Ingeniero de soporte de infraestructura TI español', osUi: 'Administrador de dispositivos, Administración de discos, Símbolo del sistema' },
  { code: 'it', name: 'Italian', persona: 'Ingegnere sistemista hardware italiano', osUi: 'Gestione dispositivi, Gestione disco, Prompt dei comandi' },
  { code: 'pt', name: 'Portuguese', persona: 'Especialista em infraestrutura e hardware de TI brasileiro', osUi: 'Gerenciador de Dispositivos, Gerenciamento de Disco, Prompt de Comando' },
  { code: 'nl', name: 'Dutch', persona: 'Nederlandse IT-infrastructuurspecialist', osUi: 'Apparaatbeheer, Schijfbeheer, Opdrachtprompt' },
  { code: 'pl', name: 'Polish', persona: 'Polski inżynier wsparcia IT i systemów operacyjnych', osUi: 'Menedżer urządzeń, Zarządzanie dyskami, Wiersz polecenia' },
  { code: 'id', name: 'Indonesian', persona: 'Spesialis teknisi IT dan perangkat keras Indonesia', osUi: 'Device Manager, Manajemen Disk, Command Prompt' },
  { code: 'vi', name: 'Vietnamese', persona: 'Kỹ sư phần cứng 및 hỗ trợ IT doanh nghiệp Việt Nam', osUi: 'Device Manager, Disk Management, Command Prompt' }
];

const delay = (ms) => new Promise((res) => setTimeout(res, ms));
const fileSlug = `tech-${Date.now().toString(36)}`;

// 5분 동안 재시도하며 API 호출하는 핵심 함수
async function fetchWithRetry(prompt, maxRetries = 15, delayMs = 20000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      });
      return response.text;
    } catch (error) {
      console.warn(`⚠️ [호출 지연/에러] 시도 ${attempt}/${maxRetries}: ${error.message}`);
      if (attempt === maxRetries) {
        throw error;
      }
      console.log(`⏳ ${delayMs / 1000}초 동안 대기 후 다시 시도합니다... (최대 5분 대기 로직)`);
      await delay(delayMs);
    }
  }
}

async function generateSinglePost(lang, index) {
  const selectedTheme = THEME_PRESETS[Math.floor(Math.random() * THEME_PRESETS.length)];
  const { coverUrl, bodyUrl } = getDistributedImages(index, currentTopic + fileSlug);

  console.log(`\n🚀 [${index + 1}/12] ${lang.name} (${lang.code}) 포스팅 생성 중... (적용 테마: ${selectedTheme.name})`);

  const postDate = new Date();
  const baseMinutes = 8 * 60 + 30 + Math.floor(index * 75);
  postDate.setHours(Math.floor(baseMinutes / 60), baseMinutes % 60, 0, 0);
  const pubDateIso = postDate.toISOString();

  const prompt = `
You are a ${lang.persona}.
Write a highly practical, authoritative, first-person technical troubleshooting guide natively in ${lang.name}.
CRITICAL: DO NOT translate literally. Write from scratch using authentic local industry tone, idioms, and native OS terminology.

[Topic]
${currentTopic}

[Design Theme & Layout Dynamic Rules (MANDATORY)]
- Assigned Theme: "${selectedTheme.name}"
- Primary Accent Color: ${selectedTheme.primaryColor}
- Layout Characteristic: ${selectedTheme.layout}
- You MUST incorporate native Markdown and inline styled HTML callouts tailored to this theme.
  * Use custom styled tip/warning boxes (e.g., <div style="border-left: 4px solid ${selectedTheme.primaryColor}; padding: 12px 16px; margin: 20px 0; background-color: rgba(0,0,0,0.03); border-radius: 4px;">...</div>).
  * Structure the sections uniquely based on: "${selectedTheme.layout}".

[Mandatory Writing Structure (AdSense E-E-A-T Compliant)]
1. Introduction: Realistic 1st-person work experience solving this exact issue in an office or field environment.
2. Root Cause Breakdown: Clearly explain 3 realistic root causes.
3. Step-by-Step Resolution:
   - Use official local OS terminology matching: "${lang.osUi}".
   - Provide exact diagnostic and repair steps with relevant commands if applicable.
4. Expert Warning / Advice: Practical precautions to prevent hardware or data loss.
5. Frequently Asked Questions (FAQ): Exactly 3 realistic, high-value Q&As.

[Length & Quality Rules]
- Korean (ko): Minimum 2,500 characters of rich, deep text.
- Other languages: 1,200 to 1,500 words of thorough technical explanation.

[Strict Output Format]
Return ONLY raw Markdown. DO NOT wrap the output in markdown code fences. DO NOT include the post title as an H1 (# Title) in the body (the template automatically displays the title from frontmatter). Begin immediately with the frontmatter:

---
title: "Native Catchy Title in ${lang.name}"
description: "Native concise description in ${lang.name} under 160 characters"
publishDate: ${pubDateIso}
image: "${coverUrl}"
category: "Hardware"
tags: ["Tech", "Troubleshooting", "Hardware"]
theme: "${selectedTheme.name}"
---

(Body starts directly here without H1 header)
`;

  try {
    let rawText = await fetchWithRetry(prompt);
    let text = rawText.trim();
    if (text.startsWith('```markdown')) text = text.replace(/^```markdown\n/, '').replace(/\n```$/, '');
    if (text.startsWith('```')) text = text.replace(/^```\n/, '').replace(/\n```$/, '');

    // 프론트매터 분리 및 본문 첫 줄 '# 제목' 제거
    const fmMatch = text.match(/^---[\s\S]*?---\n*/);
    if (fmMatch) {
      const frontmatter = fmMatch[0];
      let body = text.slice(frontmatter.length).trim();
      body = body.replace(/^#\s+[^\n]+\n+/, '');

      // 본문 중간(2번째 큰 섹션 부근)에 고유 현장 사진 자연스럽게 삽입
      const middleImageMarkdown = `\n\n![Hardware Diagnostic & Troubleshooting](${bodyUrl})\n\n`;
      if (body.includes('## 2.') || body.includes('### 2.')) {
        body = body.replace(/(#{2,3}\s*2\.[^\n]+)/, `${middleImageMarkdown}$1`);
      } else {
        // 섹션 번호가 없으면 본문 첫 3번째 문단 뒤에 안전하게 삽입
        const paragraphs = body.split('\n\n');
        if (paragraphs.length >= 3) {
          paragraphs.splice(2, 0, middleImageMarkdown.trim());
          body = paragraphs.join('\n\n');
        } else {
          body = `${middleImageMarkdown}${body}`;
        }
      }

      text = `${frontmatter}\n${body}\n`;
    }

    const targetDir = path.join(POSTS_BASE_DIR, lang.code);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const filePath = path.join(targetDir, `${fileSlug}.md`);
    fs.writeFileSync(filePath, text, 'utf-8');
    console.log(`✅ [성공] 저장 완료: src/data/post/${lang.code}/${fileSlug}.md (테마: ${selectedTheme.name}, 이미지 분산 완료)`);
    return true;
  } catch (error) {
    console.error(`❌ [최종 실패] ${lang.name} 생성 실패:`, error.message);
    return false;
  }
}

async function run() {
  console.log("==================================================");
  console.log("🌍 12개국 자동 포스팅 파이프라인 시작 (30개 테마 + 40종 이미지 분산)");
  console.log("==================================================");

  let successCount = 0;

  for (let i = 0; i < TARGET_LANGS.length; i++) {
    const isSuccess = await generateSinglePost(TARGET_LANGS[i], i);
    if (isSuccess) successCount++;
    if (i < TARGET_LANGS.length - 1) {
      await delay(5000);
    }
  }

  // 최소 1개 이상 성공 시에만 주제 삭제
  if (successCount > 0) {
    lines.shift();
    fs.writeFileSync(TOPICS_FILE, lines.join('\n'), 'utf-8');
    console.log(`\n🧹 총 ${successCount}개국 발행 완료. topics.txt에서 주제를 삭제했습니다.`);
    console.log(`📊 남은 주제 수: ${lines.length}개`);
  } else {
    console.error("\n❌ 모든 언어 생성이 실패하여 topics.txt를 유지합니다.");
    process.exit(1);
  }
}

run();
