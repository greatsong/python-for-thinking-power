import Anthropic from '@anthropic-ai/sdk';

export async function generateConversationSummary(messages, problemTitle) {
  if (!process.env.ANTHROPIC_API_KEY || messages.length === 0) return null;

  const client = new Anthropic();
  const conversationText = messages
    .map(m => `**${m.role === 'user' ? '학생' : 'AI'}**: ${m.content}`)
    .join('\n\n');

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 400,
      messages: [{
        role: 'user',
        content: `다음은 학생과 AI 코치의 파이썬 문제 풀이 대화입니다.
문제: ${problemTitle}

교사가 한눈에 파악할 수 있도록 다음 형식으로 간단히 요약해주세요:

- **질문 횟수**: X회
- **주요 질문**: (학생이 물어본 핵심 내용 1줄)
- **어려워한 개념**: (구체적 개념)
- **진행 상황**: (해결됨/진행중/막혀있음)
- **교사 개입 필요**: (예/아니오)

대화:
${conversationText}`,
      }],
    });

    return response.content[0].text;
  } catch (err) {
    console.error('[ConvSummary] 요약 생성 실패:', err.message);
    return null;
  }
}
