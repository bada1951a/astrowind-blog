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
console.log(`📌 오늘 처리할 주제 (1호기 PC/하드웨어): "${currentTopic}"`);

// =========================================================================
// [1호기 전용] PC 하드웨어 / IT 테크 / 전자기기 안정적 CDN 이미지
// =========================================================================
function getDistributedImages(langIndex, seedStr) {
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = ((hash << 5) - hash) + seedStr.charCodeAt(i);
    hash |= 0;
  }

  const baseNum = (Math.abs(hash) % 1000) + 1;
  const coverSeed = ((baseNum + (langIndex * 73)) % 1000) + 1;
  const bodySeed = ((coverSeed + 499) % 1000) + 1;

  const coverUrl = `https://picsum.photos/seed/hardware${coverSeed}/900/600`;
  const bodyUrl = `https://picsum.photos/seed/computer${bodySeed}/1000/550`;

  return { coverUrl, bodyUrl };
}

// 30가지 테마 프리셋
const THEME_PRESETS = [
  { id: 1, name: "Cyberpunk Terminal", primaryColor: "#00ffcc", bgColor: "#111827", layout: "CLI/터미널 스타일, 문제 해결 핵심 명령어 최상단 배치" },
  { id: 2, name: "Modern Minimalist Slate", primaryColor: "#3b82f6", bgColor: "#f8fafc", layout: "애플 가이드 스타일, 여백 중심의 깔끔한 단계별 넘버링, 직관적 핵심 요약" },
  { id: 3, name: "Industrial Blueprint", primaryColor: "#f59e0b", bgColor: "#1e293b", layout: "하드웨어 청사진 스타일, 시스템 병목 원인 시각화, 쉬운 3단 비교표 포함" },
  { id: 4, name: "Retro Monokai", primaryColor: "#a6e22e", bgColor: "#272822", layout: "개발자 에디터 스타일, 실전 트러블슈팅 형태의 전개, 에러 해결 팁 박스" },
  { id: 5, name: "Nordic Clean Ice", primaryColor: "#0284c7", bgColor: "#f0f9ff", layout: "북유럽 감성 클린 레이아웃, 인용구 중심 도입부, 소프트 체크리스트" },
  { id: 6, name: "Dark Velvet Obsidian", primaryColor: "#a855f7", bgColor: "#0f172a", layout: "고급 다크 모드, 전문가 독점 팁 배너, 단계별 문제 해결 타임라인" },
  { id: 7, name: "Crimson Emergency Field", primaryColor: "#ef4444", bgColor: "#fff1f2", layout: "긴급 시스템 장애 복구 매뉴얼 스타일, 위험 경고 박스 최우선 강조, FAQ 아코디언형" },
  { id: 8, name: "Forest Emerald Bio", primaryColor: "#10b981", bgColor: "#f0fdf4", layout: "PC 수명 연장 가이드 스타일, 전력 효율 지표 박스, 친절한 어조" },
  { id: 9, name: "Solarized Amber Warm", primaryColor: "#d97706", bgColor: "#fef3c7", layout: "하드웨어 공방 노트 스타일, 실측 데이터 분석표, 초보자 세팅 팁" },
  { id: 10, name: "Deep Ocean Cobalt", primaryColor: "#2563eb", bgColor: "#eff6ff", layout: "표준 기술 지침서, 원인 분석 심층 다이어그램 텍스트, 권장 설정 안내" },
  { id: 11, name: "Tokyo Neon Violet", primaryColor: "#8b5cf6", bgColor: "#2e1065", layout: "게이밍 PC 최적화 스타일, 벤치마크 비교, 커스텀 세팅 팁" },
  { id: 12, name: "Graphite Technical Paper", primaryColor: "#475569", bgColor: "#f1f5f9", layout: "깔끔한 기술 백서 스타일, 정밀 원인 가설 및 검증 절차, 표준화된 결론" },
  { id: 13, name: "High-Contrast Charcoal", primaryColor: "#e11d48", bgColor: "#18181b", layout: "고대비 시스템 경보 스타일, 데이터 손실 방지 수칙, 긴급 리셋 팁 박스" },
  { id: 14, name: "Warm Coffee Latte", primaryColor: "#78350f", bgColor: "#fefae0", layout: "초보자를 위한 친절한 하드웨어 수필 가이드, 쉬운 비유법, 차근차근 따라하기" },
  { id: 15, name: "Steel Silver Metallic", primaryColor: "#64748b", bgColor: "#e2e8f0", layout: "공식 서비스센터 접수증 스타일, 입고 증상 체크리스트, 사전 자가진단표" },
  { id: 16, name: "Sunset Horizon Coral", primaryColor: "#f97316", bgColor: "#fff7ed", layout: "PC 꿀팁 세팅 스타일, 전후 비교 표, 추천 부품 목록 모음 배너" },
  { id: 17, name: "Mint Fresh Engineering", primaryColor: "#059669", bgColor: "#ecfdf5", layout: "가벼운 윈도우 캐시 최적화 매뉴얼, 저장공간 정리 팁, 명쾌한 솔루션" },
  { id: 18, name: "Midnight Navy Royal", primaryColor: "#1d4ed8", bgColor: "#172554", layout: "야간 당직 로그 스타일, 치명적 시스템 오류 극복 타임스탬프, 재발 방지책" },
  { id: 19, name: "Matte Black stealth", primaryColor: "#ffffff", bgColor: "#09090b", layout: "전문 엔지니어 가이드 스타일, 불필요한 서술 배제, 직관적인 단계별 설명" },
  { id: 20, name: "Teal Matrix Digital", primaryColor: "#14b8a6", bgColor: "#042f2e", layout: "네트워크 및 외장 스토리지 분석 스타일, 케이블 및 포트 점검 체크리스트" },
  { id: 21, name: "Pastel Lavender Tech", primaryColor: "#7c3aed", bgColor: "#faf5ff", layout: "사용자 경험 중심 가이드, 초보자가 가장 자주 묻는 질문 5선 최상단 요약 배치" },
  { id: 22, name: "Bronze Artisan Workshop", primaryColor: "#b45309", bgColor: "#fffbeb", layout: "단자 청소 및 써멀 재도포 가이드, 분해 시 주의 박스, 준비물 목록" },
  { id: 23, name: "Cobalt Enterprise Lab", primaryColor: "#1e40af", bgColor: "#dbeafe", layout: "엔터프라이즈 하드웨어 리포트 형식, 안정성 지표 및 온도 수치 인용" },
  { id: 24, name: "Rosewood Hardware Guide", primaryColor: "#be123c", bgColor: "#ffe4e6", layout: "하드웨어 매니아 분석기, 인터페이스별 규격 차이점 설명, 설정 기준표" },
  { id: 25, name: "Deep Indigo System", primaryColor: "#4338ca", bgColor: "#e0e7ff", layout: "BIOS / OS 드라이버 오류 분석 형식, 불필요한 백그라운드 프로세스 식별법" },
  { id: 26, name: "Acid Lime Hacker Space", primaryColor: "#84cc16", bgColor: "#14532d", layout: "유용한 무료 유틸리티 가이드, 안전한 데이터 복구 프로그램 연동 안내" },
  { id: 27, name: "Sandstone Desert Minimal", primaryColor: "#a16207", bgColor: "#fefce8", layout: "깔끔한 실무 매뉴얼 스타일, 소제목 하단 1줄 핵심 팁 강조 배너" },
  { id: 28, name: "Dracula Purple Dev", primaryColor: "#bd93f9", bgColor: "#282a36", layout: "전통 드라큘라 테마 스타일, 필수 단축키 및 복구 모드 하이라이트" },
  { id: 29, name: "Electric Cyan Speed", primaryColor: "#06b6d4", bgColor: "#ecfeff", layout: "초고속 1분 해결 가이드 형식, 빠른 조치법 -> 심층 점검 2단계 분리" },
  { id: 30, name: "Pure Titanium Clean", primaryColor: "#334155", bgColor: "#ffffff", layout: "초고화질 테크 매뉴얼 스타일, 볼드 타이포그래피 강조, 깔끔한 구분선" }
];

