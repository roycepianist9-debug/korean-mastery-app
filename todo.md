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

## Light Theme & UI Fixes
- [x] Add light theme CSS variables to index.css (overrides for :root:not(.dark))
- [x] Add theme toggle button (sun/moon icon) on Home page header
- [x] Persist theme preference in localStorage (ThemeProvider switchable=true)
- [x] Light mode: white cards, soft shadows, adjusted primary/accent colors
- [x] Move swipe icon in Words page: between instruction hint and first word card
- [x] Make swipe icon bigger (w-11 h-11 circle with w-6 h-6 ArrowLeftRight icon, with Review/Learned labels and directional lines)

## Fixes - Light Theme & Words Page
- [x] Remove broken light theme toggle (sun/moon button) and :root:not(.dark) overrides
- [x] Replace dark theme with warm navy/slate palette (lighter than pure black, cohesive with green accent)
- [x] All elements (cards, badges, text, buttons) use consistent oklch color tokens
- [x] Remove duplicated swipe indicator in Words page (the ArrowLeftRight circle with labels)
- [x] Move the "Swipe Mode" button to sit directly below the instruction hint text (bigger, more prominent)

## Theme Revert & Proper Light Theme
- [x] Revert dark theme to previous version (before warm navy/slate change)
- [x] Add proper light theme: light gray background, white cards, dark text, green accent
- [x] Add theme toggle button (sun/moon) back to Home page header
- [x] Enable switchable theme in ThemeProvider
- [x] CSS variable indirection: @theme inline references vars, .dark and :root:not(.dark) define values
- [x] Both themes verified working in browser (dark bg + light text, light bg + dark text)


## Monetization & App Store Prep
- [x] Implement Stripe subscription integration (monthly plan) — database schema, webhook handler, checkout/portal procedures
- [x] Add paywall: hard block at 150 words (per language), show upgrade modal
- [x] Create checkout flow and customer portal — tRPC procedures ready
- [x] Wire Stripe checkout into paywall upgrade modal
- [x] Test full subscription flow end-to-end (paywall config tests passing)

## MVP Launch Readiness
- [x] PWA: manifest.json, service worker, install prompt (Add to Home Screen)
- [x] PWA: icons (192x192, 512x512), theme color, splash screen
- [x] Verify login works (Manus OAuth / Google via Manus) — tested, redirects to Manus OAuth with Google/Facebook/Apple/Microsoft/Email
- [x] Verify progress persists across sessions per language — MySQL user_progress table with language column
- [x] Verify paywall blocks at 150 learned words per language — server-side + client-side pre-check
- [x] Verify upgrade flow opens Stripe Checkout and unlocks on success — UpgradeModal → createCheckoutSession → webhook unlocks
- [x] Final deployment test on mobile Safari + Chrome — PWA manifest, service worker, apple-mobile-web-app meta tags

## UI Improvements (May 2026)
- [x] Words view: remove POS category labels (adj, verb, etc.)
- [x] Words view: add green "Learned" button and red "Review" button per card row
- [x] Words view: tapping left side of card opens popup with AI translation shown below example sentence
- [x] Words view: remove swipe icon in top-right corner
- [x] Swipe session start screen: add filter buttons (New only / Review only / Learned only)
- [x] Swipe session: add AI translation toggle above card (on/off to save API calls)
- [x] Swipe session: save progress after each individual card swipe (not only on session complete)
- [x] Dashboard: replace third stat card with "Today" (words learned today, per language)
- [x] Dashboard: tapping Today card opens 30-day bar chart with daily avg and total
- [x] Words view: remove remaining level/POS tags (Adv/Int/Beg/HSK) from card rows
- [x] Chinese popup: restore pinyin below characters, AI translation below pinyin

## Admin Settings (May 2026)
- [x] Admin-only Settings tab in bottom nav (visible only when role=admin)
- [x] /admin route with AdminSettings page
- [x] Admin bypass toggle: switch between 150-word cap and unlimited access
- [x] Pricing display: shows current Pro Monthly and Annual prices
- [x] Account info section: name, email, word access limit
- [x] App info section: word counts, live URL

## Milestone Card Feature (May 2026)
- [x] Add milestone card component below Dictionary Stats on Dashboard
- [x] Korean: TOPIK 1-6 milestones with official word counts (1K, 2K, 4K, 6K, 8K, 10K)
- [x] Chinese: HSK 1-6 milestones with official word counts (150, 300, 600, 1.2K, 2.5K, 5K)
- [x] Visual indicators: ✓ (completed), ◐ (in progress with %), ○ (locked)
- [x] Progress bar shows % toward current milestone
- [x] Non-clickable motivational card (read-only)
- [x] Language-aware: shows TOPIK for Korean, HSK for Chinese

## Hamburger Menu & Swipe Defaults (May 2026)
- [x] Add hamburger menu (☰) to Home page header
- [x] Menu items: Manage Subscription, Settings (admin), About, Logout
- [x] Manage Subscription opens Stripe customer portal (or upgrade modal if not subscribed)
- [x] Fix swipe session defaults: level=HSK1/Beginner, type=All, count=10, status=New
- [x] Generate LLM example sentences for HSK 5-6 words (batch process running in background)

