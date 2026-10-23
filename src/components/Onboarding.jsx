import { useEffect, useRef, useState } from 'react'
import styles from './Onboarding.module.css'

const STYLE_OPTIONS = [
  { id: 'casual',   label: 'Casual',   desc: 'Warm and friendly',     icon: '☀️' },
  { id: 'concise',  label: 'Concise',  desc: 'Short, no fluff',       icon: '⚡' },
  { id: 'formal',   label: 'Formal',   desc: 'Professional & polished',icon: '🎩' },
  { id: 'detailed', label: 'Detailed', desc: 'Thorough, full context', icon: '🔬' },
]

const INTEREST_OPTIONS = [
  'Writing & creativity','Research & learning','Productivity','Career & work',
  'Health & wellness','Finance','Technology','Personal growth',
]

export default function Onboarding({ onComplete }) {
  const [step, setStep]           = useState(0)
  const [name, setName]           = useState('')
  const [style, setStyle]         = useState('')
  const [interests, setInterests] = useState([])
  const [bio, setBio]             = useState('')
  const [exiting, setExiting]     = useState(false)
  const rootRef = useRef(null)
  const orb2Ref = useRef(null)

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine) and (prefers-reduced-motion: no-preference)').matches) return

    const root = rootRef.current
    const orb = orb2Ref.current
    if (!root || !orb) return

    let frame = 0
    let pointerX = window.innerWidth * 0.72
    let pointerY = window.innerHeight * 0.82
    const handleMove = event => {
      pointerX = event.clientX
      pointerY = event.clientY
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        orb.style.left = pointerX + 'px'
        orb.style.top = pointerY + 'px'
      })
    }

    root.addEventListener('pointermove', handleMove, { passive: true })
    return () => {
      if (frame) cancelAnimationFrame(frame)
      root.removeEventListener('pointermove', handleMove)
    }
  }, [])

  const steps = [{ label: 'You' }, { label: 'Style' }, { label: 'About' }]

  function next() { step < 2 ? setStep(s => s + 1) : finish() }

  function finish() {
    setExiting(true)
    setTimeout(() => onComplete({ name: name.trim() || 'there', style, interests, bio }), 580)
  }

  function toggleInterest(i) {
    setInterests(p => p.includes(i) ? p.filter(x => x !== i) : [...p, i])
  }

  const canProceed = [name.trim().length > 0, style !== '', bio.trim().length > 10][step]

  return (
    <div ref={rootRef} className={`${styles.root} ${exiting ? styles.exiting : ''}`}>
      <div className={styles.ambient}>
        <div className={styles.orb1} />
        <div ref={orb2Ref} className={styles.orb2} />
        <div className={styles.grid} />
      </div>

      <div className={styles.container}>
        {/* Logo */}
        <div className={styles.logo}>
          <div className={styles.logoMark}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M5 8.5c0-1.657 1.343-3 3-3s3 1.343 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="8" cy="11" r="1" fill="currentColor"/>
            </svg>
          </div>
          <span className={styles.logoText}>Miao</span>
        </div>

        {/* Progress */}
        <div className={styles.progress}>
          {steps.map((s, i) => (
            <div key={i} className={styles.progressItem}>
              <div className={`${styles.progressDot} ${i < step ? styles.done : i === step ? styles.active : ''}`}>
                {i < step
                  ? <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2 2 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  : <span>{i + 1}</span>}
              </div>
              <span className={`${styles.progressLabel} ${i === step ? styles.activeLabel : ''}`}>{s.label}</span>
              {i < steps.length - 1 && <div className={`${styles.progressLine} ${i < step ? styles.lineDone : ''}`} />}
            </div>
          ))}
        </div>

        {/* Step card */}
        <div className={styles.card} key={step}>
          {step === 0 && <StepName  name={name}  onChange={setName}  onNext={next} />}
          {step === 1 && <StepStyle style={style} interests={interests} onStyleChange={setStyle} onToggleInterest={toggleInterest} />}
          {step === 2 && <StepBio   bio={bio}    onChange={setBio} />}
        </div>

        {/* Nav */}
        <div className={styles.nav}>
          {step > 0 && <button className={styles.btnBack} onClick={() => setStep(s => s - 1)}>← Back</button>}
          <button
            className={`${styles.btnNext} ${!canProceed ? styles.btnDisabled : ''}`}
            onClick={next} disabled={!canProceed}
          >
            <span>{step === 2 ? 'Meet Miao' : 'Continue'}</span>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2.5 7h9M8 3.5l3.5 3.5L8 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        <p className={styles.footnote}>Your data shapes only your agent — nothing is shared.</p>
      </div>
    </div>
  )
}

function StepName({ name, onChange, onNext }) {
  return (
    <div className={styles.stepInner}>
      <div className={styles.stepEyebrow}>Step 1 · Getting started</div>
      <h1 className={styles.stepTitle}>What should your<br /><em>agent call you?</em></h1>
      <p className={styles.stepDesc}>This starts a working relationship. Let's get the basics right first.</p>
      <input
        className={styles.input} type="text"
        placeholder="Your name or nickname"
        value={name} onChange={e => onChange(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && name.trim() && onNext()}
        autoFocus
      />
    </div>
  )
}

function StepStyle({ style, interests, onStyleChange, onToggleInterest }) {
  return (
    <div className={styles.stepInner}>
      <div className={styles.stepEyebrow}>Step 2 · Communication</div>
      <h1 className={styles.stepTitle}>How do you like to<br /><em>communicate?</em></h1>
      <p className={styles.stepDesc}>Miao will mirror your preferred style in every message.</p>
      <div className={styles.styleGrid}>
        {STYLE_OPTIONS.map(opt => (
          <button key={opt.id} className={`${styles.styleCard} ${style === opt.id ? styles.styleSelected : ''}`} onClick={() => onStyleChange(opt.id)}>
            <span className={styles.styleIcon}>{opt.icon}</span>
            <span className={styles.styleLabel}>{opt.label}</span>
            <span className={styles.styleDesc}>{opt.desc}</span>
          </button>
        ))}
      </div>
      <div className={styles.interestSection}>
        <p className={styles.interestLabel}>Interests <span>(optional)</span></p>
        <div className={styles.interestGrid}>
          {INTEREST_OPTIONS.map(i => (
            <button key={i} className={`${styles.tag} ${interests.includes(i) ? styles.tagActive : ''}`} onClick={() => onToggleInterest(i)}>{i}</button>
          ))}
        </div>
      </div>
    </div>
  )
}

function StepBio({ bio, onChange }) {
  return (
    <div className={styles.stepInner}>
      <div className={styles.stepEyebrow}>Step 3 · Almost there</div>
      <h1 className={styles.stepTitle}>Tell Miao a little<br /><em>about yourself</em></h1>
      <p className={styles.stepDesc}>What are you working on? What do you want help with? A few sentences is plenty.</p>
      <textarea
        className={styles.textarea} rows={5} autoFocus
        placeholder={`e.g. "I'm a product designer building a new app. I want help with writing, thinking through decisions, and staying organised."`}
        value={bio} onChange={e => onChange(e.target.value)}
      />
      <p className={styles.charCount}>{bio.length} chars</p>
    </div>
  )
}

