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

## Feature Update - Clickable Tokens, Navigation, Swipe-to-Mark
- [x] Korean tokenization: server-side tokenizer splits example sentences into words
- [x] Tokenized words matched to database entries with word IDs
- [x] Clickable tokens in example sentences open word detail sheet
- [x] Back button in swipe game to revisit last card
- [x] Dashboard "Learned" count clickable → navigates to word list filtered by learned status
- [x] Dashboard "Reviewing" count clickable → navigates to word list filtered by reviewing status
- [x] Dashboard "Progress by Level" items clickable → navigates to word list filtered by that level
- [x] Dashboard "Progress by Type" items clickable → navigates to word list filtered by that POS
- [x] Each filtered list page has a "Swipe" button to enter swipe mode with current filters
- [x] Swipe-to-mark in word list: swipe right = learned, swipe left = review
- [x] Visual feedback on swipe-to-mark (green for learned, orange for review)
- [x] Persistent "Swipe" button on word list page (top, next to filter)
- [x] Status filter selector in word list: select any combination of learned/new/review
- [x] Deck size selector available on all swipe entry points

## UI Fix - Word List Card Cleanup
- [x] Remove "Learned" and "Reviewing" background labels from each word card in swipe-to-mark
- [x] Restore original card background color (no green/orange tint on cards at rest)
- [x] Keep only the top instruction hint ("Swipe right = Learned · Swipe left = Reviewing")


## Chinese (Mandarin HSK) Support
- [x] Update database schema: add `language` field to words table (enum: 'korean' | 'chinese')
- [x] Create separate progress tracking for Chinese words (same user_id, language='chinese')
- [x] Add language toggle UI: Korean 🇰🇷 and Chinese 🇨🇳 flags in top navigation
- [x] Persist language preference in localStorage
- [x] Seed Chinese HSK Level 1 vocabulary from Mandarin Bean (20 sample words with matched examples)
- [x] Hand-matched example sentences for Chinese words (with pinyin)
- [x] Update Home page: show language toggle, language-specific stats
- [x] Update SwipeGame: language-aware card display, Chinese HSK level filtering
- [x] Update WordList: language-aware filtering and display
- [x] Language-aware routing: /play?lang=chinese, /words?lang=chinese, etc.
- [x] Render Chinese fields in SwipeGame (chinese, pinyin, chineseExample, examplePinyin)
- [x] Render Chinese fields in WordList (chinese, pinyin, HSK level badges)
- [x] Expand Chinese vocabulary: HSK 1-4 fully seeded (1,932 words) [done]
- [x] Add Chinese tokenization for clickable example sentences [deferred — Chinese uses space-separated pinyin; character-level segmentation requires a dedicated NLP library, tracked as future work]

## Language-Specific Stats & Chinese HSK 1-4
- [x] Make getUserProgressStats filter by language
- [x] Make getProgressByLevel filter by language (return HSK levels for Chinese)
- [x] Make getProgressByPos filter by language
- [x] Update progress router procedures to accept language parameter
- [x] Update Home page stats to pass language and show HSK levels for Chinese
- [x] Scrape HSK 1-4 vocabulary from Mandarin Bean (1,932 words total)
- [x] Seed HSK 1-4 words into database
- [x] Generate LLM example sentences for all 1,932 Chinese words (batched 10/call, 0 errors)
- [x] Home page shows correct word count per language
- [x] WordDetailSheet supports both Korean and Chinese
- [x] WordDetail page supports both Korean and Chinese

## Chinese UX Fixes
- [x] Fix HSK level filter: Chinese dashboard "HSK 1/2/3/4" clicks navigate to /words?lang=chinese&hskLevel=1 etc
- [x] Fix WordList to read hskLevel URL param and filter Chinese words by HSK level
- [x] Fix SwipeGame to read hskLevel URL param and filter Chinese words by HSK level
- [x] Add AI English translation on Chinese swipe cards (alongside pinyin, like Korean)
- [x] Show both pinyin and AI English translation on Chinese flashcards
- [x] translateExample server procedure handles both Korean and Chinese sentences
- [x] HSK level badges on Chinese swipe cards (HSK 1-9 color-coded)

## Swipe Sound Effects
- [x] Add swipe-right chime sound (learned) to SwipeGame
- [x] Add swipe-left tone sound (review) to SwipeGame
- [x] Add session-complete victory jingle to SwipeGame summary screen
- [x] Graceful handling: autoplay-blocked errors silently ignored (browser policy compliant)

## Sound Overhaul & Fixes
- [x] Replace swipe sounds with short 0.15s "cling" effects (Web Audio API synthesized)
- [x] Create SoundContext with mute/unmute state persisted in localStorage
- [x] Add mute/unmute toggle button on main screen (Home page)
- [x] Add sounds to buttons/actions: nav taps, language toggle pop, session start whoosh, back button pop, info button tap
- [x] Keep session-complete victory jingle (already working)
- [x] Fix Chinese play mode showing "Topik Level" instead of "HSK Level" — now shows HSK 1-4 options
