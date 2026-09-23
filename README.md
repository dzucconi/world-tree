# World Tree

[![Netlify Status](https://api.netlify.com/api/v1/badges/bc2de6b8-de6e-4d39-bd02-988de5e0cc4a/deploy-status)](https://app.netlify.com/projects/damonzucconi-world-tree/deploys)

A variation on [The World on a Cross](https://github.com/dzucconi/the-world-on-a-cross). Take a six-sided die and roll it six times. Use each of those results as the number on the faces of a new die. Repeat this process with the newly constructed die. Continue until you construct a die where all sides are the same number.

Here each die is unfolded into a cross, and every face is drawn back to the face it was rolled from. Lineages that stop producing descendants fade out. Because the first die has six different numbers, a uniform die is less a coincidence of six matching rolls than an inheritance: all six faces descend from a single face of the first die. The rest of the tree is a record of what didn't survive.

A grid of these worlds runs at once, 12 generations per second, each converging on its own schedule. With sound on, every world is a voice built from six partials, one per number, each as loud as the share of faces showing it. As a world converges, its voice thins to a single pitch. (2026)

- **State**: production
- **Production**:
  - **URL**: https://world-tree.work.damonzucconi.com/
  - **URL**: https://damonzucconi-world-tree.netlify.app/
- **Host**: https://app.netlify.com/sites/damonzucconi-world-tree/overview
- **Deploys**: Pushes to `dzucconi/world-tree#main` are automatically deployed to production.

## Development

Requires Node.js 20.19 or later, or Node.js 22.12 or later.

```sh
npm install
npm run dev
```

Type-check and build with:

```sh
npm run build
```

The application has no runtime dependencies. Vite emits the production site to `dist/`.

## Parameters

| Parameter | Description                                                       | Default |
| --------- | ----------------------------------------------------------------- | ------- |
| `columns` | Worlds across, from 1–8, or `random` for 1–6                      | `4`     |
| `rows`    | Worlds down, from 1–8, or `random` for 1–4                        | `2`     |
| `random`  | Randomize whichever of `columns` and `rows` isn't otherwise given | —       |

Examples:

```text
?columns=6&rows=3
?columns=1&rows=1
?columns=random&rows=2
?random
```

Without `columns` or `rows`, the grid swaps its columns and rows on a portrait screen; a grid given in the query string is used as is. Each world adds a generation on a shared 12 fps clock, holds on its uniform die for two seconds, and starts over, so the worlds drift out of phase almost immediately. Browsers require a gesture before audio can start, so the speaker in the top right corner unmutes; it fades once the sound is on and returns on hover. The pointer hides after inactivity, and double-clicking toggles fullscreen. Timing, layout, color, and sound are tunable in `src/config.ts`.
