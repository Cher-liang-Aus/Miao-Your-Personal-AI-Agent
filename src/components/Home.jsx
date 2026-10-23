import ActionPreview from './ActionPreview.jsx'
import styles from './Home.module.css'

export default function Home({
  userProfile, goal, memoryItems, actionPlan, planApproved,
  onPreviewPlan, onApprovePlan, onTogglePlanStep, onDismissPlan,
  onOpenChat, onManageContext, onAdjustPlan,
}) {
  const firstName = userProfile?.name?.split(' ')[0] || 'there'
  const initial = firstName.charAt(0).toUpperCase()
  const activeContextCount = memoryItems.filter(item => item.enabled).length

  return (
    <div className={styles.page}>
      <div className={styles.ambient} aria-hidden="true"><span className={styles.orb} /><span className={styles.grid} /></div>
      <div className={styles.shell}>
        <header className={styles.header}>
          <div className={styles.brand}>
            <span className={styles.brandMark}><span /></span>
            <span><strong>Miao</strong><small>PERSONAL CONTINUITY</small></span>
          </div>
          <div className={styles.headerRight}><span className={styles.privacy}><i /> Private workspace</span><span className={styles.avatar}>{initial}</span></div>
        </header>

        <main className={styles.main}>
          <section className={styles.intro}>
            <p className={styles.eyebrow}>YOUR WORKSPACE</p>
            <h1>Good to see you, <em>{firstName}</em>.</h1>
            <p>Pick up where your ideas left off.</p>
          </section>

          <section className={styles.focusCard}>
            <div className={styles.focusTop}>
              <span className={styles.focusLabel}><i /> OPEN LOOP</span>
              <span className={styles.inProgress}>IN PROGRESS</span>
            </div>
            <div className={styles.focusMain}>
              <h2>{goal.title}</h2>
              <p className={styles.focusDesc}>{goal.description}</p>
            </div>
            <div className={styles.nextMove}>
              <span className={styles.contextLabel}>NEXT MOVE</span>
              <p>{goal.nextStep}</p>
            </div>
            <p className={styles.lastSession}><span>LAST SESSION</span>{goal.lastSession}</p>
            <div className={styles.focusActions}>
              <button className={styles.primaryButton} onClick={onOpenChat}>Continue with Miao</button>
              <button className={styles.secondaryButton} onClick={() => onPreviewPlan(goal.nextStep)}>Preview next step</button>
            </div>
          </section>

          {actionPlan && <ActionPreview plan={actionPlan} approved={planApproved} onApprove={onApprovePlan} onToggleStep={onTogglePlanStep}
            onAdjust={() => onAdjustPlan(actionPlan.request)} onContinue={onOpenChat} onClose={onDismissPlan} showContinue />}

          <section className={styles.contextRow} aria-label="Saved context">
            <div className={styles.contextIcon}>✧</div>
            <div className={styles.contextSummary}>
              <strong>Context</strong>
              <span>{activeContextCount} active notes</span>
            </div>
            <button className={styles.manageButton} onClick={onManageContext}>Manage</button>
          </section>
        </main>
      </div>
    </div>
  )
}