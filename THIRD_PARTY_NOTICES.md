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

Locked dependency inventory SHA-256: `cb5192ad33c1eebfee4eef8f3d10de8478bbde5b05d939ad757443becc212a3f`

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

This inventory is a review gate, not a legal conclusion. WitnessPatch source is publicly distributed under the repository's MIT License. The scope below covers that public source route and the hosted static client; before any packaged CLI, server bundle, vendored dependency, `node_modules` distribution, or materially different route, the entrant must re-determine the actually distributed dependency scope and preserve every applicable upstream notice and source obligation.

WitnessPatch does not download or redistribute Google Fonts. The interface uses local system font stacks so clean builds are network-independent at the font layer.

## Build Week distribution scope

The public source repository tracks source, package manifests, and `package-lock.json`; it ignores `node_modules` and generated `dist` output. Publishing that repository therefore does not itself redistribute installed dependency payloads. `npm ci` obtains those packages from their publishers. The analysis changes if the entrant later vendors dependencies, publishes the CLI as a package, commits a generated bundle, or distributes a server image.

The hosted static route distributes the generated `dist/client` files. An audit-only source-map build of the same client configuration identified the package sources below; source maps are not release assets. A package marked `dev` in the lockfile can still contribute browser code, so production/dev metadata was not used as the scope boundary.

| Distributed component or credited source | Version | Static-output evidence | License |
| --- | ---: | --- | --- |
| `ajv` | 8.20.0 | browser JavaScript source map | `MIT` |
| `ajv-formats` | 2.1.1 | browser JavaScript source map | `MIT` |
| `fast-deep-equal` | 3.1.3 | browser JavaScript source map through Ajv | `MIT` |
| `fast-uri` | 3.1.2 | browser JavaScript source map through Ajv | `BSD-3-Clause` |
| `json-schema-traverse` | 1.0.0 | browser JavaScript source map through Ajv | `MIT` |
| `react` | 19.2.6 | browser JavaScript source map | `MIT` |
| `react-dom` | 19.2.6 | browser JavaScript source map | `MIT` |
| `scheduler` | 0.27.0 | browser JavaScript source map | `MIT` |
| `react-server-dom-webpack` | 19.2.6 | browser JavaScript source map | `MIT` |
| `vinext` | 0.0.50 | browser JavaScript source map | `MIT` |
| Next.js-derived fragments credited by Vinext | 16.2.10 local reference; Vinext links upstream `canary` sources | bundled Vinext files explicitly mark code as ported or adapted from Next.js | `MIT` |
| `@vitejs/plugin-rsc` | 0.5.26 | browser JavaScript source map | `MIT` |
| `@hiogawa/utils` | 1.7.0 | vendored in the plugin's published `dist-rz-*.js`; that module is included in the client map | `MIT` |
| `vite` | 8.1.4 | generated `__vite__` client loader code | `MIT` |
| `rolldown` | 1.1.5 | generated `rolldown-runtime` browser chunk | `MIT` |
| `tailwindcss` | 4.2.1 | generated CSS carries the Tailwind version/license banner | `MIT` |

The audited client source map did not identify TypeScript, Wrangler, Cloudflare's Vite plugin, ESLint, Sharp/libvips, Resvg, Lightning CSS, `caniuse-lite`, or the remaining locked packages as browser sources. They are build, test, CLI, optional, platform-specific, or server-side dependencies for this release configuration. That finding applies only to the static client route described above.

The release contains no webfont files or downloaded font CSS. The repository's small `favicon.svg` and inline geometric icon paths are entrant-authored WitnessPatch assets documented in `docs/ASSET_PROVENANCE.md`; no external icon source or icon package is used.

## MIT notices for the static client

The following upstream copyright notices cover the MIT-licensed portions identified above. One copy of the common MIT permission and warranty text follows them.

Copyright (c) Meta Platforms, Inc. and affiliates.

Copyright (c) 2026 Cloudflare, Inc.

Copyright (c) 2025 Vercel, Inc.

Copyright (c) 2019-present, Yuxi (Evan) You and Vite contributors

Copyright (c) 2019-present, VoidZero Inc. and Vite contributors

Copyright (c) 2024-present VoidZero Inc. & Contributors

Copyright (c) 2017 [the Rollup contributors](https://github.com/rollup/rollup/graphs/contributors)

Copyright (c) 2020 Evan Wallace

Copyright (c) Tailwind Labs, Inc.

Copyright (c) 2015-2021 Evgeny Poberezkin

Copyright (c) 2020 Evgeny Poberezkin

Copyright (c) 2017 Evgeny Poberezkin

`@hiogawa/utils` 1.7.0 is published by Hiroshi Ogawa and declares `MIT` in its npm and repository package metadata. Its published tarball and linked repository do not provide a standalone license file or copyright line to reproduce. The standard MIT terms below are preserved for the vendored code; this upstream notice omission should be reconsidered if the distribution route expands beyond the limited static Build Week demo.

MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## BSD-3-Clause notice for `fast-uri`

Copyright (c) 2011-2021, Gary Court until https://github.com/garycourt/uri-js/commit/a1acf730b4bba3f1097c9f52e7d9d3aba8cdcaae
Copyright (c) 2021-present The Fastify team <https://github.com/fastify/fastify#team>
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:
    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.
    * The names of any contributors may not be used to endorse or promote
      products derived from this software without specific prior written
      permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDERS AND CONTRIBUTORS BE LIABLE FOR ANY
DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

                                  *   *   *

The complete list of contributors can be found at:
- https://github.com/garycourt/uri-js/graphs/contributors

This notice does not replace or modify any upstream license. WitnessPatch source authored or controlled by the entrant is released under the MIT License in `LICENSE`; third-party components remain governed by their own terms. The distribution-scoped notice audit must be repeated if the project later vendors dependency payloads, publishes a package, or distributes a server image.
