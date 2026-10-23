import { useState, useEffect } from 'react'
import Onboarding from './components/Onboarding.jsx'
import Home from './components/Home.jsx'
import Chat from './components/Chat.jsx'
import { createActionPlan, DEMO_GOAL } from './demoData.js'

function readLocal(key) {
  try {
    const value = window.localStorage.getItem(key)
    return value ? JSON.parse(value) : null
  } catch { return null }
}

function profileMemories(profile) {
  if (!profile) return []
  const styleLabels = { casual: 'Casual & friendly', concise: 'Concise & direct', formal: 'Formal & professional', detailed: 'Detailed & thorough' }
  const items = [
    { id: 'profile-name', kind: 'name', label: 'Your name', value: profile.name || '', source: 'Onboarding profile', enabled: true, scope: 'saved' },
    { id: 'profile-style', kind: 'style', label: 'Response style', value: styleLabels[profile.style] || profile.style || 'Casual & friendly', source: 'Onboarding profile', enabled: true, scope: 'saved' },
  ]
  if (profile.interests?.length) items.push({ id: 'profile-interests', kind: 'interests', label: 'Interests', value: profile.interests.join(', '), source: 'Onboarding profile', enabled: true, scope: 'saved' })
  if (profile.bio?.trim()) items.push({ id: 'profile-about', kind: 'about', label: 'About you', value: profile.bio.trim(), source: 'Onboarding profile', enabled: true, scope: 'saved' })
  return items
}

export default function App() {
  const [userProfile, setUserProfile] = useState(() => readLocal('miao.profile'))
  const [phase, setPhase] = useState('onboarding')
  const [chatStarted, setChatStarted] = useState(false)
  const [openMemoryOnNextChat, setOpenMemoryOnNextChat] = useState(false)
  const [memoryItems, setMemoryItems] = useState(() => {
    const saved = readLocal('miao.memories')
    return saved !== null ? saved : profileMemories(readLocal('miao.profile'))
  })
  const [actionPlan, setActionPlan] = useState(null)
  const [planApproved, setPlanApproved] = useState(false)
  const [draftRequest, setDraftRequest] = useState('')

  useEffect(() => {
    if (userProfile) window.localStorage.setItem('miao.profile', JSON.stringify(userProfile))
    else window.localStorage.removeItem('miao.profile')
  }, [userProfile])
  useEffect(() => {
    const saved = memoryItems.filter(item => item.scope === 'saved')
    window.localStorage.setItem('miao.memories', JSON.stringify(saved))
  }, [memoryItems])

  function handleOnboardingComplete(profile) {
    const nextUrl = new URL(window.location.href)
    nextUrl.searchParams.delete('onboarding')
    window.history.replaceState({}, '', nextUrl)
    setUserProfile(profile)
    setMemoryItems(profileMemories(profile))
    setPhase('home')
  }

  function openChat() {
    setChatStarted(true)
    setPhase('chat')
  }

  function openContextManager() {
    setOpenMemoryOnNextChat(true)
    openChat()
  }

  function previewPlan(request) {
    setActionPlan(createActionPlan(request, DEMO_GOAL))
    setPlanApproved(false)
  }

  function adjustPlan(request) {
    setDraftRequest(request)
    setActionPlan(null)
    openChat()
  }

  function handleMemoryAction(action) {
    setMemoryItems(current => {
      if (action.type === 'forget') return current.filter(item => item.id !== action.id)
      return current.map(item => {
        if (action.type === 'toggle') return { ...item, enabled: !item.enabled }
        if (action.type === 'edit') return { ...item, value: action.value }
        if (action.type === 'scope') return { ...item, scope: action.scope }
        return item
      })
    })
  }

  function togglePlanStep(stepId) {
    setActionPlan(current => current && ({
      ...current,
      steps: current.steps.map(step => step.id === stepId ? { ...step, done: !step.done } : step),
    }))
  }

  const sharedPlanProps = {
    actionPlan,
    planApproved,
    onPreviewPlan: previewPlan,
    onApprovePlan: () => setPlanApproved(true),
    onTogglePlanStep: togglePlanStep,
    onDismissPlan: () => { setActionPlan(null); setPlanApproved(false) },
  }

  return (
    <>
      {phase === 'onboarding' && <Onboarding onComplete={handleOnboardingComplete} />}
      {userProfile && phase === 'home' && <Home userProfile={userProfile} goal={DEMO_GOAL} memoryItems={memoryItems}
        {...sharedPlanProps} onOpenChat={openChat} onManageContext={openContextManager} onAdjustPlan={adjustPlan} />}
      {userProfile && chatStarted && <div style={{ display: phase === 'chat' ? 'flex' : 'none', height: '100vh' }}>
        <Chat userProfile={userProfile} memoryItems={memoryItems} onMemoryAction={handleMemoryAction} goal={DEMO_GOAL}
          {...sharedPlanProps} draftRequest={draftRequest} onDraftRequestConsumed={() => setDraftRequest('')} onHome={() => setPhase('home')}
          openMemoryOnNextChat={openMemoryOnNextChat} onMemoryOpenConsumed={() => setOpenMemoryOnNextChat(false)} />
      </div>}
    </>
  )
}