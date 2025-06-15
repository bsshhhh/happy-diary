export async function getAIFeedback(momentList) {
  const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
  const prompt = `아래는 사용자가 오늘 행복했던 순간 3가지입니다. 각 항목에 대해 따뜻하게 공감해주고, 마지막에 오늘 하루를 응원하는 한마디를 해주세요.\n\n1. ${momentList[0]}\n2. ${momentList[1]}\n3. ${momentList[2]}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: '너는 따뜻하게 공감해주는 행복 코치야.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 200,
      temperature: 0.8,
    }),
  });

  if (!response.ok) {
    throw new Error('OpenAI API 호출 실패');
  }
  const data = await response.json();
  return data.choices[0].message.content.trim();
} 