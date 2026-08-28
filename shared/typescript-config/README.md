# @shared/typescript-config

Shared TypeScript configurations used across the monorepo. Every app and shared package extends one of the configs here rather than duplicating `compilerOptions`.

## Configs

### `base.json`

Foundation config for all packages. Key settings:

| Option                           | Value     | Why                                                            |
| -------------------------------- | --------- | -------------------------------------------------------------- |
| `target` / `lib`                 | `ES2022`  | Matches Bun's runtime capabilities.                            |
| `module`                         | `ESNext`  | ESM output; pairs with `moduleResolution: bundler`.            |
| `moduleResolution`               | `bundler` | Resolves bare specifiers the way Bun and Next.js do.           |
| `strict`                         | `true`    | Catches nullability, implicit `any`, and other common bugs.    |
| `noUncheckedIndexedAccess`       | `true`    | Array/object index accesses return `T \| undefined`, not `T`.  |
| `isolatedModules`                | `true`    | Required for single-file transpilation (Bun, esbuild, SWC).    |
| `declaration` + `declarationMap` | `true`    | Emits `.d.ts` + source maps for cross-package type navigation. |
| `incremental`                    | `false`   | Disabled — Turborepo manages caching at a higher level.        |

### `nextjs.json`

Extends `base.json` with Next.js-specific settings:

- `jsx: "preserve"` — Next.js transforms JSX itself via SWC.
- `allowJs: true` — Next.js config files (`.js`) live alongside TypeScript sources.
- `noEmit: true` — `tsc` is type-check only; Next.js handles the actual build.

## Usage

Extend the right config in your package's `tsconfig.json`:

**Elysia backend / shared packages** (`base.json`):

```json
{
  "extends": "@shared/typescript-config/base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Next.js app** (`nextjs.json`):

```json
{
  "extends": "@shared/typescript-config/nextjs.json",
  "compilerOptions": {
    "paths": { "@/*": ["./src/*"] },
    "plugins": [{ "name": "next" }]
  },
  "include": ["**/*.ts", "**/*.tsx", "next-env.d.ts"],
  "exclude": ["node_modules", ".next"]
}
```

## Extending or overriding

Any option in the extending `tsconfig.json` overrides the base. For example, the backend sets `"module": "ES2022"` over the base's `"ESNext"` to produce explicit ES2022 module syntax for Lambda compatibility.

Run type-checking across the whole monorepo from the repo root:

```bash
bun run check-types
```
