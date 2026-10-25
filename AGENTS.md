# AGENTS.md

## Project

PerfumShops — single-package React 19 + Vite 8 SPA (perfume e-commerce mock). Plain JS/JSX, no TypeScript, **no tests**, no backend. All UI copy and validation messages are **Spanish**.

## Commands

```bash
npm run dev      # vite dev server
npm run lint     # eslint .  (only verification step that catches issues)
npm run build    # vite build → dist/ (also a good smoke check)
```

Order: `lint` → `build`. There is no typecheck or test command — do not invent one.

The repo path contains spaces and an accented character (`pagina_perfumshops`); always quote paths in shell commands.

## Structure

- `src/main.jsx` → `BrowserRouter` → `src/App.jsx` (all routes live there).
- `src/pages/*` — one file per route; `src/components/*` — `Header`, `CartMenu`.
- `src/index.css` — **the only stylesheet in use** (CSS variables `--navy`, `--gold`, `--serif`, `--sans` + all component classes). `src/App.css` is unused Vite-template leftover; ignore it. Add new styles to `index.css`, matching its compact one-line-per-rule style.
- `src/assets/VARIABLES.js` — mock data (`user`, `CARRITO_INICIAL`, `WHATSAPP`). Not environment config.
- `public/img/*` — referenced with absolute paths (`/img/logo-blanco.png`).

## Routing / auth

`App.jsx` guards routes with a local `Protegida` component reading `localStorage.getItem("user")` (`{ role: "admin" }`). `/dashboard` requires `role === "admin"`. This is a placeholder until JWT arrives — do not build a real auth layer on it.

There is no API layer yet. `Login.jsx` and `Register.jsx` contain commented-out `fetch("/api/...")` TODO blocks; new endpoints should follow that same commented pattern and `console.log` the payload for now.

## Form pages convention (Login / Register)

Both share the same markup contract with `index.css` — breaking it silently breaks the layout:

- Floating labels depend on `placeholder=" "` on every input and on the `input + label` sibling adjacency (`.form-input:not(:placeholder-shown) + label`). Never reorder or wrap the label.
- `.form-error` must sit **outside** `.form-group`. Inside it, `.pass-toggle` (`top: 50%`) misaligns with the taller group.
- Keep one independent `showPass` state per password field.
- Validation uses **zod v4** (`safeParse`, map `issue.path[0]` → field errors). Forms use `noValidate`; zod replaces native validation. Password rule: `^(?=.*[A-Z])(?=.*\d).{8,}$`.

## Lint rules that bite

`eslint.config.js` enables `react-hooks` recommended and `react-refresh` `vite` config:

- Components must be the only exports from `.jsx` files (react-refresh forbids co-exported helpers/schemas). Keep schemas and SVG helper components module-local, unexported.
- No `console.log` outside the existing dev-only `handleSubmit` blocks (eslint recommended flags unused vars; logs are tolerated in form handlers but keep them minimal).