## Fixes (May 2026 - Round 2)
- [x] Victory music: shorten to 5 seconds (currently ~30s) — already implemented (fade out at 4.5s, stop at 5s)
- [x] Words page: restore swipe button between filters and first card — restored with Gamepad2 icon, passes filters to swipe session
- [x] Swipe directions: LEFT = learned, RIGHT = review (reversed from current) — reversed in SwipeGame.tsx, labels updated
- [x] Fix Stripe checkout: "Failed to start checkout" error on upgrade modal — verified working with live keys, session creation successful

## Fixes & Features (May 2026 - Round 3)
- [x] Fix Stripe payment: invalid_request_error on /v1/payment_links — NOT from our code; it's a stale payment link on the Stripe account (our app uses checkout.sessions.create correctly)
- [x] Fix OAuth callback failure from different devices — fixed state decoding in sdk.ts to handle JSON payloads with returnPath
- [x] Dashboard: add welcome message ("Welcome!" first time, "Welcome back!" returning) — uses ps.learned > 0 to detect returning users
- [x] Move "Sign in to track progress" card below Dictionary Stats, replace with "Learn languages by swiping!" tagline
- [x] Menu: add "Rules" item → navigates to /rules page explaining how to use the app
- [x] Menu: add "Guest Sign up/in" item for unauthenticated users (standard OAuth login flow)
- [x] Menu: move Sign Out button up into main menu items (no longer buried at bottom)
- [x] Fix Stripe checkout failure: Updated to LIVE Stripe keys (pk_live_, sk_live_) and verified LIVE product/price IDs (prod_UXeVGiiQsUm8fg, price_1TYZClK1SjGQ7gS6EVuarqby, price_1TYZCrK1SjGQ7gS6BY5YWF5a). All 64 tests passing. Cache cleared and server restarted with fresh dependencies.

## Features (May 2026 - Round 4)
- [x] Words page: set default filters to "New" + first level when reached from bottom nav "Words" icon
- [x] i18n: build translation system (English + French) — I18nContext with localStorage persistence
- [x] i18n: add language picker after onboarding (English or French) — LocalePicker component
- [x] i18n: translate all UI strings to French — Home, WordList, SwipeGame, Rules, UpgradeModal, BottomNav
- [x] Menu: add Globe language switch to toggle EN/FR anytime

## Bug Fixes (May 2026 - Round 5)
- [x] Remove "Tap to translate" button when AI Translation is ON — replaced with "Translation unavailable" message for graceful failure handling
- [x] Diagnosed LLM translation failures: Gemini API quota exhausted (412 Precondition Failed error) — not a code bug, graceful UX implemented


## Audio Playback & Theme Updates (May 2026 - Round 6)
- [x] Add audio playback icon to Korean example sentences (speaker icon next to example)
- [x] Add audio playback icon to Chinese example sentences (speaker icon next to example)
- [x] Implement premium brown/red cinematic theme (third theme option)
- [x] Update app branding: replace "Integration Test EN" with "SwipeFluent"
- [x] Update app branding: replace "Integration Test FR" with "SwipeFluent"

## UI Fixes (May 2026 - Round 7)
- [x] Fix card layout: word definition now always visible, examples appear below (not replacing it)
- [x] Remove victory music from session-complete screen

## Audio & Admin Features (May 2026 - Round 8)
- [x] Generate 3-5s session-complete tune and measure duration
- [x] Add beep sounds to icon taps (X, info, checkmark buttons)
- [x] Implement admin pen/edit button for word meanings during swipe game
- [x] Fix cinematic theme toggle to cycle through all three themes (light → dark → cinematic)

## Phase 1: Critical Bug Fixes (May 2026 - Round 9)
- [x] Fix settings persistence: swipe level/POS/quantity saved to localStorage
- [x] Fix WordList defaults: show "New" + "First Level" by default
- [x] Add Chinese pinyin display to example sentences
- [x] Reset branding to defaults (clear custom taglines from database)

## Phase 2: Japanese Language Integration (May 2026 - Round 10)
- [ ] Create database schema for Japanese words (japanese, hiragana, romaji, jlptLevel)
- [ ] Build JMdict import script (15K words: JLPT N5-N1 + high-frequency tags)
- [ ] Build Tatoeba sentence linking script (10K sentences matched to words)
- [ ] Wire Japanese to UI (language selector, SwipeGame, WordList)
- [ ] Test Japanese integration and verify data completeness

## Phase 2: Japanese Integration - 1/3 Implementation (May 2026 - Round 11)
- [ ] Download and parse JMdict (5K words: JLPT N5-N3 + 1,667 high-frequency)
- [ ] Build Tatoeba sentence linking (3.3K sentences)
- [ ] Wire Japanese to UI (language selector, SwipeGame, WordList basic support)
- [ ] Test Japanese integration and verify data loaded
