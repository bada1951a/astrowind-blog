function sanitizeMarkdownFormatting(content) {
  let cleaned = content;

  // 1) 마크다운 볼드(**) 기호 완전 제거 (가장 먼저 실행하여 태그 잔재 제거)
  const lines = cleaned.split('\n');
  const clearedLines = lines.map(line => {
    let trimmed = line.trim();
    if (trimmed === '**') return '';
    if (trimmed.startsWith('```') || trimmed.startsWith('`')) return line;
    return line.replace(/\*\*/g, '');
  });
  cleaned = clearedLines.join('\n');

  // 2) 물음표(?) 또는 마침표(.) 뒤에 띄어쓰기 없이 바로 글자가 붙는 현상 강제 띄어쓰기 보정
  cleaned = cleaned.replace(/([?])([A-ZÀ-ÖØ-ßa-zà-öø-ÿ])/g, '$1 $2');
  cleaned = cleaned.replace(/([.?!])([0-9]+\.\s+[A-ZÀ-ÖØ-ßa-zà-öø-ÿ])/g, '$1\n\n$2');

  // 3) 문장 끝과 다음 번호(예: "sprzętu.2." 또는 "sprzętu. 2.") 사이에 강제 두 줄 개행 삽입
  cleaned = cleaned.replace(/([.?!])\s*([0-9]+\.\s+[A-ZÀ-ÖØ-ßa-zà-öø-ÿ])/g, '$1\n\n$2');

  // 4) 다국어 환경에서 물음표나 마침표 뒤에 문장이나 번호가 붙을 때 무조건 강제 개행
  cleaned = cleaned.replace(/([.?!])\s+(Najskuteczniejszą|Podłączyłem|To klasyczny|Czy narzędzie|W Windows|Co zrobić|Que faire|¿Qué|Miin|Kan|Zagrożenie|Warto)/g, '$1\n\n$2');

  // 5) Q와 A, 다국어 패턴 앞 줄바꿈 강제 확보
  cleaned = cleaned.replace(/([^\n])\s*(Q[1-9]\.|R[1-9]\.|A[1-9]\.)/g, '$1\n\n$2');
  cleaned = cleaned.replace(/([.?!])\s*(D:|Q[0-9]*\.|Domande)/gi, '$1\n\n$2');
  cleaned = cleaned.replace(/([.?!])\s*(R:|Risposta|A[0-9]*\.)/gi, '$1\n\n$2');

  return cleaned;
}
