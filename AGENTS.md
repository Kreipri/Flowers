# Repository Guidelines

## Project Structure & Module Organization

- `index.html` is the runnable application, containing inline styles, React components, SVG artwork, and Canvas rendering. Browser libraries load from CDNs.
- `src/App.jsx` coordinates intro, game, and result views. `src/components/` contains `IntroScreen.jsx`, `CatchingGame.jsx`, and `GameOverModal.jsx`.
- `src/utils/soundEngine.js` synthesizes audio with the Web Audio API; artwork is embedded SVG or Canvas drawing code.
- `server.js` serves static files using Node.js built-ins. `README.md` describes the experience and game rules.

Keep corresponding implementations in `src/` and `index.html` synchronized when changing shared behavior or visuals. The browser entry point does not import the source modules.

## Build, Test, and Development Commands

- `node server.js` — start the local server at `http://127.0.0.1:3456/` (requires Node.js).
- `open http://127.0.0.1:3456/` — open the app on macOS after starting the server.
- `node --check server.js` — check server JavaScript syntax; this does not validate JSX.

There is no package manifest, dependency installation step, build pipeline, or configured lint/test command. Internet access is needed for CDN libraries and fonts.

## Coding Style & Naming Conventions

Use two-space indentation, semicolons, and single quotes in JavaScript; follow nearby JSX formatting. Name components and component files in PascalCase, functions and variables in camelCase, and constants in UPPER_SNAKE_CASE. Use functional React components and hooks. Keep animation state in refs where appropriate, and clean up animation frames, timers, and event listeners. No formatter or linter is configured; avoid unrelated reformatting.

## Testing Guidelines

No automated framework or coverage threshold is configured. Manually verify envelope animation, letter scrolling, Escape and focus handling, reduced motion, keyboard/mouse/touch movement, pause, mute, scoring, three-life defeat, the 500-point final catch, and replay resets. Check desktop and mobile layouts and the browser console.

## Commit & Pull Request Guidelines

Git history was unavailable during inspection, so no existing commit convention could be verified. Use concise, imperative subjects such as `Fix letter focus restoration`. Keep changes focused. Pull requests should describe behavior changes, list manual checks, link relevant issues when available, and include screenshots or recordings for visual changes. Mention updates to both application copies.
