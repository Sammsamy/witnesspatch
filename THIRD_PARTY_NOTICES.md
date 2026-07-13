# Third-party notices

WitnessPatch depends on the following directly installed open-source packages. Versions are locked by `package-lock.json`; `npm ci` reproduces the complete transitive inventory. This file is copied into the deployed static assets as `THIRD_PARTY_NOTICES.md`.

| Package | Version | License |
| --- | ---: | --- |
| `ajv` | 8.20.0 | `MIT` |
| `ajv-formats` | 2.1.1 | `MIT` |
| `next` | 16.2.10 | `MIT` |
| `react` | 19.2.6 | `MIT` |
| `react-dom` | 19.2.6 | `MIT` |
| `@cloudflare/vite-plugin` | 1.44.0 | `MIT` |
| `@tailwindcss/postcss` | 4.2.1 | `MIT` |
| `@types/node` | 22.19.19 | `MIT` |
| `@types/react` | 19.2.14 | `MIT` |
| `@types/react-dom` | 19.2.3 | `MIT` |
| `@vitejs/plugin-react` | 6.0.2 | `MIT` |
| `@vitejs/plugin-rsc` | 0.5.26 | `MIT` |
| `eslint` | 9.39.4 | `MIT` |
| `eslint-config-next` | 16.2.10 | `MIT` |
| `react-server-dom-webpack` | 19.2.6 | `MIT` |
| `tailwindcss` | 4.2.1 | `MIT` |
| `typescript` | 5.9.3 | `Apache-2.0` |
| `vinext` | 0.0.50 | `MIT` |
| `vite` | 8.1.4 | `MIT` |
| `wrangler` | 4.110.0 | `MIT OR Apache-2.0` |

## Conservative locked-dependency inventory

`npm run licenses:check` reads the complete `package-lock.json` graph, rejects unversioned entries and missing or newly introduced license expressions until they are reviewed, verifies every aggregate table row exactly, and pins the package-path/name/version/license graph with a canonical SHA-256 fingerprint. It is deliberately broader than the JavaScript and assets actually embedded in the static release.

Locked package entries inventoried: 624

Locked dependency inventory SHA-256: `91cb572226c6ac83f70d6aa4a85b36bddac0a5fef4c6dcf52992c55c9e0efe89`

| SPDX expression recorded in lockfile | Entries |
| --- | ---: |
| `MIT` | 497 |
| `Apache-2.0` | 40 |
| `MPL-2.0` | 28 |
| `ISC` | 19 |
| `BSD-2-Clause` | 11 |
| `LGPL-3.0-or-later` | 10 |
| `BSD-3-Clause` | 5 |
| `MIT OR Apache-2.0` | 3 |
| `Apache-2.0 AND LGPL-3.0-or-later` | 3 |
| `0BSD` | 2 |
| `CC0-1.0` | 2 |
| `Apache-2.0 AND LGPL-3.0-or-later AND MIT` | 1 |
| `BlueOak-1.0.0` | 1 |
| `CC-BY-4.0` | 1 |
| `Python-2.0` | 1 |

The non-MIT inventory includes optional, platform-specific, development, and transitive packages. Examples include libvips binaries recorded as `LGPL-3.0-or-later`, `@resvg/resvg-wasm`, `@vercel/og`, `axe-core`, and `lightningcss` recorded as `MPL-2.0`, and `caniuse-lite` recorded as `CC-BY-4.0`. Their presence in the locked graph does not by itself establish that their code is embedded in `dist/client`, and absence from a bundle would not erase upstream obligations when a component is redistributed.

This inventory is a review gate, not a legal conclusion. Before a public repository or packaged-binary release, the team must determine the actually distributed dependency scope, preserve every applicable upstream notice/source obligation, and deliberately choose a WitnessPatch project license. The current private judge-shared path does not authorize public reuse of WitnessPatch itself.

WitnessPatch does not download or redistribute Google Fonts. The interface uses local system font stacks so clean builds are network-independent at the font layer.

## Bundled MIT notices

The deployed application contains or may contain MIT-licensed code from Ajv (copyright Evgeny Poberezkin), Next.js and its ESLint configuration (copyright Vercel, Inc.), React, React DOM, and React Server Components (copyright Meta Platforms, Inc. and affiliates), Tailwind CSS (copyright Tailwind Labs, Inc.), Vite and its plugins (copyright their respective Vite, VoidZero, and plugin contributors), ESLint (copyright OpenJS Foundation and other contributors), Vinext and Cloudflare build tooling (copyright Cloudflare, Inc.), and their MIT-licensed contributors and dependencies.

MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

TypeScript is used only as build tooling and is licensed under Apache-2.0. Wrangler is dual-licensed under MIT or Apache-2.0; this distribution relies on its MIT option. Exact package-specific source notices remain reproducible from the locked packages and must be preserved if the release packaging changes.

This notice does not replace or modify any upstream license. WitnessPatch itself remains unlicensed and all rights reserved for the current private judging-repository path. A public release requires a deliberate project-license decision and a distribution-scoped notice audit first.
