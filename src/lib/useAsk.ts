'use client'

export interface AskBody {
  question: string
  history:  { role: 'user' | 'assistant'; content: string }[]
  context:  string
  lang:     'en' | 'vi'
}

/** POST /api/ask and stream the plain-text response token-by-token. */
export async function streamAsk(
  body: AskBody,
  token: string,
  onToken: (delta: string) => void,
  signal?: AbortSignal,
): Promise<void> {
  const res = await fetch('/api/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
    signal,
  })

  if (!res.ok || !res.body) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error ?? `Request failed (${res.status})`)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  for (;;) {
    const { done, value } = await reader.read()
    if (done) { const tail = decoder.decode(); if (tail) onToken(tail); break }
    onToken(decoder.decode(value, { stream: true }))
  }
}
