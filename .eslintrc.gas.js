/**
 * ESLint Configuration for Google Apps Script Projects
 * Handles GAS-specific constraints and patterns
 */

module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: './tsconfig.json'
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended'
  ],
  env: {
    es2022: true,
    node: true
  },
  // Google Apps Script globals
  globals: {
    // Core Services
    SpreadsheetApp: 'readonly',
    DriveApp: 'readonly',
    DocumentApp: 'readonly',
    FormApp: 'readonly',
    GmailApp: 'readonly',
    CalendarApp: 'readonly',
    SitesApp: 'readonly',
    GroupsApp: 'readonly',
    
    // Utility Services
    Utilities: 'readonly',
    Logger: 'readonly',
    console: 'readonly',
    Browser: 'readonly',
    Session: 'readonly',
    
    // Advanced Services
    HtmlService: 'readonly',
    ContentService: 'readonly',
    ScriptApp: 'readonly',
    UrlFetchApp: 'readonly',
    PropertiesService: 'readonly',
    CacheService: 'readonly',
    LockService: 'readonly',
    
    // UI Services
    CardService: 'readonly',
    ChartsService: 'readonly',
    
    // Google Workspace APIs
    AdminDirectory: 'readonly',
    AdminGroupsSettings: 'readonly',
    AdminLicenseManager: 'readonly',
    AdminReports: 'readonly',
    AdminReseller: 'readonly',
    
    // Other Google Services
    Analytics: 'readonly',
    BigQuery: 'readonly',
    Classroom: 'readonly',
    Docs: 'readonly',
    Drive: 'readonly',
    Gmail: 'readonly',
    Sheets: 'readonly',
    Slides: 'readonly',
    Tasks: 'readonly',
    YouTube: 'readonly',
    
    // Add-on specific
    onOpen: 'readonly',
    onInstall: 'readonly',
    onEdit: 'readonly',
    onFormSubmit: 'readonly',
    onHomepage: 'readonly'
  },
  rules: {
    // GAS-specific rule overrides
    '@typescript-eslint/triple-slash-reference': 'off', // Required for GAS type references
    '@typescript-eslint/no-namespace': 'off', // GAS uses namespace pattern
    'no-var': 'off', // GAS sometimes requires var for proper scoping
    '@typescript-eslint/no-explicit-any': 'warn', // Sometimes needed for GAS APIs
    '@typescript-eslint/ban-ts-comment': ['error', {
      'ts-ignore': 'allow-with-description',
      'ts-nocheck': false,
      'ts-check': false,
      'ts-expect-error': 'allow-with-description'
    }],
    
    // Stricter rules for code quality
    '@typescript-eslint/explicit-function-return-type': ['warn', {
      allowExpressions: true,
      allowTypedFunctionExpressions: true
    }],
    '@typescript-eslint/no-unused-vars': ['error', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_'
    }],
    'no-console': ['warn', {
      allow: ['warn', 'error', 'info']
    }],
    
    // Code style
    'quotes': ['error', 'single', { avoidEscape: true }],
    'semi': ['error', 'always'],
    'comma-dangle': ['error', 'only-multiline'],
    'indent': ['error', 2, { SwitchCase: 1 }],
    'object-curly-spacing': ['error', 'always'],
    'array-bracket-spacing': ['error', 'never'],
    
    // Best practices
    'eqeqeq': ['error', 'always'],
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-return-await': 'error',
    'prefer-const': 'error',
    'prefer-template': 'warn',
    'no-throw-literal': 'error',
    
    // GAS-specific best practices
    'no-undef': 'error', // But globals are defined above
    'no-global-assign': 'error',
    'no-shadow': ['error', {
      allow: ['Logger'] // Allow shadowing of Logger since we use AppLogger
    }]
  },
  overrides: [
    {
      // Special rules for .gs.ts files (Google Apps Script TypeScript)
      files: ['*.gs.ts', 'src/**/*.ts'],
      rules: {
        '@typescript-eslint/no-namespace': 'off',
        '@typescript-eslint/triple-slash-reference': 'off',
        'no-var': 'off'
      }
    },
    {
      // Test files
      files: ['**/*.test.ts', '**/*.spec.ts'],
      env: {
        jest: true
      },
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        'no-console': 'off'
      }
    },
    {
      // Build scripts
      files: ['scripts/**/*.js', 'scripts/**/*.ts'],
      rules: {
        'no-console': 'off',
        '@typescript-eslint/no-var-requires': 'off'
      }
    }
  ],
  ignorePatterns: [
    'dist/',
    'node_modules/',
    '*.js',
    '!.eslintrc.gas.js',
    'coverage/',
    'tmp/',
    '*.d.ts'
  ]
};