import {defineConfig} from 'vitest/config';

export default defineConfig({
    test: {
        watch: false,
        globals: true,
        environment: 'jsdom',
        setupFiles: ['src/setup-tests.ts'],

        reporters: ['default'],
        coverage: {
            provider: 'v8',
            reporter: ['lcov'],
            reportsDirectory: './coverage',
        },
    },
});
