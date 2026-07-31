# Client

Vite + React + TS. Mic capture, WAV conversion, the practice screen. See the root
[README](../README.md) for how to run it.

## Styling: CSS Modules + BEM

Two layers, and the split is deliberate:

- **`src/index.css`** — the only global stylesheet. Design tokens (`--bg`, `--accent`, …) and
  bare-element base styles (`body`, `h1`, the shared `button` shape). No component styles.
- **`src/*.module.css`** — one module per component. Vite scopes the class names at build time,
  so `.feedback` in one module can never collide with `.feedback` in another.

Inside a module, class names follow BEM — `block`, `block__element`,
`block__element--modifier`, kebab-case within each part. One block per component, named after
it: `practice` in `App.module.css`, `feedback` in `FeedbackPanel.module.css`. Stylelint enforces
the pattern, so a stray `.notBEM_Class` fails `npm run lint:css`.

Two conventions worth knowing:

- **A modifier never stands alone.** `practice__action--record` carries only what differs (the
  fill); the shared declarations sit on `practice__action`, and the element applies both classes.
- **No bare element selectors in a module.** Style a class, not `.fix-its h2` — a descendant
  element selector couples the stylesheet to the markup structure. Element selectors belong to
  `index.css`, which is where the base layer lives.

Modifier and multi-word names need bracket access, because `-` isn't valid in a JS identifier:

```tsx
import styles from './App.module.css';

<nav className={styles.practice__nav}>
  <button className={styles['practice__nav-button']}>…</button>
</nav>;
```

One gap to be aware of: `styles` is typed as `Record<string, string>` by `vite/client`, so a
misspelled `styles.pratice__nav` type-checks and silently renders `class="undefined"`. Nothing in
the toolchain catches that today — see the note in the PR that introduced this layout if you want
typed CSS modules.

## Checks

```sh
npm run check          # format:check + lint + lint:css + typecheck, in that order
npm run format         # prettier --write .
npm run format:check
npm run lint           # oxlint
npm run lint:css       # stylelint, including the BEM class pattern
npm run typecheck      # tsc -b (strict)
npm run build          # typecheck + production build
```

`npm run lint` fails on errors and reports warnings without failing — the severities in
`.oxlintrc.json` are chosen, not accidental. Pass `--deny-warnings` if you'd rather warnings
block too.
