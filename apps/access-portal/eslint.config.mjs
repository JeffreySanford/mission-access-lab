import playwright from 'eslint-plugin-playwright';
import baseConfig from '../../eslint.config.mjs';

export default [
  ...baseConfig,
  {
    // This file is closer than the root eslint.config.mjs to everything under
    // apps/access-portal, including the Jasmine/Karma *.spec.ts files — scope
    // Playwright's rules (e.g. "expect must be inside a test block", which doesn't
    // know about Jasmine's it()) to the e2e directory only, or they misfire project-wide.
    files: ['e2e/**', '**/e2e/**'],
    ...playwright.configs['flat/recommended'],
  },
];
