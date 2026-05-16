# Project TODO

## Database & Data Import
- [x] Design words table schema (korean, romanization, pos, meaning, koreanExample, exampleEnglish, topikLevel)
- [x] Design user_progress table schema (userId, wordId, status: new/reviewing/learned, xp, streak)
- [x] Import all 56,556 KRDICT entries into MySQL database
- [x] Add fulltext indexes for server-side search

## Server API (tRPC Routers)
- [x] Words router: paginated list with filters (pos, topikLevel)
- [x] Words router: server-side search by korean, romanization, or english meaning
- [x] Words router: single word detail endpoint
- [x] Progress router: get/update word status (new, reviewing, learned)
- [x] Progress router: dashboard stats (XP, streak, level, mastery breakdown)
- [x] Progress router: swipe session endpoint (batch update statuses)
- [x] LLM router: generate grammar tips, extra examples, usage notes for a word

## Frontend - Game Dashboard
- [x] Game-style home dashboard with XP, streak counter, level badge
- [x] Animated progress bars by TOPIK level and POS category
- [x] Quick-start buttons for swipe sessions with filter presets

## Frontend - Swipe Flashcard Game
- [x] Swipe-based card UI with touch and mouse gesture support
- [x] Swipe right = learned, swipe left = review later
- [x] Bold visual feedback on swipe direction (color, icon)
- [x] Card flip animation on tap (front: korean, back: meaning/romanization/example)
- [x] Session summary screen after completing a deck

## Frontend - Word List & Search
- [x] Paginated word list view (20-50 words per page, mobile-optimized)
- [x] Search bar with instant server-side search
- [x] Filter controls for POS and TOPIK level

## Frontend - Word Detail Sheet
- [x] Full word detail view (korean, romanization, pos, meaning, examples)
- [x] Inline LLM-generated grammar tips, extra examples, usage notes
- [x] Accessible from both word list and flashcard views

## Styling & UX
- [x] Game-style visual theme (bold, energetic, mobile-first)
- [x] Dark theme with vibrant accent colors
- [x] Smooth animations and micro-interactions throughout
- [x] Responsive design optimized for mobile

## Testing
- [x] Vitest tests for word search/filter endpoints
- [x] Vitest tests for progress tracking endpoints
- [x] Vitest tests for progress.swipe and progress.batchSwipe mutations
- [x] Vitest tests for progress.getByLevel and progress.getByPos

## Bug Fixes
- [x] Fix TOPIK level distribution: intermediate has only 1 entry, should have thousands (fixed: 2,545 beginner / 15,001 intermediate / 39,010 advanced)

## User Requested Changes
- [x] Selectable card count per session: 10, 20, 50, 100 options
- [x] One-sided cards: show all info (korean, romanization, meaning, POS, example) on a single face
- [x] AI-generated English translation of Korean example sentences displayed on each card by default
- [x] Add error/retry UI for per-card example translation when LLM fails
- [x] Add vitest coverage for LLM translation endpoint and deck-size up to 100
