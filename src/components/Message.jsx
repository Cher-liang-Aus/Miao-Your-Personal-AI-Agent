import { useState, useRef, useEffect } from 'react'
import styles from './Message.module.css'

export default function Message({ msg, userProfile, onFeedback, isLast, feedbackHistory }) {
  const [showCorrection, setShowCorrection] = useState(false)
  const [correction, setCorrection]         = useState('')
  const [submitted, setSubmitted]           = useState(false)
  const textareaRef = useRef(null)

  const isUser      = msg.role === 'user'
  const isStreaming = msg.streaming
  const hasFeedback = !!msg.feedback
  const isLiked     = msg.feedback === 'positive'
  const isDisliked  = msg.feedback === 'negative'
  const isCorrected = msg.feedback === 'correction'

  // Focus correction textarea when it appears
  useEffect(() => {
    if (showCorrection && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [showCorrection])

  function handleThumb(type) {
    if (hasFeedback) return
    onFeedback(msg.id, type)
  }

  function handleCorrectionSubmit() {
    if (!correction.trim()) return
    onFeedback(msg.id, 'correction', correction.trim())
    setSubmitted(true)
    setShowCorrection(false)
    setCorrection('')
  }

  function handleCorrectionKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleCorrectionSubmit() }
    if (e.key === 'Escape') { setShowCorrection(false); setCorrection('') }
  }

  const initial = userProfile?.name?.charAt(0)?.toUpperCase() || 'U'

  return (
    <div className={`${styles.row} ${isUser ? styles.userRow : styles.asstRow}`}>
      {/* Avatar */}
      {!isUser && (
        <div className={styles.avatar}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" strokeWidth="1.3"/>
            <path d="M4 7c0-1.38 1.12-2.5 2.5-2.5S9 5.62 9 7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            <circle cx="6.5" cy="8.8" r="0.75" fill="currentColor"/>
          </svg>
        </div>
      )}

      <div className={styles.bubbleWrap}>
        {/* Sender label */}
        <div className={styles.senderLabel}>
          {isUser ? userProfile?.name || 'You' : 'Miao'}
        </div>

        {/* Bubble */}
        <div className={`${styles.bubble} ${isUser ? styles.userBubble : styles.asstBubble}`}>
          {msg.content
            ? <div className={styles.content} dangerouslySetInnerHTML={{ __html: formatContent(msg.content) }} />
            : isStreaming && <div className={styles.thinkingDots}><span /><span /><span /></div>
          }
          {isStreaming && msg.content && <span className={styles.cursor} />}
        </div>

        {/* Feedback bar — only for assistant messages that are done */}
        {!isUser && !isStreaming && msg.content && (
          <div className={styles.feedbackBar}>
            <div className={styles.reactions}>
              <button
                className={`${styles.thumbBtn} ${isLiked ? styles.liked : ''} ${hasFeedback && !isLiked ? styles.muted : ''}`}
                onClick={() => handleThumb('positive')}
                disabled={hasFeedback}
                title="Good response"
              >
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path d="M4.5 5.5l2-3.5 1.2.6L6.5 5h4a1 1 0 01.97 1.25l-1 4A1 1 0 019.5 11H5a1 1 0 01-1-1V6a1 1 0 011-1v.5zM2 6h1.5v5H2V6z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
                </svg>
                {isLiked && <span className={styles.feedbackLabel}>Liked</span>}
              </button>

              <button
                className={`${styles.thumbBtn} ${styles.thumbDown} ${isDisliked ? styles.disliked : ''} ${hasFeedback && !isDisliked ? styles.muted : ''}`}
                onClick={() => handleThumb('negative')}
                disabled={hasFeedback}
                title="Poor response"
              >
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path d="M8.5 7.5l-2 3.5-1.2-.6L6.5 8h-4A1 1 0 011.53 6.75l1-4A1 1 0 013.5 2H8a1 1 0 011 1v4a1 1 0 01-1 1v-.5zM11 7H9.5V2H11v5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
                </svg>
                {isDisliked && <span className={styles.feedbackLabel}>Noted</span>}
              </button>

              {!hasFeedback && (
                <button
                  className={`${styles.correctBtn} ${showCorrection ? styles.correctBtnActive : ''}`}
                  onClick={() => setShowCorrection(v => !v)}
                  title="Give a correction"
                >
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                    <path d="M7.5 1.5l2 2-5 5H2.5v-2l5-5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
                  </svg>
                  Correct
                </button>
              )}

              {isCorrected && (
                <span className={styles.correctedTag}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2 2 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  Correction saved
                </span>
              )}
            </div>
          </div>
        )}



        {/* Correction input */}
        {showCorrection && !submitted && (
          <div className={styles.correctionBox}>
            <p className={styles.correctionHint}>Tell Miao what to do differently:</p>
            <textarea
              ref={textareaRef}
              className={styles.correctionInput}
              value={correction}
              onChange={e => setCorrection(e.target.value)}
              onKeyDown={handleCorrectionKey}
              placeholder='e.g. "Be shorter" · "Less formal" · "Give me examples"'
              rows={2}
            />
            <div className={styles.correctionActions}>
              <button className={styles.correctionCancel} onClick={() => { setShowCorrection(false); setCorrection('') }}>
                Cancel
              </button>
              <button
                className={`${styles.correctionSubmit} ${!correction.trim() ? styles.correctionDisabled : ''}`}
                onClick={handleCorrectionSubmit} disabled={!correction.trim()}
              >
                Save correction
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User avatar */}
      {isUser && (
        <div className={`${styles.avatar} ${styles.userAvatar}`}>{initial}</div>
      )}
    </div>
  )
}

function formatContent(text) {
  // Basic markdown: **bold**, `code`, newlines
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br/>')
}




