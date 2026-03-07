# Language Alchemy

Language Alchemy is a Hebrew-first practice product for real conversations.
It helps someone choose one useful next move in a few minutes:

- rewrite one sentence so it lands better
- find one better question
- understand what is stuck in a relationship
- regulate state before speaking
- lead a conversation with more clarity and less force

## Intended Users

- people who want to speak more clearly and calmly
- therapists, coaches, and helpers
- practitioners who already work with language and want more precision
- people preparing for difficult, sensitive, or high-stakes conversations

## Lab Families

- `מיומנות`
  Short labs that produce one usable line or one usable move.

- `אבחון ופירוק`
  Labs that help understand what is happening before deciding what to say next.

- `השפעה וסטייט`
  Labs for regulation, framing, pacing, and language that changes the feel of a conversation.

## Main Flows

### First Visit

1. Choose who you are today.
2. Choose what you need now.
3. Open the recommended lab.
4. Leave with something usable in a few minutes.

### Returning User

1. Continue the last lab from home.
2. Adjust persona or goal if the conversation changed.
3. Browse lab families only after the first decision.

### Relations Lab

1. Pick a context, archetype, and current emotion.
2. Start a short drill with one guided recommended question.
3. Ask one question at a time and see what changed in the loop.
4. End with a concrete takeaway and an exportable session summary.

### Library

- revisit saved sentences
- reopen recent sessions
- return to a lab with context

## Local Development

Install dependencies:

```bash
npm install
```

Run the app locally:

```bash
npm run dev
```

Useful scripts:

```bash
npm run lint
npm run build
npm run preview
```

## Key Files

- `src/labs/DashboardPage.jsx`
  Dashboard orchestration and first-visit / returning-user mode logic.

- `src/components/dashboard/`
  Welcome sheet, gateway, recommendation panel, returning rail, and family browser.

- `src/data/labManifest.js`
  Lab, family, persona, goal, and recommendation metadata.

- `src/data/relationsLabData.js`
  Relations scenarios, question families, simulation, and guided-question recommendation logic.

- `src/labs/LibraryPage.jsx`
  Saved items and recent history browsing.
