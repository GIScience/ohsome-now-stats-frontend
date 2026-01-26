import {defineConfig} from 'vitest/config';

export default defineConfig({
    test: {
        watch: false,
        globals: true,
        environment: 'jsdom',

        reporters: ['default'],
        coverage: {
            provider: 'v8',
            reporter: ['lcov'],
            reportsDirectory: './coverage',
        },
    },
});
