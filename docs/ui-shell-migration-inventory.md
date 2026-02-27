# UI Shell Migration Inventory (language-alchemy)

Last updated: 2026-02-27

## Completed (shell-ready)

- Global overlay infrastructure
  - `OverlayProvider` + portal root + `useOverlay`.
  - Focus trap and focus restore to opener.
  - Body scroll lock with exact scroll position restore.
  - ESC, backdrop close, mobile sheet swipe-down, and browser back-close (`#overlay=...` state).
  - Reusable reveal feedback class: `.opened-content`.
- Screen mode infrastructure
  - Per-screen `ui` mode resolver (`legacy`/`shell`) with URL query override.
  - Shell `ErrorBoundary` fallback with `Open Legacy Mode`.
- `relations` (`/lab/relations`, `/lab/relationship-questions`)
  - One setup wizard flow routed to overlay.
  - Metrics are compact chips; metric details open in overlay.
  - Help moved to overlay.
  - Stats/history remain in bottom collapsed section.
  - Inline legacy modal blocks removed from shell path.

## Remaining inline panels to migrate

- `lab/phrasing`
  - Secondary settings/help/history/debug content still inline.
- `lab/empathy`
  - Secondary settings/help/history/debug content still inline.
- `lab/boundaries`
  - Secondary settings/help/history/debug content still inline.
- `lab/clean-questions` (`lab/questions`)
  - Setup/theory/history sections still inline.
- `lab/beyond-words` (`lab/beyond`)
  - Setup/explanations/history still inline.
- `lab/mind-liberating-language` (`lab/mind-liberating`)
  - Setup/explanations/history still inline.
- `lab/perspectives` (`lab/now-before`) if enabled in current branch
  - Needs shell/legacy split audit and overlay-only secondary surfaces.

## Next migration order

1. `clean-questions`
2. `mind-liberating-language`
3. `beyond-words`
4. `phrasing`/`empathy`/`boundaries`
