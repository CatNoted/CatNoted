## Audit Summary
Performed a codebase audit regarding Vite configuration and export mismatches.

## Fixed Bugs
1.  **Removed Vite `resolve.alias` pointing to source files**:
    - **What**: Removed the `resolve.alias` block in `apps/web/vite.config.ts`.
    - **Why**: As mandated by monorepo rules, Vite configurations must not use aliases to point workspace packages to `src/index.ts`. Instead, they should rely on standard `package.json` exports to ensure correct consumption of `dist/` builds and to avoid export mismatches.
    - **Terminal Proof Before/After**:
    Before:
    ```typescript
    resolve: {
      alias: {
        '@catnoted/shared': path.resolve(__dirname, '../../packages/shared/src/index.ts'),
        // ...
      }
    }
    ```
    After:
    ```typescript
    // Removed resolve.alias block entirely
    ```

## Unfixed Bugs
1.  **Playwright `browserType.launch` failure in CI initially**:
    - **Reason**: Playwright executables were missing in the environment.
    - **Resolution**: Ran `pnpm exec playwright install --with-deps` locally to fix it for validation, but no code changes were necessary.

## Verification Checklist
- [x] `pnpm typecheck` passed
- [x] `pnpm test` passed
- [x] `pnpm build` passed
- [x] `pnpm test:e2e` passed
