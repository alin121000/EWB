const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5';

// Calls the Anthropic API when a key is configured. Returns null on any
// failure so callers can fall back to the deterministic template - the
// app must keep working in the field with no AI access at all.
export async function callClaude(prompt, { maxTokens = 1200 } = {}) {
  if (!ANTHROPIC_API_KEY) return null;
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text = data?.content?.[0]?.text;
    return text ? text.trim() : null;
  } catch {
    return null;
  }
}

export const aiAvailable = () => Boolean(ANTHROPIC_API_KEY);
