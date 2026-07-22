import nx from '@nx/eslint-plugin';
import yml from 'eslint-plugin-yml';

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/angular'],
  // Correctness-only YAML rules (empty values/keys, irregular whitespace, tabs) — not the
  // opinionated "standard" style, which would force reformatting our { key: value } flow style.
  // Actual docker-compose parser compatibility is validated separately by `pnpm run lint:compose`.
  ...yml.configs['flat/recommended'],
  {
    ignores: ['**/dist', '**/build', '**/.gradle', '**/node_modules'],
  },
  {
    files: ['**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      // This workspace deliberately uses NgModules + constructor injection, not standalone components.
      '@angular-eslint/prefer-standalone': 'off',
      '@angular-eslint/prefer-inject': 'off',
    },
  },
  {
    // `pull_request:` with no value is standard GitHub Actions syntax (all PR event types).
    files: ['.github/workflows/**/*.{yml,yaml}'],
    rules: {
      'yml/no-empty-mapping-value': 'off',
    },
  },
];
