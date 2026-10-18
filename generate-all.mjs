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
console.log(`📌 오늘 처리할 주제 (1호기 Tech/IT): "${currentTopic}"`);

// =========================================================================
// [1호기 전용] 검증된 고속 테크 실사 CDN 매핑 (렉·에러 0%)
// =========================================================================
function getTechKeyword(topic = '') {
  const t = topic.toLowerCase();
  if (/c드라이브|용량|disk|storage|ssd/.test(t)) return 'nvme,ssd,hardware';
  if (/ram|골드핑거|memory|메모리/.test(t)) return 'motherboard,ram,chipset';
  if (/블루스크린|blue screen|bsod|오류/.test(t)) return 'server,datacenter,code';
  if (/키보드|스위치|keyboard/.test(t)) return 'mechanical,keyboard,switch';
  if (/모니터|신호 없음|display/.test(t)) return 'monitor,workspace,cable';
  return 'technology,computer,circuit';
}

function getPostImages(topic, index) {
  const kw = getTechKeyword(topic);
  const sig1 = (index * 17 + 11) % 500;
  const sig2 = (index * 31 + 23) % 500;

  return {
    coverUrl: `https://images.unsplash.com/featured/1200x675/?${kw}&sig=${sig1}`,
    bodyUrl: `https://images.unsplash.com/featured/1000x550/?${kw},tech&sig=${sig2}`
  };
}

