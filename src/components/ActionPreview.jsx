import styles from './ActionPreview.module.css'

export default function ActionPreview({
  plan,
  approved,
  onApprove,
  onToggleStep,
  onAdjust,
  onContinue,
  onClose,
  showContinue = false,
}) {
  if (!plan) return null

  const doneCount = plan.steps.filter(step => step.done).length

  return (
    <section className={styles.card} aria-label="Action plan preview">
      <header className={styles.header}>
        <div className={styles.kicker}><span className={styles.spark}>✦</span> ACTION PREVIEW</div>
        <div className={styles.headerActions}>
          <span className={approved ? styles.approvedPill : styles.reviewPill}>
            {approved ? 'APPROVED' : 'REVIEW FIRST'}
          </span>
          {onClose && <button className={styles.close} onClick={onClose} aria-label="Close plan preview">×</button>}
        </div>
      </header>

      <div className={styles.titleRow}>
        <div>
          <h3>{approved ? 'A clear path forward' : 'Here’s a proposed path'}</h3>
          <p className={styles.request}>{plan.request}</p>
        </div>
        <span className={styles.stepCount}>{doneCount}/{plan.steps.length}</span>
      </div>

      <div className={styles.steps}>
        {plan.steps.map((step, index) => (
          <button
            key={step.id}
            className={`${styles.step} ${step.done ? styles.stepDone : ''} ${approved ? styles.stepClickable : ''}`}
            onClick={() => approved && onToggleStep?.(step.id)}
            disabled={!approved}
            aria-pressed={step.done}
          >
            <span className={styles.stepNumber}>{step.done ? '✓' : String(index + 1).padStart(2, '0')}</span>
            <span className={styles.stepCopy}>
              <strong>{step.title}</strong>
              <small>{step.detail}</small>
            </span>
            {approved && <span className={styles.stepState}>{step.done ? 'Done' : 'Mark done'}</span>}
          </button>
        ))}
      </div>

      <footer className={styles.footer}>
        <p>{approved ? 'This demo plan stays under your control.' : 'Nothing runs or gets sent until you approve.'}</p>
        {!approved ? (
          <div className={styles.actions}>
            {onAdjust && <button className={styles.adjust} onClick={onAdjust}>Adjust</button>}
            <button className={styles.approve} onClick={onApprove}>Approve plan</button>
          </div>
        ) : (
          <div className={styles.actions}>
            {onContinue && showContinue && <button className={styles.approve} onClick={onContinue}>Continue in chat</button>}
            {doneCount === plan.steps.length && <span className={styles.complete}>All steps reviewed</span>}
          </div>
        )}
      </footer>
    </section>
  )
}
