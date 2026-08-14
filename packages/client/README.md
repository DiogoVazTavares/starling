# Client

Vite + React + TS. Mic capture, WAV conversion, the practice screen. See the root
[README](../../README.md) for how to run it.

## Styling: CSS Modules + BEM

Two layers, and the split is deliberate:

- **`src/index.css`** — the only global stylesheet. Design tokens (`--bg`, `--accent`, …) and
  bare-element base styles (`body`, `h1`, the shared `button` shape). No component styles.
- **`src/*.module.css`** — one module per component. Vite scopes the class names at build time,
  so `.feedback` in one module can never collide with `.feedback` in another.

Inside a module, class names follow BEM — `block`, `block__element`,
`block__element--modifier`, kebab-case within each part. One block per component, named after
it: `practice` in `App.module.css`, `feedback` in `FeedbackPanel.module.css`.

This is a convention we keep by hand, not a linted rule. Nothing fails if you write
`.notBEM_Class` — enforcing it needed Stylelint, and Stylelint alone doubled the dependency
tree, which isn't a trade worth making on a project this size.

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
the toolchain catches that — Biome's `noUnusedClasses` / `noUndeclaredClasses` are the rules that
would, and both are nursery-grade and don't work here (they flagged all 29 classes as unused while
missing a real typo). Generating `.d.ts` files per module is the option if it ever bites.

## Checks

[Biome](https://biomejs.dev) is the whole toolchain — formatter and linter, for TS, TSX, CSS and
JSON, in one dependency. Config is `biome.json`.

```sh
npm run check          # biome (format + lint) then tsc — the one to run before committing
npm run fix            # biome check --write: formats and applies safe lint fixes
npm run format         # formatting only
npm run lint           # linting only
npm run typecheck      # tsc -b (strict)
npm run build          # typecheck + production build
```

Two things Biome does not cover:

- **Markdown.** It has no Markdown formatter, so these README files are hand-formatted. Prettier
  used to do it, and reflowed the root README's layout table on its first run.
- **`public/`.** Excluded in `biome.json` — the favicon trips `noSvgWithoutTitle`, which is aimed
  at inline SVG in markup, not static assets.