const TARGET_LANGS = [
  { code: 'ko', name: 'Korean', persona: '친절하고 경험 많은 PC 하드웨어 및 IT 인프라 엔지니어 직장인', osUi: '장치 관리자, 디스크 관리, 작업 관리자, Windows 터미널', localeContext: '서울/판교 IT 기업 전산실, 중요한 업무 보고 직전 PC 블루스크린 및 외장 SSD 인식 불가 상황' },
  { code: 'en', name: 'English', persona: 'Friendly Silicon Valley hardware specialist sharing practical PC troubleshooting tips', osUi: 'Device Manager, Disk Management, Task Manager, PowerShell', localeContext: 'Silicon Valley tech workstation / NYC office, external drive failure minutes before project handoff' },
  { code: 'ja', name: 'Japanese', persona: 'ハードウェアとPCトラブル解決を分かりやすく教える日本の現役ITワーカー', osUi: 'デバイスマネージャー, ディスクの管理, タスクマネージャー, ターミナル', localeContext: '丸の内・品川オフィス, プレゼン直前に外付けSSDが認識しない緊急トラブル' },
  { code: 'de', name: 'German', persona: 'Praxisnaher deutscher Hardware- und PC-System-Experte', osUi: 'Geräte-Manager, Datenträgerverwaltung, Task-Manager, Eingabeaufforderung', localeContext: 'Frankfurter Büroalltag, kritischer Systemabsturz während der Datenübertragung' },
  { code: 'fr', name: 'French', persona: 'Spécialiste support matériel informatique français expliquant les pannes PC simplement', osUi: 'Gestionnaire de périphériques, Gestion des disques, Gestionnaire des tâches, Terminal', localeContext: 'Bureau à La Défense, panique suite à un SSD externe non détecté' },
  { code: 'es', name: 'Spanish', persona: 'Especialista en soporte técnico y hardware que explica soluciones informáticas de forma clara', osUi: 'Administrador de dispositivos, Administración de discos, Administrador de tareas, Símbolo del sistema', localeContext: 'Oficina en Madrid, fallo crítico del sistema antes de entregar un proyecto' },
  { code: 'it', name: 'Italian', persona: 'Tecnico riparatore hardware italiano che spiega la diagnostica PC in modo pratico', osUi: 'Gestione dispositivi, Gestione disco, Gestione attività, Terminale', localeContext: 'Ufficio a Milano, emergenza crash di Windows durante il salvataggio dei file' },
  { code: 'pt', name: 'Portuguese', persona: 'Técnico de informática brasileiro experiente que ensina a resolver problemas de hardware', osUi: 'Gerenciador de Dispositivos, Gerenciamento de Disco, Gerenciador de Tarefas, Prompt de Comando', localeContext: 'Escritório corporativo em São Paulo, erro de leitura em SSD NVMe externo' },
  { code: 'nl', name: 'Dutch', persona: 'Nederlandse hardware- en tech-specialist die computerproblemen in heldere taal uitlegt', osUi: 'Apparaatbeheer, Schijfbeheer, Taakbeheer, Opdrachtprompt', localeContext: 'Zuidas zakendistrict in Amsterdam, acute opslagproblemen op de werkvloer' },
  { code: 'pl', name: 'Polish', persona: 'Polski ekspert od sprzętu komputerowego i diagnostyki PC', osUi: 'Menedżer urządzeń, Zarządzanie dyskami, Menedżer zadań, Wiersz polecenia', localeContext: 'Warszawskie centrum biznesowe, awaria dysku zewnętrznego przed wysłaniem danych' },
  { code: 'id', name: 'Indonesian', persona: 'Teknisi komputer Indonesia yang berbagi panduan perbaikan PC praktis', osUi: 'Device Manager, Manajemen Disk, Task Manager, Terminal', localeContext: 'Kawasan bisnis Jakarta, masalah drive SSD tidak terbaca saat lembur' },
  { code: 'vi', name: 'Vietnamese', persona: 'Chuyên viên kỹ thuật phần cứng PC thực chiến', osUi: 'Device Manager, Quản lý ổ đĩa, Task Manager, Command Prompt', localeContext: 'Văn phòng tại TP.HCM, lỗi ổ cứng ngoài không nhận trước cuộc họp' }
];

