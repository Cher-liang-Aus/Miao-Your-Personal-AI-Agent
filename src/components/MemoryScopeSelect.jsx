import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import styles from './MemoryScopeSelect.module.css'

const OPTIONS = [
  { value: 'saved', label: 'Saved memory' },
  { value: 'chat', label: 'This chat only' },
]

export default function MemoryScopeSelect({ value, label, onChange }) {
  const triggerRef = useRef(null)
  const menuRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState(null)

  function updatePosition() {
    const rect = triggerRef.current?.getBoundingClientRect()
    if (!rect) return
    const menuWidth = 158
    const menuHeight = 84
    const left = Math.max(8, Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8))
    const below = window.innerHeight - rect.bottom >= menuHeight + 12
    const top = below
      ? rect.bottom + 6
      : Math.max(8, Math.min(rect.top - menuHeight - 6, window.innerHeight - menuHeight - 8))
    setPosition({ top, left, width: menuWidth })
  }

  useEffect(() => {
    if (!open) return undefined
    updatePosition()
    const handlePointer = event => {
      if (!triggerRef.current?.contains(event.target) && !menuRef.current?.contains(event.target)) setOpen(false)
    }
    const handleKey = event => {
      if (event.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault()
        const current = OPTIONS.findIndex(option => option.value === value)
        const direction = event.key === 'ArrowDown' ? 1 : -1
        const next = (current + direction + OPTIONS.length) % OPTIONS.length
        menuRef.current?.querySelectorAll('[role="option"]')[next]?.focus()
      }
    }
    document.addEventListener('pointerdown', handlePointer)
    document.addEventListener('keydown', handleKey)
    document.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)
    return () => {
      document.removeEventListener('pointerdown', handlePointer)
      document.removeEventListener('keydown', handleKey)
      document.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [open, value])

  const selected = OPTIONS.find(option => option.value === value) || OPTIONS[0]

  return (
    <>
      <button ref={triggerRef} type="button" className={`${styles.trigger} ${open ? styles.triggerOpen : ''}`}
        aria-label={label} aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen(current => !current)}
        onKeyDown={event => {
          if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            setOpen(true)
          }
        }}>
        <span>{selected.label}</span>
        <svg className={open ? styles.chevronOpen : ''} width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <path d="m3 4.5 3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && position && createPortal(
        <div ref={menuRef} className={styles.menu} role="listbox" aria-label={label} style={position}>
          {OPTIONS.map(option => (
            <button key={option.value} type="button" role="option" aria-selected={value === option.value}
              className={`${styles.option} ${value === option.value ? styles.optionSelected : ''}`}
              onClick={() => { onChange(option.value); setOpen(false); triggerRef.current?.focus() }}>
              <span>{option.label}</span>{value === option.value && <span className={styles.check} aria-hidden="true">✓</span>}
            </button>
          ))}
        </div>, document.body,
      )}
    </>
  )
}
