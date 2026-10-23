/**
 * Streams a response from Claude via the Anthropic API.
 * Set VITE_ANTHROPIC_API_KEY in .env.local to use the real API.
 * Falls back to a rich simulated stream if no key is present.
 */

const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY

export async function streamChatResponse({ systemPrompt, messages, onChunk, onDone, onError }) {
  if (!API_KEY) return simulateStream({ systemPrompt, messages, onChunk, onDone })

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'messages-2023-12-15',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: systemPrompt,
        messages,
        stream: true,
      }),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err?.error?.message || `API error ${response.status}`)
    }

    const reader  = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer    = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop()
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const data = line.slice(6).trim()
        if (data === '[DONE]') continue
        try {
          const event = JSON.parse(data)
          if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
            onChunk(event.delta.text)
          }
        } catch {}
      }
    }
    onDone()
  } catch (err) {
    if (onError) onError(err.message)
    else onDone()
  }
}

// ── Simulated stream ────────────────────────────────────────────────────────

async function simulateStream({ systemPrompt, messages, onChunk, onDone }) {
  const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content || ''
  const text        = generateResponse(systemPrompt, lastUserMsg, messages)
  const chunks      = tokenise(text)
  for (const chunk of chunks) {
    await sleep(22 + Math.random() * 38)
    onChunk(chunk)
  }
  onDone()
}

function tokenise(text) {
  const words = text.split(/(\s+)/)
  const chunks = []; let cur = ''; let count = 0
  for (const w of words) {
    cur += w
    if (/\s/.test(w)) count++
    if (count >= 1 + Math.floor(Math.random() * 2)) { chunks.push(cur); cur = ''; count = 0 }
  }
  if (cur) chunks.push(cur)
  return chunks
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

function generateResponse(sys, userMsg, messages) {
  const lower   = userMsg.toLowerCase()
  const sysl    = sys.toLowerCase()
  const isConcise  = sysl.includes('concise')
  const isFormal   = sysl.includes('formal')
  const isCasual   = sysl.includes('casual')
  const isDetailed = sysl.includes('detailed')
  const feedbackCount = (sys.match(/FEEDBACK FROM USER/g) || []).length
  const hasAdapted    = feedbackCount >= 1
  const corrections   = extractCorrections(sys)
  const isFirst       = messages.filter(m => m.role === 'assistant').length === 0
  const nameMatch     = sys.match(/speaking with ([A-Z][a-z]+)/)
  const name          = nameMatch ? nameMatch[1] : null

  // Greeting / intro
  if (isFirst) {
    if (isConcise)  return `Hey${name?` ${name}`:''}! I'm Miao. Let's keep things efficient — what are we working on?`
    if (isFormal)   return `Good to meet you${name?`, ${name}`:''}. I'm Miao, your personal AI agent. I've reviewed your profile and I'm ready to assist. What would you like to tackle?`
    if (isCasual)   return `Hey${name?` ${name}`:''}! 👋 I'm Miao — really excited to meet you. I've had a look at what you shared and I'm ready to jump in. What's on your mind?`
    if (isDetailed) return `Hello${name?`, ${name}`:''}. I'm Miao, your personal AI agent. I've carefully reviewed your onboarding responses and I'm configured to provide thorough, detailed support. What would you like to start with?`
    return `Hey${name?` ${name}`:''}! I'm Miao, your personal AI agent. Excited to get started — what's on your mind today?`
  }

  // Apply corrections if any
  if (hasAdapted && corrections.length) {
    const c = corrections[0].toLowerCase()
    if (c.includes('short') || c.includes('brief') || c.includes('concis')) {
      return pickRandom(CONCISE_RESPONSES)
    }
    if (c.includes('formal') || c.includes('professional')) {
      return pickRandom(FORMAL_RESPONSES)
    }
    if (c.includes('casual') || c.includes('informal') || c.includes('friendly')) {
      return pickRandom(CASUAL_RESPONSES)
    }
    if (c.includes('detail') || c.includes('more') || c.includes('thorough')) {
      return pickRandom(DETAILED_RESPONSES)
    }
  }

  // Topic routing
  if (/hello|hi |hey /.test(lower)) return style('Hey! Good to hear from you.', 'Greetings. How can I assist?', 'Hey! 👋 What\'s up?', 'Hello. Ready when you are.', isConcise,isFormal,isCasual,isDetailed)
  if (/help|what can you/.test(lower)) return style('Writing, research, planning, brainstorming. What do you need?','I can assist with writing, research, strategic planning, and decision support. Where shall we begin?','Oh, loads! Writing, research, planning, thinking things through — basically whatever you\'re stuck on. What\'s going on?','I can assist with writing and editing, research and summarisation, planning and prioritisation, brainstorming, and complex decision-making. Which area would be most useful right now?',isConcise,isFormal,isCasual,isDetailed)
  if (/write|draft|email|message/.test(lower)) return style('Sure. Give me the key points and I\'ll draft it.','I\'d be glad to help. Please share the purpose, recipient, and any tone requirements.','On it! Tell me who it\'s for and what you\'re trying to say — I\'ll put something together.','Happy to help. I\'ll need the recipient context, desired outcome, and tone. Once I have that, I\'ll draft something for you to refine.',isConcise,isFormal,isCasual,isDetailed)
  if (/plan|schedule|organis|organiz/.test(lower)) return style('Let\'s break it down. What\'s the goal and deadline?','I can assist with planning. Please provide your objective, timeline, and key constraints.','Planning is my jam! What are you trying to get done? Tell me the goal and any blockers.','Planning works best when we start with the goal, then the timeline, then any constraints. Once I understand those three dimensions I can map out a clear path.',isConcise,isFormal,isCasual,isDetailed)

  // Generic fallback styled by preference
  if (isConcise)  return pickRandom(CONCISE_RESPONSES)
  if (isFormal)   return pickRandom(FORMAL_RESPONSES)
  if (isCasual)   return pickRandom(CASUAL_RESPONSES)
  if (isDetailed) return pickRandom(DETAILED_RESPONSES)
  return `That's a good one. ${pickRandom(CONTINUATIONS)}`
}

function extractCorrections(sys) {
  const matches = sys.match(/- "([^"]+)"/g) || []
  return matches.map(m => m.replace(/^- "/, '').replace(/"$/, ''))
}

