module.exports = {
  env: {
    browser: true,
    es2021: true
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'semistandard'
  ],
  settings: {
    react: {
      version: 'detect'
    }
  },
  parserOptions: {
    ecmaFeatures: {
      jsx: true
    },
    ecmaVersion: 12,
    sourceType: 'module'
  },
  plugins: [
    'react',
    'sort-imports-es6-autofix'
  ],
  rules: {

    // React hooks rules
    // Checks rules of Hooks
    'react-hooks/rules-of-hooks': 'error',

    // Checks effect dependencies
    'react-hooks/exhaustive-deps': 'warn',

    'sort-imports-es6-autofix/sort-imports-es6': [2, {
      ignoreCase: true,
      ignoreMemberSort: false,
      memberSyntaxSortOrder: ['none', 'multiple', 'single', 'all']
    }],

    'comma-dangle': ['error', 'only-multiline'],
    'space-before-function-paren': ['error', { anonymous: 'always', named: 'never', asyncArrow: 'always' }],

    'react/react-in-jsx-scope': 'off',

    // TODO: Remove this line to enable the rule after converting to Typescript
    'react/prop-types': [0, {}],

  }
};
