# Language Alchemy

Language Alchemy is an interactive language-training product for phrasing, inquiry, regulation, influence, and interpersonal clarity.

The current product focus is not feature breadth. It is guided entry and progressive disclosure:

- The home screen starts with a `persona + goal` gateway.
- Labs are grouped into clear families instead of one flat library.
- `Relations Lab` runs as a 3-stage session: `Setup -> Drill -> Review`.
- Secondary information stays available, but out of the primary flow.

## Product Structure

### Home flow

The dashboard is designed to answer a first-time user quickly:

- Who is this for?
- What should I start with right now?
- What will I get in a few minutes?

The main home experience includes:

- A short persona selector
- A short goal selector
- One primary recommendation
- Two lighter secondary recommendations
- Family browsing after the recommendation
- Quick return areas for recent work and saved items

### Lab families

- `מעבדות מיומנות`
  Focused practice labs for one concrete communication skill.

- `מעבדות אבחון ופירוק`
  Labs for unpacking situations, mapping relations, and choosing precise questions.

- `מעבדות השפעה וסטייט`
  Labs for pacing, somatic attention, framing, and state-sensitive language.

## Main User Flows

### Relations Lab

`Relations Lab` is the clearest example of the new staged UX:

1. `Setup`
   Define the context, the stuck relationship, the current emotion, and a soft session goal.

2. `Drill`
   See the current state, choose one question, and observe what changed.

3. `Review`
   Leave with the best question, the current state, and one takeaway for a real conversation.

Timeline and full saved-question history are still available in Review, but collapsed by default.

### Other labs

The rest of the product still uses the existing routing and state where possible, while gradually aligning to the same product language:

- clear promise
- shorter entry
- less internal naming
- more obvious next step

## Tech Stack

- React 19
- Vite
- React Router
- ESLint

## Local Development

Install dependencies, then run:

```bash
npm install
npm run dev
```

Useful scripts:

```bash
npm run dev
npm run lint
npm run build
npm run preview
```

## Repository Notes

- `src/labs/DashboardPage.jsx`
  Home gateway, recommendations, family browsing, and quick return areas.

- `src/data/labManifest.js`
  Shared lab metadata used for grouping, labeling, and recommendations.

- `src/labs/RelationsLabPage.jsx`
  Orchestrates the Relations session flow.

- `src/components/relations/`
  Setup, Drill, Review, shared relations UI, and pure relations utilities.

- `src/components/layout/TopNav.jsx`
  Reduced global navigation.

## Quality Bar

The working standard for this repo is:

- mobile-first clarity
- one obvious primary action in the active step
- human-facing naming over internal mechanics
- lint-clean repo
- staged UX before feature expansion
