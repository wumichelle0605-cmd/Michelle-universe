export async function chat(
  messages: { role: string; content: string }[],
  maxTokens = 4000
): Promise<string> {
  try {
    const res = await fetch('/api/llm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages,
        max_tokens: maxTokens,
      }),
    });
    const data = await res.json();
    // 豆包推理模型：优先取 content，reasoning_content 是思维链不展示
    return data?.choices?.[0]?.message?.content ?? '';
  } catch {
    return '';
  }
}
