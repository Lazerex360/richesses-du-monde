# Resources Panel i18n Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ensure the redesigned resources panel (search, expand/collapse, count badge) is fully translated across all 9 supported languages with integrity-test parity.

**Architecture:** All user-facing strings live in `window.TR` (`i18n.js` for fr/en/es, `i18n-XX.js` for de/it/pt/ko/zh/ja). HTML uses `data-i18n` / `data-i18n-ph`; JS uses `t('key')` for dynamic strings. `test/check_integrity.js` enforces key parity across languages.

**Tech Stack:** Vanilla JS i18n, no build step.

---

### Task 1: Define canonical French keys (source of truth)

**Files:**
- Modify: `public/js/i18n.js` (fr block)

- [x] Add `resources.search_ph`, `resources.meta_count`, `resources.meta_filtered`, `resources.expand_all`, `resources.collapse_all`, `resources.no_results`
- [x] Extend tutorial to 6 steps with board + resources panel steps
- [x] Add auth landing feature keys (`auth.feat_*`)

### Task 2: Mirror keys in en and es

**Files:**
- Modify: `public/js/i18n.js` (en, es blocks)

- [x] Copy all new keys with English and Spanish translations

### Task 3: Locale overlay files (de, it, pt, ko, zh, ja)

**Files:**
- Modify: `public/js/i18n-de.js`, `i18n-it.js`, `i18n-pt.js`, `i18n-ko.js`, `i18n-zh.js`, `i18n-ja.js`
- Script: `scripts/patch-i18n-locales.js`

- [x] Run patch script to upsert keys without breaking IIFE structure

### Task 4: Wire UI to i18n

**Files:**
- Modify: `public/index.html` (resources toolbar `data-i18n-ph`)
- Modify: `public/js/client.js` (`updateResourcesCount`, `filterResourceAccordions`, tutorial progress)

- [x] Count badge uses `t('resources.meta_count')` / `t('resources.meta_filtered')`
- [x] Empty state uses `t('resources.no_results')`
- [x] Tutorial uses `t('tutorial.progress', { n, total })`

### Task 5: Verification

**Files:**
- Test: `test/check_integrity.js`

- [x] Run `node test/check_integrity.js` — 0 errors, 366 keys × 9 langs
- [x] Run `node test/board_layout.js`

### Task 6: Manual QA checklist

- [ ] Switch language in Settings → open resources panel → search placeholder translated
- [ ] Expand all / Collapse all labels update on language change
- [ ] Tutorial step 4 mentions resources panel in each language
- [ ] Filter count badge shows `{visible} / {total}` when searching
