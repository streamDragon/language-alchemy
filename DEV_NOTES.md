# Perspective Lab - Dev Notes

## Discovery Summary
- Framework/router: Vite + React 19 with `react-router-dom` (`src/app/AppRouter.jsx`).
- App shell/layout: `AppShell` + `TopNav` with RTL root (`dir="rtl"`), shared cards/buttons/chips from `src/styles/app.css`.
- Navigation source: top nav and dashboard are driven by `dashboardCards` from `src/data/labsConfig.js`.
- Existing lab pattern reused: matched Relations lab route style (screen boundary route entry) and reused existing card/pill/chip/button classes instead of introducing a new UI system.
- Persistence pattern reused: local `localStorage` safe load/save helpers pattern (same approach as `src/utils/storage.js` and `src/data/relationsLabData.js`).

## New Feature Hook Points
- Route added:
  - `/lab/perspectives`
  - alias: `/lab/now-before`
  - in `src/app/AppRouter.jsx`
- Navigation/dashboard entry added via `visibleLabs.push(...)` in `src/data/labsConfig.js`.
- New lab page:
  - `src/labs/PerspectiveLabPage.jsx`
  - Implements 3-step wizard: טקסטים -> מפה -> גשר
  - Includes: Before/Now inputs, swap, tags, draggable 2D map, relation selection + auto-suggest, bridge questions/sentence/micro-action, save/new/history/open
- New data/util module:
  - `src/data/perspectiveLabData.js`
  - Defines tags, relation labels, heuristics, default bridge question templates, session model normalization, localStorage load/save/upsert.
- Styling:
  - Added `Perspective Lab` CSS section in `src/styles/app.css`
  - Mobile-first map/node sizing, pointer drag affordance, RTL-friendly labels, focus-visible styles.

## Persistence Details
- Storage key: `la.v1.perspectiveSessions`
- Session shape persisted in localStorage includes:
  - `id`, `createdAt`, `updatedAt`
  - `beforeText`, `nowText`
  - `tagsBefore`, `tagsNow`
  - `axisSet`, `posBefore`, `posNow`
  - `relationLabel`
  - `bridgeQuestions`, `bridgeSentence`, `microAction`
- History is capped to latest 30 sessions, sorted by `updatedAt` descending.

## Run Locally
- `npm run dev`
- `npm run lint`
- `npm run build`