function style(c, f, ca, d, isConcise, isFormal, isCasual, isDetailed) {
  if (isConcise)  return c
  if (isFormal)   return f
  if (isCasual)   return ca
  if (isDetailed) return d
  return c
}

function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)] }

const CONCISE_RESPONSES = [
  'On it. What\'s the core objective?',
  'Makes sense. What do you need from me here?',
  'Got it. A few options — want me to lay them out?',
  'Noted. Next step?',
  'Clear. Draft it or think through it together?',
]
const FORMAL_RESPONSES = [
  'Thank you for the context. To proceed effectively, could you elaborate on the specific requirements?',
  'I understand. There are several considerations worth examining — shall I outline them?',
  'That\'s a reasonable direction. I\'d recommend approaching this systematically. What aspect shall we address first?',
  'Understood. I\'ll ensure my response addresses your requirements precisely.',
]
const CASUAL_RESPONSES = [
  'Oh interesting! Yeah I can definitely help with that. Where do you want to start?',
  'Love this — okay so here\'s what I\'m thinking...',
  'Totally get that. Here\'s what I\'d try first.',
  'Nice! Let\'s figure this out together. What\'s the context?',
]
const DETAILED_RESPONSES = [
  'This is a multi-faceted question worth unpacking carefully. There are at least three dimensions to consider: the immediate task, the broader goal it serves, and the constraints shaping your options. Shall I walk through each?',
  'To give you a thorough answer I want to make sure I understand the full picture. There are several layers here — the immediate context, your underlying goal, and any tradeoffs worth surfacing. Let me address each in turn.',
]
const CONTINUATIONS = [
  'Walk me through what you\'ve already tried.',
  'What matters most to you in how this comes out?',
  'What\'s the context behind this?',
  'What does success look like for you here?',
]

