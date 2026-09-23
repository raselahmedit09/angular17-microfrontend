# Angular 17 Microfrontend (Module Federation) — Developer Guide

This repository is an Angular 17 workspace split into a **shell** (host), two **microfrontends** (MFE1, MFE2), and a **shared library** (lib1), wired together with [`@angular-architects/module-federation`](https://www.npmjs.com/package/@angular-architects/module-federation) on top of Webpack 5 Module Federation.

This guide is meant to get a new developer productive end-to-end: setup, daily dev workflow, how the federation is wired, how to extend it, and how to debug the errors you will actually hit.

---

## Table of contents

1. [Architecture at a glance](#architecture-at-a-glance)
2. [Repository layout](#repository-layout)
3. [Prerequisites](#prerequisites)
4. [First-time setup](#first-time-setup)
5. [Running the apps locally](#running-the-apps-locally)
6. [Ports reference](#ports-reference)
7. [How Module Federation is wired](#how-module-federation-is-wired)
8. [Routing model](#routing-model)
9. [Shared library (lib1)](#shared-library-lib1)
10. [Cross-app communication (dynamic navbar loading)](#cross-app-communication-dynamic-navbar-loading)
11. [i18n / translation](#i18n--translation)
12. [Generating typed API clients (OpenAPI Generator)](#generating-typed-api-clients-openapi-generator)
13. [Common developer scenarios](#common-developer-scenarios)
    - [Add a new page to an existing MFE](#scenario-a--add-a-new-page-to-an-existing-mfe)
    - [Expose a new route module from an MFE](#scenario-b--expose-a-new-route-module-from-an-mfe)
    - [Expose a new standalone component from an MFE](#scenario-c--expose-a-new-standalone-component-from-an-mfe)
    - [Add a brand-new microfrontend (MFE3)](#scenario-d--add-a-brand-new-microfrontend-mfe3)
    - [Add something to the shared library](#scenario-e--add-something-to-the-shared-library)
    - [Consume lib1 as a published package vs. local source](#scenario-f--consume-lib1-as-a-published-package-vs-local-source)
    - [Point the shell at a deployed/staging MFE instead of localhost](#scenario-g--point-the-shell-at-a-deployedstaging-mfe-instead-of-localhost)
    - [Generate a new typed API client from a backend Swagger/OpenAPI doc](#scenario-h--generate-a-new-typed-api-client-from-a-backend-swaggeropenapi-doc)
14. [Building for production](#building-for-production)
15. [CI/CD pipeline](#cicd-pipeline)
16. [Testing](#testing)
17. [VS Code tasks](#vs-code-tasks)
18. [Troubleshooting](#troubleshooting)
19. [Useful links](#useful-links)

---

## Architecture at a glance

```
                         ┌─────────────────────────┐
                         │        shell (host)      │  http://localhost:4200
                         │  - app.routes.ts          │
                         │  - loads remotes at       │
                         │    runtime via            │
                         │    loadRemoteModule()     │
                         └───────────┬───────────────┘
                                     │ dynamically imports remoteEntry.js
                 ┌───────────────────┼───────────────────┐
                 ▼                                       ▼
      ┌─────────────────────┐                 ┌─────────────────────┐
      │  mfe1 (remote)       │                 │  mfe2 (remote)       │
      │  localhost:4201       │                 │  localhost:4202       │
      │  exposes:             │                 │  exposes:             │
      │   ./routes             │                 │   ./routes             │
      │   ./navbarComponent    │                 │   ./navbarComponent    │
      └─────────────────────┘                 └─────────────────────┘

                 both shell + mfe1 + mfe2 consume
                                     ▼
                       ┌─────────────────────────┐
                       │   lib1 (shared library)  │
                       │  - BreadcrumbComponent    │
                       │  - DateFormatPipe          │
                       └─────────────────────────┘
```

- **shell** is the host application. It does **not** declare static `remotes` in its webpack config — remotes are loaded **dynamically at runtime** via `loadRemoteModule()` wherever they're needed (see [How Module Federation is wired](#how-module-federation-is-wired)).
- **mfe1** and **mfe2** are standalone Angular apps that can run independently (`ng serve mfe1`) and are also loaded as remotes inside the shell.
- **lib1** is a normal Angular library (`ng-packagr`), not a Module Federation remote. It's built once and consumed by source/package by the shell and the MFEs.

---

## Repository layout

```
angular17-microfrontend/
├── projects/
│   ├── shell/     # host app — routing shell, i18n, navbar host, breadcrumb host
│   ├── mfe1/      # remote — flight-search, passenger-search, dashboard (about/contact)
│   ├── mfe2/      # remote — dashboard (about/contact)
│   └── lib1/      # shared Angular library — BreadcrumbComponent, DateFormatPipe
├── angular.json           # 4 projects: shell, mfe1, mfe2, lib1
├── package.json            # root scripts + shared deps (installed once for the whole workspace)
├── .npmrc                   # GitHub Packages registry scope for @raselahmedit09
└── .github/workflows/       # CI: build every project + deploy to GitHub Pages
```

Angular CLI treats this as a **single workspace** with multiple projects (`ng.json` `projects` map). There is one `node_modules` and one `package.json` at the root — you do **not** `npm install` inside `projects/*`.

---

## Prerequisites

- Node.js 18.x (matches the CI workflow's `setup-node` version — use the same locally to avoid "works on my machine" issues)
- Angular CLI 17.x (`npm i -g @angular/cli@17` or just use `npx ng`)
- A GitHub account with access to the `@raselahmedit09` GitHub Packages scope, **only if** you plan to install/publish `@raselahmedit09/lib1` as a package (see [.npmrc note](#note-on-npmrc) below). For local dev you can avoid this entirely (see [Scenario F](#scenario-f--consume-lib1-as-a-published-package-vs-local-source)).

### Note on `.npmrc`

The `.npmrc` at the workspace root scopes `@raselahmedit09` to GitHub Packages:

```
registry=https://registry.npmjs.org/
@raselahmedit09:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=<token>
```

> ⚠️ **Do not commit a real personal access token here.** Use a local, un-committed token (e.g. export it into `.npmrc` via an environment variable, or keep your token only in a global `~/.npmrc` / `%USERPROFILE%\.npmrc`) and add `.npmrc` to `.gitignore` if it contains a real secret. CI authenticates independently using the `G_TOKEN_READ_PACKAGE` repository secret (see [CI/CD pipeline](#cicd-pipeline)), so a committed personal token is not required for builds to work in GitHub Actions — only for developers who choose to `npm install` the published `@raselahmedit09/lib1` package locally.

---

## First-time setup

```sh
# from the angular17-microfrontend folder
npm install
```

If `npm install` misbehaves (stale lockfile, corrupted cache, peer-dependency conflicts after switching branches):

```sh
npm cache clean --force
npm audit fix --force
```

> The original README had a typo (`--focce`) — the correct flag is `--force`. Only use `audit fix --force` when you understand it may bump dependencies to versions that include breaking changes; prefer just re-running `npm install` first.

---

## Running the apps locally

Module Federation remotes must exist before the host tries to load them, and `lib1` must be **built** (not served) before the apps that consume it compile. Run these in order, each in its own terminal:

```sh
ng build lib1        # 1. build the shared library once (rebuild after every lib1 change)
ng serve shell -o     # 2. host — opens http://localhost:4200
ng serve mfe1         # 3. remote — http://localhost:4201
ng serve mfe2         # 4. remote — http://localhost:4202
```

- `lib1` is **not** watched automatically — if you change a component/pipe in `projects/lib1`, re-run `ng build lib1` (or `ng build lib1 --watch`) or the shell/MFEs will keep using the stale output in `dist/lib1`.
- You can serve `mfe1` or `mfe2` **standalone** (without the shell) for isolated development — each remote has its own `HomeComponent`/routes and runs fine on its own port.
- The shell will still render even if a remote is down, but navigating to a route owned by that remote will fail — see [Troubleshooting](#troubleshooting).

### One-shot alternative

`mfe1`'s `package.json` exposes a helper script that can start every project's dev server via the module-federation dev-server tool:

```sh
npm run run:all
```

This runs `mf-dev-server.js`, which is aware of each project's Module Federation config and can start them together. Prefer the 4 explicit commands above while you're learning the repo, since it's easier to see which app's terminal output/errors you're looking at.

---

## Ports reference

| Project | Port | URL                         | Role                          |
|---------|------|------------------------------|--------------------------------|
| shell   | 4200 | http://localhost:4200        | Host / entry point             |
| mfe1    | 4201 | http://localhost:4201        | Remote — exposes `./routes`, `./navbarComponent` |
| mfe2    | 4202 | http://localhost:4202        | Remote — exposes `./routes`, `./navbarComponent` |
| lib1    | n/a  | n/a (built, not served)       | Shared library, consumed via `dist/lib1` / source |

Ports are fixed in `angular.json` (`serve.options.port` / `publicHost` per project) — change them there (and in every place a `remoteEntry.js` URL is hardcoded, see below) if you need different ports.

---

## How Module Federation is wired

Each application has a `webpack.config.js` (dev) and `webpack.prod.config.js` (prod) passed into `ngx-build-plus` via `extraWebpackConfig` in `angular.json`.

**shell** (`projects/shell/webpack.config.js`) — no static remotes:

```js
module.exports = withModuleFederationPlugin({
  // remotes are intentionally left empty/commented out here —
  // the shell loads remotes dynamically at runtime instead, see below.
  shared: { ...shareAll({ singleton: true, strictVersion: true, requiredVersion: 'auto' }) },
});
```

**mfe1** (`projects/mfe1/webpack.config.js`) — exposes modules:

```js
module.exports = withModuleFederationPlugin({
  name: 'mfe1',
  exposes: {
    './routes': './projects/mfe1/src/app/app.routes.ts',
    './navbarComponent': './projects/mfe1/src/app/navbar/navbar.component.ts',
  },
  shared: { ...shareAll({ singleton: true, strictVersion: true, requiredVersion: 'auto' }) },
});
```

`mfe2` mirrors `mfe1`'s config with its own `name: 'mfe2'` and the same two exposed modules.

Instead of declaring `remotes` up front, the shell calls `loadRemoteModule()` **on demand**, both for routes (`app.routes.ts`) and for components (`app.component.ts`):

```ts
loadRemoteModule({
  type: 'module',
  remoteEntry: 'http://localhost:4201/remoteEntry.js',
  exposedModule: './routes',
}).then(m => m.MFE1_ROUTES);
```

This is the **dynamic Module Federation** pattern — the shell has zero build-time knowledge of the remotes' internals; it only needs to know their `remoteEntry.js` URL and the name of the exposed module. This is what lets `shell` be built and deployed independently of `mfe1`/`mfe2` release cycles.

`shared: { ...shareAll({ singleton: true, strictVersion: true, requiredVersion: 'auto' }) }` shares **every** dependency (Angular, RxJS, etc.) as a singleton across host and remotes. This is what makes Angular's DI/router/zone.js work correctly across app boundaries — see [Troubleshooting](#troubleshooting) for what breaks when this is violated.

---

## Routing model

- **Shell routes** (`projects/shell/src/app/app.routes.ts`): `''` → `HomeComponent`, then two more `''` routes that lazily `loadRemoteModule(...).then(m => m.MFE1_ROUTES / MFE2_ROUTES)`, then a wildcard `NotFoundComponent`. Because MFE1/MFE2 routes are declared under their own path prefix (`mfe1/...`, `mfe2/...`), all three route groups can share the `''` parent path without colliding.
- **MFE1 routes** (`projects/mfe1/src/app/app.routes.ts`, exported as `MFE1_ROUTES`): `mfe1` → `HomeComponent`; `mfe1/flight-search` and `mfe1/passenger-search`; and `mfe1` again with `loadChildren` pointing at a **nested lazy route file** (`./routes/dashboard/dashboard.routes.ts`, exported as `DASHBOARD_ROUTES`) for `about`/`contact`. This nested lazy-loading works identically whether MFE1 is run standalone or federated into the shell.
- **MFE2 routes** mirror MFE1's simpler shape: `mfe2` → `HomeComponent`, plus a lazy `dashboard.routes.ts` for `about`/`contact`.
- **Breadcrumbs**: every route entry carries `data: { breadcrumb: '...' }`. `lib1`'s `BreadcrumbComponent` (rendered once, in the shell's `app.component.html`) walks the activated route tree recursively on every `NavigationEnd` and rebuilds the breadcrumb trail from that `data.breadcrumb` metadata — so adding a breadcrumb to a new route is just adding that `data` property, nothing else to wire up.

---

## Shared library (lib1)

`lib1` currently exports:

- `BreadcrumbComponent` (`projects/lib1/src/lib/components/breadcrumb/`)
- `DateFormatPipe` (`projects/lib1/src/lib/pipes/date-format.pipe.ts`)

Public surface is controlled by `projects/lib1/src/public-api.ts` — anything you want consumable from `lib1` (or `@raselahmedit09/lib1`) must be re-exported there.

Build it like any Angular library:

```sh
ng build lib1                 # production build → dist/lib1
ng build lib1 -c development  # dev build, faster, unminified
```

### Two ways this repo consumes lib1 — know the difference

1. **Package import** — `import { BreadcrumbComponent } from 'lib1'` (aliased via `@raselahmedit09/lib1` in `package.json`, resolved through the TS path mapping to `dist/lib1`, or the published GitHub Package). Simple, but **only picks up whatever was last built** — you must `ng build lib1` again after any change.
2. **Relative source import** — `import { DateFormatPipe } from '../../../lib1/src/lib/pipes/date-format.pipe'`. Bypasses the built package entirely and compiles straight from `lib1`'s TypeScript source, so no rebuild step is needed.

`projects/shell/src/app/app.component.ts` currently uses **both** in the same file, which is intentional-but-confusing during local development: the breadcrumb component comes from the package alias, the date pipe from relative source. If you're actively iterating on a `lib1` file, prefer the relative-source import style temporarily so you don't have to remember to rebuild — but keep the package-style import for anything considered "stable" API, since that's what a real multi-repo/multi-team setup would use.

---

## Cross-app communication (dynamic navbar loading)

The shell doesn't statically know which MFE's navbar to render — `app.component.ts` calls `onLoadNavbar(remoteApp: 'mfe1' | 'mfe2')`, which `loadRemoteModule()`s that MFE's `./navbarComponent` exposed module and assigns the resulting class to `navbarComponent`, which is then rendered dynamically in the template (e.g. via `<ng-container *ngComponentOutlet="navbarComponent">` or equivalent in `app.component.html`).

`ngOnInit()` currently hardcodes `this.onLoadNavbar('mfe1')` on startup. If you want the shell to switch navbars based on the active route (e.g. show MFE2's navbar under `/mfe2/**`), hook `onLoadNavbar` into a `Router` `NavigationEnd` subscription keyed off the first URL segment, rather than calling it once in `ngOnInit`.

---

## i18n / translation

This is a **hand-rolled** i18n layer (not `@angular/localize` or `ngx-translate`), living entirely in the shell:

- `I18nService` (`projects/shell/src/app/services/i18n.service.ts`) fetches `/assets/i18n/{locale}.json` plus every `/assets/i18n/{feature}/{locale}.json` (currently `feature1`, `feature2` — hardcoded in `loadFeatureTranslations`) and merges them into one flat/nested translation map.
- `TranslatePipe` (`translate` pipe, `pure: false` so it re-evaluates as translations load asynchronously) looks up a dotted key (`'some.nested.key'`) against that map, falling back to the key itself if not found.
- `AppComponent.ngOnInit()` loads locale `'en'` on startup; `switchLanguage(locale)` re-loads translations for a different locale — wire a language switcher in the template to call it.

**To add a new translation key**: add it to the relevant `assets/i18n/**/en.json` (and `sp.json` for Spanish) file, then reference it in a template with `{{ 'your.key' | translate }}`.

**To add a new feature's translations**: add its JSON files under `projects/shell/src/assets/i18n/<feature>/`, then add that path to the `paths` array in `I18nService.loadFeatureTranslations`.

> Translation JSON lives under the **shell's** assets, not each MFE's — MFEs loaded as remotes don't get their own `assets` served independently in the federated (non-standalone) scenario, since the browser is still on the shell's origin.

---

## Generating typed API clients (OpenAPI Generator)

The root [`package.json`](package.json) (note: it's still named `mfe1-app` from before this became a multi-project workspace — that's cosmetic only) defines two code-generation scripts built on [`@openapitools/openapi-generator-cli`](https://www.npmjs.com/package/@openapitools/openapi-generator-cli) (already a `devDependency`, so no extra install is needed beyond the initial `npm install`):

```json
"generate:WeatherForecast_Api_Service": "openapi-generator-cli generate -i http://localhost:5256/swagger/v1/swagger.json -g typescript-angular -o lib-api/api-WeatherForecast -p=removeOperationIdPrefix=true --additional-properties=apiModulePrefix=WeatherForecast,configurationPrefix=WeatherForecastApi",
"generate:HrManagement_Api_Service": "openapi-generator-cli generate -i http://localhost:7092/swagger/v1/swagger.json -g typescript-angular -o lib-api/api-HrManagement -p=removeOperationIdPrefix=true --additional-properties=apiModulePrefix=HrManagement,configurationPrefix=HrManagementApi"
```

Each script points `openapi-generator-cli` at a **running backend's** live OpenAPI/Swagger document and generates a full `typescript-angular` client (models, services, an Angular module, and a configuration class) straight into `lib-api/<output-folder>`. `HrManagement_Api_Service` targets port **7092**, which is the HTTP profile of `HR.LeaveManagement.Api` in the sibling [`ASP.NET-Core-SOLID-and-Clean-Architecture-.NET-8`](../ASP.NET-Core-SOLID-and-Clean-Architecture-.NET-8) repo — this Angular workspace is meant to consume that .NET service's API through a generated client rather than hand-written `HttpClient` calls.

### Prerequisite: Java

`openapi-generator-cli` is a Node wrapper around the Java-based [OpenAPI Generator](https://openapi-generator.tech/); on first use it downloads the generator `.jar` and needs a **Java 8+ runtime** on `PATH` to run it. If `npm run generate:...` fails with something like `Error: spawn java ENOENT` or hangs on "Downloading...", install a JDK/JRE first (`java -version` should succeed).

### Running a generator

The **target backend must already be running** (see the .NET repo's guide for how to `dotnet run` each API) before you generate, since the CLI fetches the live `swagger.json` over HTTP:

```sh
# 1. start the backend in the other repo first, e.g.:
#    cd ASP.NET-Core-SOLID-and-Clean-Architecture-.NET-8/ServiceApplications/LeaveManagement/API/HR.LeaveManagement.Api
#    dotnet run
# 2. then, from this repo:
npm run generate:HrManagement_Api_Service
npm run generate:WeatherForecast_Api_Service
```

This writes/overwrites `lib-api/api-HrManagement/` or `lib-api/api-WeatherForecast/` in full — **treat everything under `lib-api/` as generated code**; don't hand-edit it, since the next `npm run generate:...` will silently overwrite your changes. Neither `lib-api/` folder exists in a fresh checkout — you generate them locally the first time you need that API's client, and `lib-api/` is **not** currently listed in `.gitignore`, so if you commit generated output, review the diff (it can be large) rather than committing it by accident on an unrelated change.

### `-p=removeOperationIdPrefix=true` and the module/configuration prefixes

- `removeOperationIdPrefix=true` strips a controller-name prefix the generator would otherwise add to method names (e.g. so a `LeaveTypesController.Get()` action becomes a clean `get()`/`getAll()` client method instead of `leaveTypesGet()`).
- `apiModulePrefix`/`configurationPrefix` exist specifically so **multiple generated clients can coexist in the same Angular app** without class-name collisions — `apiModulePrefix=HrManagement` produces an `HrManagementApiModule`, `configurationPrefix=HrManagementApi` produces an `HrManagementApiConfiguration`, and the `WeatherForecast` generation gets its own distinctly-named module/configuration pair.

### Consuming a generated client

Import the generated module and provide its configuration (typically with the API's base URL) wherever you bootstrap the app/feature that needs it:

```ts
import { HrManagementApiModule, HrManagementApiConfiguration } from '../../lib-api/api-HrManagement';

// in an NgModule's imports, or via provideAppInitializer/APP_INITIALIZER for standalone apps:
HrManagementApiModule.forRoot(() => new HrManagementApiConfiguration({
  basePath: 'http://localhost:7092', // or through the Ocelot gateway, once routed correctly
}))
```

Since the shell/MFEs in this workspace are standalone-component based (no `NgModule` bootstrap), prefer providing the configuration via a factory in `ApplicationConfig.providers` (`app.config.ts`) rather than `forRoot()`, unless you're consuming the generated module from a component that still uses `NgModule`-style imports.

---

## Common developer scenarios

### Scenario A — Add a new page to an existing MFE

1. Generate the component inside the MFE project, e.g. `ng generate component routes/dashboard/settings --project=mfe1`.
2. Add a route entry to that MFE's routes file (top-level `app.routes.ts` or a nested `*.routes.ts` under `routes/`), including `data: { breadcrumb: 'settings' }` if you want it in the breadcrumb trail.
3. If the MFE is already exposing `./routes` (both mfe1 and mfe2 do), **no webpack config change is needed** — the new route is picked up automatically the next time the remote rebuilds, since the whole routes module is exposed, not individual routes.
4. Restart (or let the dev server rebuild) the MFE; refresh the shell.

### Scenario B — Expose a new route module from an MFE

Only needed if you're adding an **entirely new top-level exposed module** (rare — usually you just add to the existing `./routes`). Add an entry to that MFE's `exposes` map in `webpack.config.js`:

```js
exposes: {
  './routes': './projects/mfe1/src/app/app.routes.ts',
  './navbarComponent': './projects/mfe1/src/app/navbar/navbar.component.ts',
  './settingsRoutes': './projects/mfe1/src/app/routes/settings/settings.routes.ts', // new
},
```

Then load it from the shell (or another consumer) with `loadRemoteModule({ ..., exposedModule: './settingsRoutes' })`.

### Scenario C — Expose a new standalone component from an MFE

Same pattern as the navbar: add the component's path to `exposes` in that MFE's `webpack.config.js`, then in the consumer:

```ts
const mod = await loadRemoteModule({
  type: 'module',
  remoteEntry: 'http://localhost:4201/remoteEntry.js',
  exposedModule: './yourExposedKey',
});
this.someComponentRef = mod.YourComponentClassName;
```

Remember: the component must be **standalone** (`standalone: true`) — this workspace does not use NgModules for the federated apps.

### Scenario D — Add a brand-new microfrontend (MFE3)

1. `ng generate application mfe3 --routing --style=css` (creates `projects/mfe3`).
2. Install and configure `ngx-build-plus` + `@angular-architects/module-federation` for it the same way `mfe1`/`mfe2` are configured — easiest is to run:
   ```sh
   ng add @angular-architects/module-federation --project mfe3 --port 4203 --type remote
   ```
   This scaffolds `webpack.config.js`/`webpack.prod.config.js` and rewires `angular.json`'s `build`/`serve` architect targets to `ngx-build-plus` for you.
3. In `projects/mfe3/webpack.config.js`, set `name: 'mfe3'` and add an `exposes` map for whatever routes/components it should share.
4. In the shell, add a new route block in `app.routes.ts` that `loadRemoteModule()`s `http://localhost:4203/remoteEntry.js` → `./routes`, following the exact same pattern as the MFE1/MFE2 blocks.
5. Add `4203` to the [ports reference table](#ports-reference) above and to the CI build matrix (see [CI/CD pipeline](#cicd-pipeline)).
6. Add `ng serve mfe3` to your local run steps.

### Scenario E — Add something to the shared library

1. Generate it inside `lib1`, e.g. `ng generate component components/alert-banner --project=lib1`.
2. Re-export it from `projects/lib1/src/public-api.ts`.
3. `ng build lib1`.
4. Consume it from the shell/MFEs via `import { AlertBannerComponent } from 'lib1'` (package alias) — see [Shared library](#shared-library-lib1) for the relative-source alternative while iterating.
5. If it needs to be published for other repos to consume, bump the version in `projects/lib1/package.json` and run `npm publish` from `dist/lib1` (requires GitHub Packages auth — see [.npmrc note](#note-on-npmrc)).

### Scenario F — Consume lib1 as a published package vs. local source

- **Local monorepo dev (default, recommended)**: don't touch `package.json`'s `@raselahmedit09/lib1` dependency at all day-to-day; just `ng build lib1` and import from `'lib1'` (path-mapped locally) or via relative source paths as described above. You do **not** need GitHub Packages credentials for this.
- **Consuming the published package** (e.g. testing what an external consumer would get): `npm install @raselahmedit09/lib1` requires the `.npmrc` scope + a valid `_authToken` with `read:packages` for this GitHub org/user, since it's hosted on GitHub Packages, not the public npm registry.
- The original project README called out: *remove `"@raselahmedit09/lib1": "^0.0.1"` from `package.json` and use the relative import in `app.component.ts` instead of `'lib1'`* — that workaround is for developers **without** GitHub Packages access. If you have access, you can leave the package dependency in place and use the `'lib1'` import as shown in the current `app.component.ts`.

### Scenario G — Point the shell at a deployed/staging MFE instead of localhost

Every `remoteEntry` URL is currently a **hardcoded `http://localhost:####`** string, in three places:

- `projects/shell/src/app/app.routes.ts` (2 occurrences — MFE1/MFE2 routes)
- `projects/shell/src/app/app.component.ts` (`onLoadNavbar`, 2 occurrences)

To point at a deployed MFE (staging/prod), either:
- Swap the hardcoded string for an environment-specific value (introduce Angular `environment.ts`/`environment.prod.ts` files per app and read the remote URLs from there — this repo does not currently have environment files, so you'd be adding that pattern), or
- For a quick local test against a deployed remote, just temporarily edit the URL string, run the shell, and revert before committing.

There is no environment-file-based configuration for remote URLs in this repo today — treat that as a known gap if you're taking this to a real multi-environment deployment.

### Scenario H — Generate a new typed API client from a backend Swagger/OpenAPI doc

1. Start the target backend locally and confirm its Swagger doc is reachable, e.g. `http://localhost:<port>/swagger/v1/swagger.json` in a browser.
2. Add a new script to the root `package.json`, copying the shape of the existing two, e.g.:
   ```json
   "generate:MyService_Api_Service": "openapi-generator-cli generate -i http://localhost:<port>/swagger/v1/swagger.json -g typescript-angular -o lib-api/api-MyService -p=removeOperationIdPrefix=true --additional-properties=apiModulePrefix=MyService,configurationPrefix=MyServiceApi"
   ```
   Give it a unique `-o` output folder and unique `apiModulePrefix`/`configurationPrefix` values so it can't collide with `HrManagement`/`WeatherForecast` if all three end up imported in the same app.
3. Run `npm run generate:MyService_Api_Service` — see [Generating typed API clients](#generating-typed-api-clients-openapi-generator) for prerequisites and gotchas.
4. Import the generated `<Prefix>ApiModule`/`<Prefix>ApiConfiguration` from `lib-api/api-MyService` wherever you need to call that service, providing the real base URL (localhost for dev, the deployed host for other environments — same caveat as [Scenario G](#scenario-g--point-the-shell-at-a-deployedstaging-mfe-instead-of-localhost) about this repo not having environment files yet).
5. Re-run the same `npm run generate:...` command any time that backend's API contract changes — there's no watch mode; regeneration is a manual, on-demand step.

---

## Building for production

```sh
ng build lib1 --configuration production
ng build shell --configuration production
ng build mfe1 --configuration production
ng build mfe2 --configuration production
```

Each app's `production` configuration switches `extraWebpackConfig` to that app's `webpack.prod.config.js` — in this repo, every `webpack.prod.config.js` simply does `module.exports = require('./webpack.config')`, i.e. **dev and prod use the identical Module Federation config** (same hardcoded `localhost` remote URLs). This means a production build of the shell will still try to load remotes from `http://localhost:4201`/`4202` unless you address [Scenario G](#scenario-g--point-the-shell-at-a-deployedstaging-mfe-instead-of-localhost) first — **don't assume `ng build --configuration production` alone makes this deployable as-is.**

Production bundle budgets are set in `angular.json` per app (500kb warning / 1mb error for initial bundle, 2kb/4kb for component styles) — CI will fail the build if these are exceeded.

---

## CI/CD pipeline

`.github/workflows/app_build_deploy.yml` runs on push/PR to `main` and on manual dispatch:

1. **build** job — matrix over `[lib1, shell, mfe1, mfe2]`: checks out, sets up Node 18 with the GitHub Packages registry, authenticates via the `G_TOKEN_READ_PACKAGE` secret, `npm install`, `npm run build <project>`, uploads `dist/<project>` as an artifact.
2. **deploy** job — downloads each project's artifact into `dist/<project>` and publishes the combined `dist/` folder to GitHub Pages via `peaceiris/actions-gh-pages`, using the built-in `GITHUB_TOKEN`.

If you add **MFE3** (or any new project), you must add it to **both** matrices (`build` and `deploy`) in this workflow, or it will silently be skipped by CI.

Note this pipeline builds each project independently but does **not** currently rewrite remote URLs per environment — see [Scenario G](#scenario-g--point-the-shell-at-a-deployedstaging-mfe-instead-of-localhost).

---

## Testing

Each project has Karma/Jasmine wired up out of the box:

```sh
ng test shell
ng test mfe1
ng test mfe2
ng test lib1
```

There's also a root `npm test` (defaults to whichever project `ng test` resolves to without a project flag — prefer the explicit `ng test <project>` form above in a multi-project workspace).

---

## VS Code tasks

`.vscode/tasks.json` defines two background tasks (`npm: start`, `npm: test`) wired to the TypeScript problem matcher, so you can run them via **Terminal → Run Task** and get inline error reporting. These map to whatever `start`/`test` resolve to for the default project — for a specific MFE, it's usually simpler to just run `ng serve <project>` / `ng test <project>` directly in a terminal, since this workspace has 4 projects and no single task targets all of them.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Shell loads, but navigating to `/mfe1/...` or `/mfe2/...` shows nothing / console `Failed to fetch dynamically imported module` or 404 on `remoteEntry.js` | The MFE isn't running, or is running on a different port than the shell expects | Confirm `ng serve mfe1`/`mfe2` are actually running, and that the ports match `http://localhost:4201`/`4202` as hardcoded in `app.routes.ts`/`app.component.ts` |
| `Uncaught Error: Shared module is not available for eager consumption` | A shared singleton (Angular core/router/etc.) is being imported eagerly somewhere before Module Federation has initialized it | Make sure the app's `main.ts` does `import('./bootstrap')` (dynamic import) rather than importing `bootstrap.ts` directly — this repo already follows that pattern in `shell`/`mfe1`/`mfe2`; if you add a new entry point, copy this exact `main.ts`/`bootstrap.ts` split |
| `Version X of shared singleton module Y is not compatible with requested version Z` (a `strictVersion` error) | Shell and a remote (or two remotes) have different Angular/RxJS/etc. versions in their `package.json`, but `shareAll({ strictVersion: true, ... })` demands they match | Align the dependency versions across all `projects/*` in the root `package.json` (there's only one `package.json` for the whole workspace, so this usually means someone bumped a version without reinstalling everywhere) — `rm -rf node_modules && npm install` after fixing versions |
| Breadcrumbs are blank or show unexpected labels on a federated route | The route's `data.breadcrumb` is missing, or the route's `path` doesn't match what `BreadcrumbComponent.buildBreadCrumb` expects (it calls `.split('/').pop()` and `.startsWith(':')` on `route.routeConfig.path`, which throws if `path` is `undefined`) | Every route that should appear in the breadcrumb trail needs both a non-empty `path` and a `data: { breadcrumb: '...' }` |
| Changes to a `lib1` component/pipe don't show up in the shell or an MFE | `lib1` is a **library**, not watched by `ng serve` of the consuming app | Re-run `ng build lib1` (or `ng build lib1 --watch` in its own terminal) after every `lib1` change |
| `npm install` fails after pulling changes that touch `lib1`'s dependency | Local `.npmrc`/GitHub Packages auth isn't set up, and `package.json` still depends on the published `@raselahmedit09/lib1` | Either configure a valid GitHub Packages token (see [.npmrc note](#note-on-npmrc)), or switch to the relative-source import workaround from the original README (see [Scenario F](#scenario-f--consume-lib1-as-a-published-package-vs-local-source)) |
| CORS error in the console when the shell tries to load a remote | Running the shell against a remote on a different origin/port without the remote's dev server allowing cross-origin requests | `ng serve`'s dev server allows this by default for `localhost`; if you're pointing at a non-localhost remote, that remote's server must send permissive CORS headers for `remoteEntry.js` and its chunks |
| Blank white page with no console error at all | Silent failure inside a dynamically loaded remote's bootstrap, or a mismatched `type: 'module'` vs the remote's actual output format | Check the Network tab for a failed/successful load of `remoteEntry.js`, then check that MFE's own `ng serve` terminal output for compile errors |
| `npm audit fix --force` unexpectedly changes Angular major version or breaks the build | `--force` will apply semver-major upgrades to satisfy audit fixes, ignoring peer dependency constraints | Revert via `git checkout -- package.json package-lock.json` (or re-run `npm install` after manually reviewing `npm audit`) and address audit findings individually instead |
| `npm run generate:HrManagement_Api_Service` (or `WeatherForecast`) fails with a fetch/connection error | The target backend isn't running, or isn't listening on the exact port in the script (`7092`/`5256`) | Start that backend first (for `HrManagement`, run `HR.LeaveManagement.Api` from the sibling .NET repo) and confirm `http://localhost:<port>/swagger/v1/swagger.json` loads in a browser before re-running the generator |
| `generate:...` fails with `spawn java ENOENT` or hangs downloading a `.jar` | No Java runtime on `PATH` — `openapi-generator-cli` needs one to run the underlying Java generator | Install a JDK/JRE (8+) and confirm `java -version` works, then re-run |
| Generated code under `lib-api/` was clobbered / your manual fix disappeared | Anything under `lib-api/` is fully regenerated on every `npm run generate:...` | Don't hand-edit generated files — wrap/extend them from your own app code instead, or patch the OpenAPI spec / generator options if the generated shape itself is wrong |

---

## Useful links

- [Angular CLI Overview and Command Reference](https://angular.io/cli)
- [Module Federation with Angular's Standalone Components (angulararchitects.io)](https://www.angulararchitects.io/en/blog/module-federation-with-angulars-standalone-components/)
- [@angular-architects/module-federation on npm](https://www.npmjs.com/package/@angular-architects/module-federation)
