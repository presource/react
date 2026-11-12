// Vitest config for @presource/react — mirrors packages/presource/core/vitest.config.ts and
// packages/godspace/core/vitest.config.ts so coverage reports and test globs stay consistent
// across sibling packages.
// Why this file exists: the package's `test` script runs `vitest run --coverage`, but the package
// declared neither the `@vitest/coverage-v8` plugin nor a `coverage` block, so the run inherited
// the ROOT vitest.config.ts (environment/globals/include only) and resolved a hoisted coverage
// provider whose version did not match the hoisted vitest → "Running mixed versions is not
// supported". A package-local config replaces root inheritance, so the root settings
// (jsdom + globals + include + passWithNoTests) are repeated here verbatim before adding coverage.
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
