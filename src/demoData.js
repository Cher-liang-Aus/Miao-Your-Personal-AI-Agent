export const DEMO_GOAL = {
  id: 'miao-case-study',
  title: 'Make Miao feel like a genuinely personal agent',
  description: 'A sample focus that shows how Miao can keep a project moving between conversations.',
  progress: 68,
  lastSession: 'You refined onboarding, the moving highlight, and the chat surface.',
  lastDecision: 'Keep the interface calm; make personal context visible only when it helps.',
  nextStep: 'Connect memory to a clear, user-approved next action.',
  source: 'Sample focus · Portfolio project',
}

export function createActionPlan(request, goal) {
  const intent = request?.trim() || goal?.nextStep || 'Move the current goal forward'
  return {
    id: `plan-${Date.now()}`,
    request: intent,
    goalTitle: goal?.title || 'Current focus',
    steps: [
      {
        id: 'define',
        title: 'Agree on the outcome',
        detail: 'Turn the request into one clear result before work begins.',
        done: false,
      },
      {
        id: 'prepare',
        title: 'Prepare a focused first pass',
        detail: 'Use the active goal and the context you have chosen to shape a useful draft.',
        done: false,
      },
      {
        id: 'review',
        title: 'Review together',
        detail: 'You decide what to keep, revise, or turn into the next step.',
        done: false,
      },
    ],
  }
}
