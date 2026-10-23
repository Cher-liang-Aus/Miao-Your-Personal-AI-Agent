import MemoryScopeSelect from './MemoryScopeSelect.jsx'
import styles from './MemoryPanel.module.css'

const STATUS_COLORS = {
  active: { bg: 'var(--green-dim)', border: 'rgba(74,222,128,0.25)', text: 'var(--green)' },
  warming: { bg: 'var(--amber-dim)', border: 'rgba(251,191,36,0.25)', text: 'var(--amber)' },
  idle: { bg: 'var(--bg-5)', border: 'var(--border-2)', text: 'var(--text-3)' },
}
const TYPE_LABELS = { positive: 'Liked', negative: 'Disliked', correction: 'Corrected' }
const TYPE_COLORS = {
  positive: { bg: 'var(--green-dim)', border: 'rgba(74,222,128,0.2)', text: 'var(--green)' },
  negative: { bg: 'var(--red-dim)', border: 'rgba(248,113,113,0.2)', text: 'var(--red)' },
  correction: { bg: 'var(--accent-dim)', border: 'var(--accent-border)', text: 'var(--accent-text)' },
}

export default function MemoryPanel({ summary, feedbackHistory, memoryItems = [], onMemoryAction, onClose }) {
  const feedbackWithText = feedbackHistory.filter(f => f.type === 'correction' && f.text)
  const recentFeedback = feedbackHistory.slice(-5).reverse()

  return (
    <aside className={styles.panel}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1.5 3h11v2h-11zM1.5 6.5h8v2h-8zM1.5 10h6v2h-6z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg>
          Your context
        </div>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close panel"><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 2l8 8M10 2L2 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg></button>
      </div>

      <div className={styles.body}>
        <div className={styles.section}>
          <div className={styles.sectionLabel}>Context library · {memoryItems.length}</div>
          {memoryItems.length ? (
            <div className={styles.memoryLibrary}>
              {memoryItems.map(item => (
                <article className={`${styles.memoryItem} ${!item.enabled ? styles.memoryItemPaused : ''}`} key={item.id}>
                  <div className={styles.memoryItemTop}>
                    <label className={styles.memoryLabel} htmlFor={`memory-${item.id}`}>{item.label}</label>
                    <button className={styles.forgetBtn} onClick={() => onMemoryAction({ type: 'forget', id: item.id })}>Forget</button>
                  </div>
                  <textarea id={`memory-${item.id}`} className={styles.memoryValue} rows={2} value={item.value}
                    onChange={event => onMemoryAction({ type: 'edit', id: item.id, value: event.target.value })}
                    aria-label={`Edit ${item.label}`} />
                  <small className={styles.memorySource}>{item.source}</small>
                  <div className={styles.memoryControls}>
                    <button className={`${styles.useToggle} ${item.enabled ? styles.useToggleOn : ''}`}
                      onClick={() => onMemoryAction({ type: 'toggle', id: item.id })} aria-pressed={item.enabled}>
                      <i />{item.enabled ? 'In use' : 'Paused'}
                    </button>
                    <MemoryScopeSelect value={item.scope || 'saved'} label={`${item.label} memory scope`}
                      onChange={scope => onMemoryAction({ type: 'scope', id: item.id, scope })} />
                  </div>
                </article>
              ))}
            </div>
          ) : <p className={styles.noMemory}>No profile context is saved. You can still chat without it.</p>}
          <p className={styles.libraryNote}>Only enabled notes enter the assistant prompt. Saved notes stay in this browser; chat-only notes do not persist after reload.</p>
        </div>

        {summary.map((item, i) => {
          if (!item.status) return null
          const color = STATUS_COLORS[item.status] || STATUS_COLORS.idle
          return <div key={i} className={styles.section}><div className={styles.sectionLabel}>Adaptation</div><div className={styles.statusBox} style={{ background: color.bg, border: `1px solid ${color.border}` }}><div className={styles.statusDot} style={{ background: color.text }} /><span className={styles.statusText} style={{ color: color.text }}>{item.value}</span></div></div>
        })}

        {feedbackWithText.length > 0 && <div className={styles.section}><div className={styles.sectionLabel}>Active corrections</div><div className={styles.correctionList}>{feedbackWithText.map((f, i) => <div key={i} className={styles.correctionItem}><svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M6.5 1l2 2-4.5 4.5H2v-2L6.5 1z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round"/></svg>“{f.text}”</div>)}</div></div>}
        {recentFeedback.length > 0 && <div className={styles.section}><div className={styles.sectionLabel}>Recent feedback</div><div className={styles.feedbackList}>{recentFeedback.map((f, i) => {
          const color = TYPE_COLORS[f.type] || TYPE_COLORS.positive
          return <div key={i} className={styles.feedbackItem}><span className={styles.feedbackType} style={{ background: color.bg, border: `1px solid ${color.border}`, color: color.text }}>{TYPE_LABELS[f.type] || f.type}</span><span className={styles.feedbackPreview}>{f.type === 'correction' && f.text ? `“${f.text}”` : `${f.summary?.slice(0, 40)}…`}</span></div>
        })}</div></div>}
        {feedbackHistory.length === 0 && <div className={styles.emptyFeedback}><svg width="28" height="28" viewBox="0 0 28 28" fill="none"><circle cx="14" cy="14" r="12" stroke="currentColor" strokeWidth="1.2"/><path d="M10 12c0-2.21 1.79-4 4-4s4 1.79 4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><circle cx="14" cy="17" r="1.5" fill="currentColor"/></svg><p>No feedback yet</p><p className={styles.emptyHint}>Use 👍 👎 or “Correct” after<br/>a message to start shaping Miao</p></div>}
      </div>
    </aside>
  )
}