const THEME_PRESETS = [
  { id: 1, name: "Cyberpunk Terminal", primaryColor: "#00ffcc", bgColor: "#111827", layout: "CLI/터미널 스타일, 자동화 단축 경로 최상단 배치" },
  { id: 2, name: "Modern Minimalist Slate", primaryColor: "#3b82f6", bgColor: "#f8fafc", layout: "미니멀 가이드 스타일, 여백 중심의 깔끔한 단계별 넘버링, 직관적 핵심 요약" },
  { id: 3, name: "Industrial Blueprint", primaryColor: "#f59e0b", bgColor: "#1e293b", layout: "엔지니어링 청사진 스타일, 시스템 병목 원인 시각화, 쉬운 3단 비교표 포함" },
  { id: 4, name: "Retro Monokai", primaryColor: "#a6e22e", bgColor: "#272822", layout: "개발자 에디터 스타일, 실전 콘솔 코드 박스 중심 전개, 디버깅 팁" },
  { id: 5, name: "Nordic Clean Ice", primaryColor: "#0284c7", bgColor: "#f0f9ff", layout: "북유럽 감성 클린 레이아웃, 인용구 중심 도입부, 실무 체크리스트" },
  { id: 6, name: "Dark Velvet Obsidian", primaryColor: "#a855f7", bgColor: "#0f172a", layout: "고급 다크 모드, 전문가 독점 팁 배너, 단계별 문제 해결 타임라인" },
  { id: 7, name: "Crimson Emergency Field", primaryColor: "#ef4444", bgColor: "#fff1f2", layout: "긴급 오류 복구 매뉴얼 스타일, 위험 경고 박스 최우선 강조, FAQ 아코디언형" },
  { id: 8, name: "Forest Emerald Bio", primaryColor: "#10b981", bgColor: "#f0fdf4", layout: "친절하고 명쾌한 가이드 스타일, 시간 절약 지표 박스" },
  { id: 9, name: "Solarized Amber Warm", primaryColor: "#d97706", bgColor: "#fef3c7", layout: "실무 공방 노트 스타일, 실측 속도 개선 분석표, 초보자 세팅 팁" },
  { id: 10, name: "Deep Ocean Cobalt", primaryColor: "#2563eb", bgColor: "#eff6ff", layout: "표준 소프트웨어 매뉴얼 지침서, 원인 분석 심층 다이어그램 텍스트, 권장 설정 안내" },
  { id: 11, name: "Tokyo Neon Violet", primaryColor: "#8b5cf6", bgColor: "#2e1065", layout: "파워유저 최적화 스타일, 실행 속도 및 단축키 비교, 커스텀 세팅 팁" },
  { id: 12, name: "Graphite Technical Paper", primaryColor: "#475569", bgColor: "#f1f5f9", layout: "깔끔한 기술 백서 스타일, 원인 가설 및 검증 절차, 표준화된 결론" },
  { id: 13, name: "High-Contrast Charcoal", primaryColor: "#e11d48", bgColor: "#18181b", layout: "고대비 경보 스타일, 데이터 손실 방지 수칙, 긴급 롤백 팁 박스" },
  { id: 14, name: "Warm Coffee Latte", primaryColor: "#78350f", bgColor: "#fefae0", layout: "초보자를 위한 친절한 수필 가이드, 쉬운 비유법, 차근차근 따라하기" },
  { id: 15, name: "Steel Silver Metallic", primaryColor: "#64748b", bgColor: "#e2e8f0", layout: "공식 기술지원 티켓 스타일, 증상 체크리스트, 사전 자가진단표" },
  { id: 16, name: "Sunset Horizon Coral", primaryColor: "#f97316", bgColor: "#fff7ed", layout: "꿀팁 세팅 스타일, 전후 비교 표, 추천 세팅 모음 배너" },
  { id: 17, name: "Mint Fresh Engineering", primaryColor: "#059669", bgColor: "#ecfdf5", layout: "가벼운 시스템 최적화 매뉴얼, 불필요한 단계 정리 팁, 명쾌한 솔루션" },
  { id: 18, name: "Midnight Navy Royal", primaryColor: "#1d4ed8", bgColor: "#172554", layout: "서버 로그 스타일, 치명적 시스템 에러 극복 타임스탬프, 재발 방지책" },
  { id: 19, name: "Matte Black stealth", primaryColor: "#ffffff", bgColor: "#09090b", layout: "전문 실무 가이드 스타일, 불필요한 서술 배제, 직관적인 단계별 설명" },
  { id: 20, name: "Teal Matrix Digital", primaryColor: "#14b8a6", bgColor: "#042f2e", layout: "네트워크 및 하드웨어 점검 체크리스트" },
  { id: 21, name: "Pastel Lavender Tech", primaryColor: "#7c3aed", bgColor: "#faf5ff", layout: "사용자 경험 중심 가이드, 자주 묻는 질문 5선 최상단 요약 배치" },
  { id: 22, name: "Bronze Artisan Workshop", primaryColor: "#b45309", bgColor: "#fffbeb", layout: "하드웨어 튜닝 가이드, 분해 조립 주의 박스, 준비물 목록" },
  { id: 23, name: "Cobalt Enterprise Lab", primaryColor: "#1e40af", bgColor: "#dbeafe", layout: "엔터프라이즈 실사용 리포트 형식, 성능 개선 수치 인용" },
  { id: 24, name: "Rosewood Hardware Guide", primaryColor: "#be123c", bgColor: "#ffe4e6", layout: "테크 매니아 분석기, 버전별/규격별 부품 차이점 설명, 설정 기준표" },
  { id: 25, name: "Deep Indigo System", primaryColor: "#4338ca", bgColor: "#e0e7ff", layout: "운영체제 커널 분석 형식, 불필요한 백그라운드 프로세스 식별법" },
  { id: 26, name: "Acid Lime Hacker Space", primaryColor: "#84cc16", bgColor: "#14532d", layout: "유용한 오픈소스 도구 가이드, 안전한 설치 안내" },
  { id: 27, name: "Sandstone Desert Minimal", primaryColor: "#a16207", bgColor: "#fefce8", layout: "깔끔한 실무 매뉴얼 스타일, 소제목 하단 1줄 핵심 팁 강조 배너" },
  { id: 28, name: "Dracula Purple Dev", primaryColor: "#bd93f9", bgColor: "#282a36", layout: "전통 드라큘라 테마 스타일, 필수 레지스트리 및 복구 명령어 하이라이트" },
  { id: 29, name: "Electric Cyan Speed", primaryColor: "#06b6d4", bgColor: "#ecfeff", layout: "초고속 1분 해결 가이드 형식, 빠른 조치법 -> 심층 세팅 2단계 분리" },
  { id: 30, name: "Pure Titanium Clean", primaryColor: "#334155", bgColor: "#ffffff", layout: "초고화질 매뉴얼 스타일, 볼드 타이포그래피 강조, 깔끔한 구분선" }
];

