import { useState, useRef, useEffect, useCallback } from 'react'
import { streamChatResponse } from '../claudeApi.js'
import { buildSystemPrompt, buildMemorySummary } from '../buildSystemPrompt.js'
import MemoryPanel from './MemoryPanel.jsx'
import Message from './Message.jsx'
import ActionPreview from './ActionPreview.jsx'
import styles from './Chat.module.css'


export default function Chat({
  userProfile, memoryItems, onMemoryAction, goal, actionPlan, planApproved,
  onPreviewPlan, onApprovePlan, onTogglePlanStep, onDismissPlan, onAdjustPlan,
  draftRequest, onDraftRequestConsumed, onHome, openMemoryOnNextChat, onMemoryOpenConsumed,
}) {
  const [messages, setMessages] = useState([])
  const [feedbackHistory, setFeedbackHistory] = useState([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState(null)
  const [memoryOpen, setMemoryOpen] = useState(false)
  const [appeared, setAppeared] = useState(false)
  const greetedRef = useRef(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    const timer = setTimeout(() => setAppeared(true), 60)
    return () => clearTimeout(timer)
  }, [])
  useEffect(() => {
    if (!openMemoryOnNextChat) return
    setMemoryOpen(true)
    onMemoryOpenConsumed?.()
  }, [openMemoryOnNextChat]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!greetedRef.current && messages.length === 0) {
      greetedRef.current = true
      sendGreeting()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, actionPlan])
  useEffect(() => {
    if (draftRequest) {
      setInput(draftRequest)
      onDraftRequestConsumed?.()
      setTimeout(() => inputRef.current?.focus(), 80)
    }
  }, [draftRequest, onDraftRequestConsumed])

  function getSysPrompt(feedback = feedbackHistory) {
    return buildSystemPrompt(userProfile, feedback, memoryItems, goal)
  }

  async function streamInto(id, systemPrompt, history) {
    await streamChatResponse({
      systemPrompt,
      messages: history,
      onChunk: chunk => setMessages(previous => previous.map(message => message.id === id ? { ...message, content: message.content + chunk } : message)),
      onDone: () => {
        setMessages(previous => previous.map(message => message.id === id ? { ...message, streaming: false } : message))
        setStreaming(false)
        inputRef.current?.focus()
      },
      onError: message => {
        setError(message)
        setMessages(previous => previous.map(item => item.id === id ? { ...item, streaming: false } : item))
        setStreaming(false)
      },
    })
  }

  async function sendGreeting() {
    const id = crypto.randomUUID()
    setMessages([{ id, role: 'assistant', content: '', streaming: true }])
    setStreaming(true)
    await streamInto(id, getSysPrompt([]), [{ role: 'user', content: 'Hello, please introduce yourself briefly.' }])
  }

  async function sendMessage(text) {
    if (!text.trim() || streaming) return
    const userMessage = { id: crypto.randomUUID(), role: 'user', content: text.trim() }
    const assistantId = crypto.randomUUID()
    setMessages(previous => [...previous, userMessage, { id: assistantId, role: 'assistant', content: '', streaming: true }])
    setInput('')
    setStreaming(true)
    setError(null)
    const history = [...messages, userMessage].map(message => ({ role: message.role, content: message.content }))
    await streamInto(assistantId, getSysPrompt(), history)
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      sendMessage(input)
    }
  }

  const handleFeedback = useCallback((messageId, type, text = null) => {
    setMessages(previous => previous.map(message => message.id === messageId ? { ...message, feedback: type } : message))
    const message = messages.find(item => item.id === messageId)
    const preview = message?.content?.slice(0, 55) || ''
    const summary = `responses like: "${preview}…"`
    setFeedbackHistory(previous => [...previous, { type, summary, text, msgId: messageId, ts: Date.now() }])
  }, [messages])

  const memorySummary = buildMemorySummary(userProfile || {}, feedbackHistory)
  const feedbackCount = feedbackHistory.length

  return (
    <div className={`${styles.root} ${appeared ? styles.appeared : ''}`}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <button className={styles.homeBtn} onClick={onHome} title="Back to your workspace">← <span>Workspace</span></button>
          <div className={styles.agentAvatar}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.4"/><path d="M4.5 7.5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><circle cx="7" cy="9.5" r=".8" fill="currentColor"/></svg>
          </div>
          <div><div className={styles.agentName}>Miao</div><div className={styles.agentStatus}><span className={`${styles.statusDot} ${streaming ? styles.thinking : styles.ready}`} />{streaming ? 'Thinking…' : 'Ready'}</div></div>
        </div>
        <div className={styles.headerRight}>
          {feedbackCount >= 2 && <div className={styles.adaptedBadge}><svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg><span>Adapted · {feedbackCount} signals</span></div>}
          <button className={`${styles.memoryBtn} ${memoryOpen ? styles.memoryBtnActive : ''}`} onClick={() => setMemoryOpen(open => !open)} aria-label="Manage context" title="Manage context">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 3h10v2H2zM2 6.5h7v2H2zM2 10h5v2H2z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg>
            <span>Context</span><span className={styles.memoryBadge}>{memoryItems.filter(item => item.enabled).length}</span>
          </button>
        </div>
      </header>

      <div className={styles.body}>
        <div className={styles.chatColumn}>
          {goal && <div className={styles.goalRibbon}>
            <span className={styles.goalKicker}><i /> SAMPLE FOCUS</span>
            <span className={styles.goalTitle}>{goal.title}</span>
            <button onClick={() => onPreviewPlan(input.trim() || goal.nextStep)}>Preview a plan</button>
          </div>}

          <div className={styles.messageList}>
            {actionPlan && <div className={styles.inlinePlan}><ActionPreview plan={actionPlan} approved={planApproved}
              onApprove={onApprovePlan} onToggleStep={onTogglePlanStep} onAdjust={() => onAdjustPlan(actionPlan.request)}
              onContinue={() => inputRef.current?.focus()} onClose={onDismissPlan} /></div>}
            {messages.length === 0 && <div className={styles.emptyState}><div className={styles.emptyIcon}><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/><path d="M8 12.5c0-2.21 1.79-4 4-4s4 1.79 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="12" cy="15" r="1" fill="currentColor"/></svg></div><p>Starting your conversation…</p></div>}
            {messages.map((message, index) => <Message key={message.id} msg={message} userProfile={userProfile} onFeedback={handleFeedback}
              isLast={index === messages.length - 1} feedbackHistory={feedbackHistory} />)}
            {error && <div className={styles.errorBanner}><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" strokeWidth="1.2"/><path d="M6.5 4v3M6.5 8.5v.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>{error}<button onClick={() => setError(null)}>×</button></div>}
            <div ref={bottomRef} />
          </div>

          <div className={styles.inputArea}>
            {feedbackCount === 1 && <div className={styles.nudge}>💡 One more feedback signal will activate Miao’s adaptation</div>}
            <div className={styles.inputWrap}>
              <textarea ref={inputRef} className={styles.input} value={input} onChange={event => setInput(event.target.value)}
                onKeyDown={handleKeyDown} placeholder="Message Miao…" rows={1} disabled={streaming} />
              <button className={styles.planBtn} onClick={() => onPreviewPlan(input.trim() || goal?.nextStep)} disabled={streaming} title="Preview a plan before approving">✦ <span>Plan</span></button>
              <button className={`${styles.sendBtn} ${(!input.trim() || streaming) ? styles.sendDisabled : ''}`} onClick={() => sendMessage(input)} disabled={!input.trim() || streaming}>
                {streaming ? <span className={styles.spinner} /> : <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7h10M7.5 3l4.5 4-4.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              </button>
            </div>
            <p className={styles.inputHint}>Enter to send · Shift+Enter for new line · Plan previews stay under your control</p>
          </div>
        </div>
        {memoryOpen && <MemoryPanel summary={memorySummary} feedbackHistory={feedbackHistory} memoryItems={memoryItems}
          onMemoryAction={onMemoryAction} onClose={() => setMemoryOpen(false)} />}
      </div>
    </div>
  )
}



