import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.js'],
      // Points d'entrée liés à l'infrastructure, couverts par les tests de bout en bout
      exclude: ['src/server.js', 'src/db.js', 'src/config.js'],
      thresholds: { lines: 90, functions: 90, branches: 85, statements: 90 },
    },
  },
});
