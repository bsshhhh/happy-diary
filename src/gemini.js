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

// getHappinessSummary 함수는 완전히 제거합니다.