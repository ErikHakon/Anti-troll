# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Untroll — a Spanish-language League of Legends coaching SPA that uses Claude AI to analyze full team compositions and generate contextual game plans (builds, runes, strategy). Deployed on Vercel.

## Commands

```bash
npm run dev      # Local dev server (Vite)
npm run build    # Production build
npm run preview  # Preview production build locally
```

No test framework is configured. No linter is configured.

## Architecture

The app is a monolithic React 18 + Vite project with two main files:

- **`src/App.jsx`** (~1,200 lines) — The entire frontend: all components, state, styling (inline CSS), data fetching, caching, and prompt construction. Contains ~15 sub-components defined inline (ResultSection, ItemBadge, RuneBadge, PhaseBlock, PowerSpikesTimeline, ThreatPriority, CombosCard, WardSpotsCard, etc.) and the main `CoachTool` function component.
- **`api/coach.js`** — Vercel serverless function that proxies requests to the Anthropic Claude API (claude-haiku-4-5 model, 4096 max tokens, 55s timeout). Requires `ANTHROPIC_API_KEY` env var.

### Data Flow

1. User selects champions (own champ/lane, 4 allies, lane opponent + 4 enemies) via custom picker UI
2. A detailed Spanish-language prompt is constructed with team compositions and build type constraint (AD/AP/hybrid/auto)
3. `localStorage` cache is checked first (24-hour TTL, keyed by composition hash)
4. If not cached, prompt is POSTed to `/api/coach` → Claude API
5. JSON response is parsed and rendered through specialized display components
6. Result is cached to localStorage

### External Data Sources

- **DDragon API** (Riot's CDN): item data (en_US + es_ES), rune data with icons, champion portraits
- **Fuzzy matching**: `normalize()` strips accents/special chars to match Spanish item/rune names from Claude's response to DDragon IDs

## Deployment

Vercel with `vercel.json` configuring:
- API route rewrite (`/api/coach` → serverless function)
- 60-second `maxDuration` for the function
- SPA fallback routing

## Key Conventions

- All UI text is in **Spanish**
- All styling is **inline CSS** (no CSS framework or stylesheets)
- The AI prompt requests a **strict JSON schema** response — changes to the result display components must stay in sync with the prompt's expected output format
- Champion names use Riot's internal format for icon URLs (e.g., `MonkeyKing` for Wukong)