const TARGET_LANGS = [
  { code: 'ko', name: 'Korean', persona: '친절하고 경험 많은 베테랑 하드웨어/PC 엔지니어 테크닥터', osUi: '시작 > 설정 > 시스템, 장치 관리자, 제어판', localeContext: '서울/판교 IT 기업, 마감 직전 갑작스러운 장치 먹통 및 블루스크린' },
  { code: 'en', name: 'English', persona: 'Seasoned Silicon Valley PC technician and hardware engineer TechDoctor', osUi: 'Start > Settings > System, Device Manager, Control Panel', localeContext: 'Silicon Valley tech firm / NYC corporate office, sudden hardware crash during critical delivery' },
  { code: 'ja', name: 'Japanese', persona: 'PC修理とシステム復旧を専門とする現役ITエンジニア', osUi: 'スタート > 設定 > システム, デバイスマネージャー, コントロールパネル', localeContext: '丸の内・品川のオフィス, プレゼン直前のブルースクリーンとPCフリーズ' },
  { code: 'de', name: 'German', persona: 'Erfahrener deutscher PC- und Hardware-Experte', osUi: 'Start > Einstellungen > System, Geräte-Manager, Systemsteuerung', localeContext: 'Frankfurter Finanzdistrikt, schwerer Systemabsturz vor dem Vorstandstreffen' },
  { code: 'fr', name: 'French', persona: 'Technicien support informatique et expert matériel PC', osUi: 'Démarrer > Paramètres > Système, Gestionnaire de périphériques, Panneau de configuration', localeContext: 'Bureau à La Défense, panne subite de machine avant une échéance capitale' },
  { code: 'es', name: 'Spanish', persona: 'Técnico especialista en soporte de hardware y sistemas', osUi: 'Inicio > Configuración > Sistema, Administrador de dispositivos, Panel de control', localeContext: 'Oficina en Madrid, pantalla azul inesperada en plena entrega de proyecto' },
  { code: 'it', name: 'Italian', persona: 'Tecnico informatico ed esperto di riparazione hardware PC', osUi: 'Start > Impostazioni > Sistema, Gestione dispositivi, Pannello di controllo', localeContext: 'Ufficio a Milano, blocco totale del sistema operativo prima della riunione' },
  { code: 'pt', name: 'Portuguese', persona: 'Especialista em manutenção de hardware e otimização de PC', osUi: 'Iniciar > Configurações > Sistema, Gerenciador de Dispositivos, Painel de Controle', localeContext: 'Escritório corporativo em São Paulo, pane de hardware no fechamento de mês' },
  { code: 'nl', name: 'Dutch', persona: 'Nederlandse IT-support specialist en hardware technicus', osUi: 'Start > Instellingen > Systeem, Apparaatbeheer, Configuratiescherm', localeContext: 'Zuidas zakendistrict in Amsterdam, acute computerstoring vlak voor een belangrijke pitch' },
  { code: 'pl', name: 'Polish', persona: 'Polski ekspert serwisu komputerowego i optymalizacji PC', osUi: 'Start > Ustawienia > System, Menedżer urządzeń, Panel sterowania', localeContext: 'Warszawskie centrum biznesowe, awaria sprzętowa tuż przed wysłaniem raportu' },
  { code: 'id', name: 'Indonesian', persona: 'Teknisi komputer berpengalaman dan spesialis hardware', osUi: 'Mulai > Pengaturan > Sistem, Pengelola Perangkat, Panel Kontrol', localeContext: 'Kawasan bisnis SCBD Jakarta, layar biru mendadak saat lembur menyelesaikan data' },
  { code: 'vi', name: 'Vietnamese', persona: 'Chuyên viên kỹ thuật máy tính và phần cứng thực chiến', osUi: 'Bắt đầu > Cài đặt > Hệ thống, Trình quản lý thiết bị, Bảng điều khiển', localeContext: 'Văn phòng tại TP.HCM / Hà Nội, máy tính bị treo đứng giữa deadline gấp' }
];

const delay = (ms) => new Promise((res) => setTimeout(res, ms));
const fileSlug = `post-${Date.now().toString(36)}`;

