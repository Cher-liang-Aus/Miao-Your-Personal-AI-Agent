# Miao — Personal AI Agent Onboarding & Feedback Loop

A polished, AI-native onboarding and feedback experience for a personal AI agent.
Primary color: **Linear Purple `#5E6AD2`** — the same precise violet used by Linear.app.
Font: **DM Sans** (clean geometric sans-serif, no serifs anywhere).

## Quick Start

```bash
npm install && npm run dev
```

Open http://localhost:5173

## Using the Real Claude API

Create `.env.local` in the project root:

```
VITE_ANTHROPIC_API_KEY=sk-ant-...
```

Without a key, the app uses a rich built-in simulation that demonstrates all features.

## Features

1. **3-step onboarding** — name, communication style, free-text bio with progress indicator
2. **Streaming chat** — token-by-token streaming with animated cursor
3. **Feedback loop** — 👍 👎 and free-text corrections after every message
4. **Agent adaptation** — after ≥2 signals, system prompt updates and responses demonstrably change
5. **Memory panel** — collapsible sidebar showing everything Aria knows in plain language

## Tech

- React 18 + Vite
- CSS Modules (no external UI library)
- Anthropic Messages API with streaming (SSE)
- Zero runtime dependencies beyond React