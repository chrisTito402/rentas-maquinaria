import { defineConfig } from '@playwright/test';
import base from './playwright.config.js';

export default defineConfig({
  ...base,
  testDir: '../tests/aceptacion-operativa',
  testMatch: 'pantallas.spec.js',
  outputDir: '../tests/aceptacion-operativa/resultados/navegador',
  reporter: [
    ['list'],
    ['json', { outputFile: '../tests/aceptacion-operativa/resultados/navegador.json' }],
    ['html', { outputFolder: '../tests/aceptacion-operativa/resultados/reporte-html', open: 'never' }],
  ],
  use: { ...base.use, trace: 'retain-on-failure' },
});