async function fetchWithRetry(prompt, maxRetries = 15, delayMs = 20000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
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

  console.log(`\n🚀 [${index + 1}/12] ${lang.name} (${lang.code}) 1호기 테크 포스팅 생성 중... (적용 테마: ${selectedTheme.name})`);

  // 고속 검증 테크 실사 이미지 즉시 배정 (다운로드 지연 0초)
  const { coverUrl, bodyUrl } = getPostImages(currentTopic, index);

  const postDate = new Date();
  const baseMinutes = 8 * 60 + 30 + Math.floor(index * 75);
  postDate.setHours(Math.floor(baseMinutes / 60), baseMinutes % 60, 0, 0);
  const pubDateIso = postDate.toISOString();

  const prompt = `
You are a ${lang.persona}.
Write a highly practical, conversational, 1st-person hardware and system troubleshooting guide natively in ${lang.name}.
CRITICAL: DO NOT translate literally from Korean. Write completely from scratch as an authentic native tech engineer working in THAT specific country/culture.

[Topic]
${currentTopic}

[CRITICAL LOCALIZATION & REAL WORLD WORKPLACE CONTEXT (MANDATORY)]
- Target Locale Context: "${lang.localeContext}"
- ABSOLUTELY FORBIDDEN for non-Korean languages:
  * NEVER mention Korean infrastructure, companies, or services (NO Seoul, NO Kakao, NO Naver) in non-Korean languages.
  * Your opening story MUST naturally incorporate authentic local environments.
  * The protagonist must be 100% perceived as a local professional of that country.

[CRITICAL OUTPUT LANGUAGE INTEGRITY - ZERO HANGUL IN GLOBAL POSTS]
- If target language is NOT Korean (ko):
  * Absolutely NEVER include any Korean Hangul characters (가-힣) anywhere in the title, description, tags, or body.
  * Every single character in the title and description MUST strictly be in native ${lang.name}.

[WRITING STYLE: PLAIN & PRACTICAL]
1. Plain & Easy Explanations:
    - Avoid overly abstract electrical/kernel theory.
    - Write in warm, friendly, everyday language that any user can immediately follow.
    - Give concrete clicks, device names, or step-by-step diagnostic actions.
2. Laser-Focused Narrative:
    - The opening emergency story MUST be 100% strictly about the assigned [Topic] (${currentTopic}).

[TECHNICAL TEXT FORMATTING RULE (STRICT NO LATEX)]
- ABSOLUTELY FORBIDDEN: NEVER use LaTeX math delimiters ($ or $$).
- Always use plain numbers and units (e.g., 65W, 3200MHz, 45°C).

[Design Theme & Layout Dynamic Rules (MANDATORY)]
- Assigned Theme: "${selectedTheme.name}"
- Primary Accent Color: ${selectedTheme.primaryColor}
- Layout Characteristic: ${selectedTheme.layout}
- You MUST incorporate native Markdown and inline styled HTML callouts tailored to this theme.
- Use custom styled tip/warning boxes (e.g., <div style="border-left: 4px solid ${selectedTheme.primaryColor}; padding: 12px 16px; margin: 20px 0; background-color: rgba(0,0,0,0.03); border-radius: 4px; color: #111827;">...</div>).
  * CRITICAL: All text inside callout/tip/warning boxes MUST be crisp dark charcoal/black (color: #111827) so it is 100% legible against any background.

[Tone & Writing Style Rules (STRICT - NO AI VIBE)]
1. Mandatory Opening:
    - Absolutely FORBIDDEN: Boring textbook intros like "Hello", "In this post", "Today we will explore".
    - Start immediately with an intense, relatable workplace emergency scenario strictly about [Topic].
2. Fast-Paced 3-Step Narrative:
    - Step 1: Sudden hardware/system failure panic regarding [Topic] set in ${lang.localeContext}.
    - Step 2: Frustrating trial-and-error.
    - Step 3: The breakthrough actionable tip & clear step-by-step setup.

[Content & Structure (AdSense E-E-A-T Compliant)]
1. Opening Story: Intense real incident strictly regarding this topic.
2. Root Cause Breakdown: Clearly explain 3 realistic root causes behind the failure.
3. Step-by-Step Resolution:
    - Use official local software UI terminology matching: "${lang.osUi}".
    - Provide exact clicks and diagnostic steps.
4. Expert Warning / Advice: Practical precautions regarding electrical safety, static, or driver conflict.
5. Frequently Asked Questions (FAQ): Exactly 3 realistic, high-value Q&As.

[Length & Richness Rules]
- Korean (ko): Minimum 2,500 characters of rich, deep, non-repetitive text.
- Other languages: 1,200 to 1,500 words of thorough practical explanation.

[Strict Output Format]
Return ONLY raw Markdown. DO NOT wrap the output in markdown code fences. DO NOT include the post title as an H1 (# Title) in the body. Begin immediately with the frontmatter:

---
title: "Native Catchy Title in ${lang.name}"
description: "Native concise description in ${lang.name} under 160 characters"
publishDate: ${pubDateIso}
image: "${coverUrl}"
category: "tech"
tags: ["PC Repair", "Hardware", "Troubleshooting", "Tech Tips"]
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
      let frontmatter = fmMatch[0];
      let body = text.slice(frontmatter.length).trim();
      body = body.replace(/^#\s+[^\n]+\n+/, '');

      // 1호기 영구 고정 규칙: category: 'tech'
      frontmatter = frontmatter.replace(/category:\s*["'][^"']*["']/i, "category: 'tech'")
                               .replace(/category:\s*[^\n\r]+/i, "category: 'tech'");

      frontmatter = frontmatter.replace(/publishDate:\s*["']([^"']+)["']/i, "publishDate: $1");
      frontmatter = frontmatter.replace(/image:\s*["'][^"']*["']/i, `image: '${coverUrl}'`);

      const middleImageMarkdown = `\n\n![${currentTopic} Tech Guide](${bodyUrl})\n\n`;
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
    console.log(`✅ [성공] 1호기 저장 완료: src/data/post/${lang.code}/${fileSlug}.md (테크 이미지 적용 완료)`);
    return true;
  } catch (error) {
    console.error(`❌ [최종 실패] ${lang.name} 생성 실패:`, error.message);
    return false;
  }
}

async function run() {
  console.log("==================================================");
  console.log("⚡ 1호기 Tech 12개국 초고속 자동 포스팅 파이프라인 시작");
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
