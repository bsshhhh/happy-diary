export async function getGeminiFeedback(momentList) {
  const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
  const actualMoments = momentList.filter(Boolean).join(', '); // 비어있지 않은 모먼트만 모아서 쉼표로 연결
  const prompt = `사용자가 오늘 작성한 행복했던 순간들입니다: ${actualMoments}. 이 순간들에 대해 따뜻하게 공감하고 한두 문장으로 응원해주세요. 이모티콘을 적절하게 사용해주세요.`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
        model: 'gemini-1.5-flash',
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 100,
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error('Gemini API 호출 실패');
  }
  const data = await response.json();
  // Gemini 응답에서 텍스트 추출
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'AI 피드백을 받아오지 못했습니다.';
}

export async function getHappinessAnalysis(allDiaryEntries) {
  const apiKey = process.env.REACT_APP_GEMINI_API_KEY;

  // 모든 일기 항목에서 'items' 배열의 모먼트들을 추출하여 하나의 문자열로 결합합니다.
  const allMomentsText = allDiaryEntries
    .flatMap(entry => entry.items) // 모든 entry의 items 배열을 하나의 배열로 평탄화
    .filter(Boolean) // 빈 문자열이나 null 제거
    .join('. '); // 마침표와 공백으로 연결하여 각 모먼트를 구분

  if (!allMomentsText) {
    return '아직 분석할 행복 모먼트가 충분하지 않습니다.';
  }

  const prompt = `다음은 사용자가 기록한 모든 행복한 순간들입니다:\n  ${allMomentsText}\n\n  이 기록들을 종합적으로 분석하여 사용자가 '어떤 상황에서', '무엇을 할 때', '어떤 감정을 느낄 때' 주로 행복을 느끼는지 핵심 키워드와 함께 2~3문장으로 간결하게 요약하고 분석해주세요. 감정적으로 풍부하고 따뜻한 어조로 작성하며, 이모티콘을 적절하게 사용해주세요. 답변은 텍스트 포맷팅(예: 볼드체) 없이 일반 텍스트로만 제공해주세요.`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
        model: 'gemini-1.5-flash',
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 200,
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error('Gemini API 분석 호출 실패');
  }
  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '행복 분석 결과를 받아오지 못했습니다.';
}

// getHappinessSummary 함수는 완전히 제거합니다.