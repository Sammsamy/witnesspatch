# Third-party notices

WitnessPatch depends on the following directly installed open-source packages. Versions are locked by `package-lock.json`; `npm ci` reproduces the complete transitive inventory. This file is copied into the deployed static assets as `THIRD_PARTY_NOTICES.md`.

| Package | Version | License |
| --- | ---: | --- |
| Ajv | 8.20.0 | MIT |
| ajv-formats | 2.1.1 | MIT |
| Next.js | 16.2.10 | MIT |
| React | 19.2.6 | MIT |
| React DOM | 19.2.6 | MIT |
| Cloudflare Vite plugin | 1.44.0 | MIT |
| Tailwind CSS PostCSS plugin | 4.2.1 | MIT |
| Node.js type definitions | 22.19.19 | MIT |
| React type definitions | 19.2.14 | MIT |
| React DOM type definitions | 19.2.3 | MIT |
| Vite React plugin | 6.0.2 | MIT |
| Vite RSC plugin | 0.5.26 | MIT |
| ESLint | 9.39.4 | MIT |
| Next.js ESLint config | 16.2.10 | MIT |
| React Server Components for Webpack | 19.2.6 | MIT |
| Tailwind CSS | 4.2.1 | MIT |
| TypeScript | 5.9.3 | Apache-2.0 |
| Vinext | 0.0.50 | MIT |
| Vite | 8.1.4 | MIT |
| Wrangler | 4.110.0 | MIT OR Apache-2.0 |

WitnessPatch does not download or redistribute Google Fonts. The interface uses local system font stacks so clean builds are network-independent at the font layer.

## Bundled MIT notices

The deployed application contains or may contain MIT-licensed code from Ajv (copyright Evgeny Poberezkin), Next.js and its ESLint configuration (copyright Vercel, Inc.), React, React DOM, and React Server Components (copyright Meta Platforms, Inc. and affiliates), Tailwind CSS (copyright Tailwind Labs, Inc.), Vite and its plugins (copyright their respective Vite, VoidZero, and plugin contributors), ESLint (copyright OpenJS Foundation and other contributors), Vinext and Cloudflare build tooling (copyright Cloudflare, Inc.), and their MIT-licensed contributors and dependencies.

MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

TypeScript is used only as build tooling and is licensed under Apache-2.0. Wrangler is dual-licensed under MIT or Apache-2.0; this distribution relies on its MIT option. Exact package-specific source notices remain reproducible from the locked packages and must be preserved if the release packaging changes.

This notice does not replace or modify any upstream license. WitnessPatch itself remains unlicensed and all rights reserved for the current private judging-repository path. A public release requires a deliberate project-license decision first.
