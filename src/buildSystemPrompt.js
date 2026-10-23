const STYLE_DESCRIPTIONS = {
  casual: 'warm, conversational, friendly — like texting a smart friend. Use contractions, occasional humour, and an approachable tone.',
  concise: 'brief and direct. Short sentences. No filler. Get to the point immediately. Skip pleasantries unless they serve a purpose.',
  formal: 'professional and polished. Complete sentences, no contractions, a measured respectful tone throughout.',
  detailed: 'thorough and comprehensive. Provide context, explain trade-offs, include nuance. The user values depth over brevity.',
}
const STYLE_LABELS = { casual: 'Casual & friendly', concise: 'Concise & direct', formal: 'Formal & professional', detailed: 'Detailed & thorough' }

export function buildSystemPrompt(userProfile = {}, feedbackHistory = [], memoryItems = [], goal = null) {
  const enabled = memoryItems.filter(item => item.enabled && String(item.value ?? '').trim())
  const memoryValue = kind => enabled.find(item => item.kind === kind)?.value
  const name = memoryValue('name')?.trim() || ''
  const styleValue = memoryValue('style')
  const styleKey = Object.keys(STYLE_LABELS).find(key => key === styleValue || STYLE_LABELS[key] === styleValue)
  const styleDesc = styleKey ? STYLE_DESCRIPTIONS[styleKey] : (styleValue || STYLE_DESCRIPTIONS.casual)
  const extraContext = enabled.filter(item => !['name', 'style'].includes(item.kind))
  const interest = extraContext.find(item => item.kind === 'interests')
  const about = extraContext.find(item => item.kind === 'about')

  let prompt = `You are Miao, a personal AI agent. You are speaking with ${name || 'the user'}.\n\nCOMMUNICATION STYLE: Be ${styleDesc}`
  if (interest?.value?.trim()) prompt += `\nUser interests: ${interest.value.trim()}.`
  if (about?.value?.trim()) prompt += `\nAbout the user: ${about.value.trim()}`
  const otherContext = extraContext.filter(item => !['interests', 'about'].includes(item.kind))
  if (otherContext.length) prompt += `\nUser-approved context:\n${otherContext.map(item => `- ${item.label}: ${item.value}`).join('\n')}`
  prompt += name
    ? `\n\nAddress the user as ${name}. Stay in character as a helpful, intelligent personal agent.`
    : '\n\nDo not guess the user’s name. Stay in character as a helpful, intelligent personal agent.'

  if (goal) prompt += `\n\nACTIVE SAMPLE FOCUS (treat as user-provided project context): ${goal.title}. ${goal.description} Next step: ${goal.nextStep}`

  if (feedbackHistory?.length > 0) {
    const recent = feedbackHistory.slice(-6)
    const positives = recent.filter(f => f.type === 'positive')
    const negatives = recent.filter(f => f.type === 'negative')
    const corrections = recent.filter(f => f.type === 'correction' && f.text)
    prompt += '\n\n--- FEEDBACK FROM USER (apply immediately) ---'
    if (positives.length) prompt += `\nUser LIKED responses that were: ${positives.map(f => f.summary).join('; ')}.`
    if (negatives.length) prompt += `\nUser DISLIKED responses that were: ${negatives.map(f => f.summary).join('; ')}.`
    if (corrections.length) prompt += `\nExplicit corrections — follow precisely:\n${corrections.map(f => `- "${f.text}"`).join('\n')}`
    prompt += '\n--- END FEEDBACK ---'
    prompt += `\n\nIMPORTANT: You have received ${feedbackHistory.length} feedback signal(s). Your next response MUST demonstrably reflect this feedback.`
  }
  return prompt
}

export function buildMemorySummary(userProfile = {}, feedbackHistory = []) {
  const { name, style, interests, bio } = userProfile
  const lines = []
  if (name) lines.push({ key: 'Name', value: name })
  if (style) lines.push({ key: 'Style', value: styleLabel(style) })
  if (interests?.length) lines.push({ key: 'Interests', value: interests.join(', ') })
  if (bio?.trim()) lines.push({ key: 'About you', value: bio.trim() })
  const positives = feedbackHistory.filter(f => f.type === 'positive').length
  const negatives = feedbackHistory.filter(f => f.type === 'negative').length
  const corrections = feedbackHistory.filter(f => f.type === 'correction')
  const parts = []
  if (positives) parts.push(`${positives} liked`)
  if (negatives) parts.push(`${negatives} disliked`)
  if (parts.length) lines.push({ key: 'Feedback given', value: parts.join(' · ') })
  if (corrections.length) lines.push({ key: 'Active corrections', value: corrections.map(c => `"${c.text}"`).join(', '), highlight: true })
  const total = feedbackHistory.length
  const status = total >= 2 ? 'active' : total === 1 ? 'warming' : 'idle'
  const statusValue = total >= 2
    ? `Miao has adapted its style based on your ${total} feedback signals`
    : total === 1 ? 'Warming up — 1 more signal will activate adaptation' : 'Not active yet — react to a message to start shaping Miao'
  lines.push({ key: 'Adaptation', value: statusValue, status })
  return lines
}

function styleLabel(style) {
  return STYLE_LABELS[style] || style
}