const delay = (ms) => new Promise((res) => setTimeout(res, ms));
const fileSlug = `hardware-${Date.now().toString(36)}`;

async function fetchWithRetry(prompt, maxRetries = 15, delayMs = 20000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash-lite',
        contents: prompt,
      });
      return response.text;
    } catch (error) {
      console.warn(`⚠️ [호출 지연/에러] 시도 ${attempt}/${maxRetries}: ${error.message}`);
      if (attempt === maxRetries) throw error;
      console.log(`⏳ ${delayMs / 1000}초 동안 대기 후 다시 시도합니다...`);
      await delay(delayMs);
    }
  }
}

async function generateSinglePost(lang, index) {
  const selectedTheme = THEME_PRESETS[Math.floor(Math.random() * THEME_PRESETS.length)];
  const { coverUrl, bodyUrl } = getDistributedImages(index, currentTopic + fileSlug);

  console.log(`\n🚀 [${index + 1}/12] ${lang.name} (${lang.code}) 1호기 하드웨어 포스팅 생성 중... (적용 테마: ${selectedTheme.name})`);

  const postDate = new Date();
  const baseMinutes = 8 * 60 + 30 + Math.floor(index * 75);
  postDate.setHours(Math.floor(baseMinutes / 60), baseMinutes % 60, 0, 0);
  const pubDateIso = postDate.toISOString();

  const prompt = `
You are a ${lang.persona}.
Write a highly practical, conversational, 1st-person hardware troubleshooting guide natively in ${lang.name}.
CRITICAL: DO NOT translate literally from Korean. Write completely from scratch as an authentic native professional working in THAT specific country/culture.

[Topic]
${currentTopic}

[CRITICAL LOCALIZATION & REAL WORLD CONTEXT (MANDATORY)]
- Target Locale Context: "${lang.localeContext}"
- ABSOLUTELY FORBIDDEN for non-Korean languages:
  * NEVER mention Korean infrastructure, companies, or services (NO Seoul, NO Kakao, NO Naver) in non-Korean languages.
  * Your opening story MUST naturally incorporate the authentic local environment:
    - English (en): Silicon Valley workstations, corporate offices, project handoffs.
    - Japanese (ja): Marunouchi offices, critical presentation deadlines.
    - German (de): Frankfurt business districts, urgent technical reporting.
    - And corresponding native IT environment for other languages.

[CRITICAL OUTPUT LANGUAGE INTEGRITY - ZERO HANGUL IN GLOBAL POSTS]
- If target language is NOT Korean (ko):
  * Absolutely NEVER include any Korean Hangul characters (가-힣) anywhere in the title, description, tags, or body.
  * Every single character in the title and description MUST strictly be in native ${lang.name}.

[WRITING STYLE: PLAIN & PRACTICAL]
1. Plain & Easy Explanations:
   - Avoid overly academic mathematical theory.
   - Write in warm, friendly, everyday language that any PC user can immediately follow.
2. Laser-Focused Narrative:
   - The opening emergency story MUST be 100% strictly about the assigned [Topic] (${currentTopic}).

[TECHNICAL TEXT FORMATTING RULE (STRICT NO LATEX)]
- ABSOLUTELY FORBIDDEN: NEVER use LaTeX math delimiters or academic math symbols (DO NOT use $, $$, \\times, \\approx, \\degree).
- Always use plain, human-readable numbers, commands, and units:
  * Write "42°C" instead of "$42^{\\circ}C$"
  * Write "USB 3.2 x 2" instead of "USB 3.2 $\\times$ 2"

[Design Theme & Layout Dynamic Rules (MANDATORY)]
- Assigned Theme: "${selectedTheme.name}"
- Primary Accent Color: ${selectedTheme.primaryColor}
- Layout Characteristic: ${selectedTheme.layout}
- You MUST incorporate native Markdown and inline styled HTML callouts tailored to this theme.
- Use custom styled tip/warning boxes (e.g., <div style="border-left: 4px solid ${selectedTheme.primaryColor}; padding: 12px 16px; margin: 20px 0; background-color: rgba(0,0,0,0.03); border-radius: 4px; color: #111827;">...</div>).
  * CRITICAL: All text inside callout/tip/warning boxes MUST be crisp dark charcoal/black (color: #111827) so it is 100% legible against any background.

[Tone & Writing Style Rules (STRICT - NO AI VIBE)]
1. Mandatory Opening:
   - Start immediately with an intense, relatable PC hardware/system emergency scenario strictly about [Topic].
2. Tone & Voice:
   - Write like a real IT colleague sharing an honest, battle-tested troubleshooting fix.
3. Fast-Paced 3-Step Narrative:
   - Step 1: Sudden panic regarding [Topic] set in ${lang.localeContext}.
   - Step 2: Desperate trial-and-error and wasted time.
   - Step 3: The breakthrough actionable tip & clear step-by-step resolution.

[Content & Structure (AdSense E-E-A-T Compliant)]
1. Opening Story: Intense real incident strictly regarding this topic.
2. Root Cause Breakdown: Clearly explain 3 realistic root causes behind the hardware failure or error.
3. Step-by-Step Resolution:
   - Use official local software/OS terminology matching: "${lang.osUi}".
   - Provide exact diagnostic and repair steps with actual easy-to-follow paths, commands, or beginner-friendly actions.
4. Expert Warning / Advice: Practical precautions to prevent hardware damage or data corruption.
5. Frequently Asked Questions (FAQ): Exactly 3 realistic, high-value Q&As that everyday users would ask.

[Length & Richness Rules]
- Korean (ko): Minimum 2,500 characters of rich, deep, non-repetitive text.
- Other languages: 1,200 to 1,500 words of thorough technical explanation.

[Strict Output Format]
Return ONLY raw Markdown. DO NOT wrap the output in markdown code fences. DO NOT include the post title as an H1 (# Title) in the body. Begin immediately with the frontmatter:

---
title: "Native Catchy Title in ${lang.name}"
description: "Native concise description in ${lang.name} under 160 characters"
publishDate: ${pubDateIso}
image: "${coverUrl}"
category: "Hardware"
tags: ["PC", "Hardware", "Troubleshooting", "Windows"]
theme: "${selectedTheme.name}"
---

(Body starts directly here without H1 header)
`;

  try {
    let rawText = await fetchWithRetry(prompt);
    let text = rawText.trim();
    if (text.startsWith('```markdown')) text = text.replace(/^```markdown\n/, '').replace(/\n```$/, '');
    if (text.startsWith('```')) text = text.replace(/^```\n/, '').replace(/\n```$/, '');

    text = text.replace(/\$([^$]+)\$/g, '$1')
               .replace(/\\times/g, 'x')
               .replace(/\\circ/g, '°')
               .replace(/\\approx/g, '≈');

    if (lang.code !== 'ko') {
      text = text.replace(/(title:\s*")([^"]*)(")/g, (match, p1, p2, p3) => {
        return `${p1}${p2.replace(/[가-힣]+/g, '').trim()}${p3}`;
      });
      text = text.replace(/(description:\s*")([^"]*)(")/g, (match, p1, p2, p3) => {
        return `${p1}${p2.replace(/[가-힣]+/g, '').trim()}${p3}`;
      });
    }

    const fmMatch = text.match(/^---[\s\S]*?---\n*/);
    if (fmMatch) {
      const frontmatter = fmMatch[0];
      let body = text.slice(frontmatter.length).trim();
      body = body.replace(/^#\s+[^\n]+\n+/, '');

      const middleImageMarkdown = `\n\n![Hardware Diagnostic & Troubleshooting](${bodyUrl})\n\n`;
      if (body.includes('## 2.') || body.includes('### 2.')) {
        body = body.replace(/(#{2,3}\s*2\.[^\n]+)/, `${middleImageMarkdown}$1`);
      } else {
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
    console.log(`✅ [성공] 1호기 저장 완료: src/data/post/${lang.code}/${fileSlug}.md (테마: ${selectedTheme.name})`);
    return true;
  } catch (error) {
    console.error(`❌ [최종 실패] ${lang.name} 생성 실패:`, error.message);
    return false;
  }
}

async function run() {
  console.log("==================================================");
  console.log("🖥️ 1호기 하드웨어/PC 12개국 초고속 자동 포스팅 파이프라인 시작 (Picsum 고속 이미지)");
  console.log("==================================================");

  let successCount = 0;

  for (let i = 0; i < TARGET_LANGS.length; i++) {
    const isSuccess = await generateSinglePost(TARGET_LANGS[i], i);
    if (isSuccess) successCount++;
    if (i < TARGET_LANGS.length - 1) {
      await delay(5000);
    }
  }

  if (successCount > 0) {
    lines.shift();
    fs.writeFileSync(TOPICS_FILE, lines.join('\n'), 'utf-8');
    console.log(`\n🧹 총 ${successCount}개국 포스팅 완료. topics.txt에서 주제를 삭제했습니다.`);
    console.log(`📊 남은 주제 수: ${lines.length}개`);
  } else {
    console.error("\n❌ 모든 언어 생성이 실패하여 topics.txt를 유지합니다.");
    process.exit(1);
  }
}

run();
