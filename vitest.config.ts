// Vitest config for @presource/react — the same shape packages/godspace/core/vitest.config.ts
// uses (itself a mirror of packages/presource/core/vitest.config.ts), so coverage reports and test
// globs stay consistent across the sibling packages. Two differences are deliberate: this package
// renders React DOM, so it needs a DOM environment (jsdom, matching the root config; core stays on
// happy-dom because it has no DOM code), and it has no `typecheck` block because it ships no
// `*.test-d.ts` type suite.
// Why this file exists: the package's `test` script runs `vitest run --coverage`. Without a
// package-local config that run inherits the ROOT vitest.config.ts, so the root settings that
// matter here (jsdom + globals + include + passWithNoTests) are repeated below before coverage is
// added. Root's `exclude` is deliberately NOT repeated — leaving `exclude` unset keeps vitest's own
// defaults (node_modules + .git) in force inside the package. The original trigger for this file, a
// hoisted coverage provider whose version did not match the hoisted vitest (vitest refuses that
// with "Running mixed versions is not supported"), is history rather than current state: the
// `@vitest/coverage-v8` devDependency and the hoisted vitest resolve to the same version
// (both 4.1.12 when this note was written).
import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'jsdom',
        globals: true,
        include: ['**/*.{test,spec}.{ts,tsx,js,jsx}'],
        passWithNoTests: true,
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            // Unlike its TS-only siblings, this package ships `.tsx` sources, so the instrumented
            // set must cover both extensions.
            include: ['src/**/*.{ts,tsx}'],
            // Tests, ambient declarations, barrel re-exports and Storybook stories carry no
            // runtime logic of their own (stories were previously reported at a vacuous 100%).
            exclude: [
                'src/**/*.test.ts',
                'src/**/*.test.tsx',
                'src/**/*.stories.tsx',
                'src/**/*.d.ts',
                'src/**/index.ts',
                'src/index.ts',
            ],
            reportsDirectory: 'coverage',
        },
    },
});
