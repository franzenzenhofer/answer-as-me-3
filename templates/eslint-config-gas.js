/**
 * ESLint Configuration for Google Apps Script Projects
 * Handles GAS-specific patterns and constraints
 */

module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended'
  ],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: './tsconfig.json'
  },
  env: {
    node: false,
    browser: false,
    es2022: true
  },
  plugins: [
    '@typescript-eslint'
  ],
  globals: {
    // Google Apps Script globals
    'Logger': 'readonly',
    'console': 'readonly',
    'Utilities': 'readonly',
    'PropertiesService': 'readonly',
    'Session': 'readonly',
    'UrlFetchApp': 'readonly',
    'HtmlService': 'readonly',
    'ContentService': 'readonly',
    'ScriptApp': 'readonly',
    'CacheService': 'readonly',
    'LockService': 'readonly',
    
    // Service-specific globals (to avoid namespace conflicts)
    'SpreadsheetApp': 'readonly',
    'DocumentApp': 'readonly',
    'DriveApp': 'readonly',
    'GmailApp': 'readonly',
    'CalendarApp': 'readonly',
    'FormApp': 'readonly',
    'SlidesApp': 'readonly',
    'CardService': 'readonly'
  },
  rules: {
    // TypeScript-specific rules
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-function-return-type': ['warn', {
      allowExpressions: true,
      allowTypedFunctionExpressions: true,
      allowHigherOrderFunctions: true
    }],
    
    // GAS-specific: Allow namespaces (required for GAS)
    '@typescript-eslint/no-namespace': 'off',
    
    // GAS-specific: Allow triple-slash references (required for namespace deps)
    '@typescript-eslint/triple-slash-reference': 'off',
    
    // GAS-specific: Custom unused vars pattern
    '@typescript-eslint/no-unused-vars': ['error', {
      argsIgnorePattern: '^_',
      // Include all GAS entry points and common namespaces
      varsIgnorePattern: '^_|^(' + [
        // Common namespaces
        'Config', 'Types', 'Utils', 'Validation', 'Template',
        'Email', 'GmailUtils', 'Gemini', 'Document', 'DriveUtils',
        'SheetsUtils', 'AppLogger', 'State', 'ErrorHandler', 'UI',
        
        // Entry point functions
        'onOpen', 'onInstall', 'onEdit', 'onFormSubmit',
        'doGet', 'doPost',
        
        // Gmail add-on triggers
        'onHomepage', 'onGmailMessage', 'onSettings',
        'onComposeAction', 'buildAddOn',
        
        // Calendar add-on triggers  
        'onCalendarEventOpen', 'onCalendarHomePageOpen',
        
        // Drive add-on triggers
        'onDriveItemsSelected', 'onDriveHomePageOpen',
        
        // Common handler patterns
        'handle[A-Z]\\w+', 'build[A-Z]\\w+', 'create[A-Z]\\w+',
        'save[A-Z]\\w+', 'load[A-Z]\\w+', 'update[A-Z]\\w+',
        'delete[A-Z]\\w+', 'generate[A-Z]\\w+', 'validate[A-Z]\\w+',
        
        // Test functions
        'test[A-Z]\\w+', 'runTests', 'runAllTests'
      ].join('|') + ')$'
    }],
    
    // Allow console for GAS (it goes to Stackdriver)
    'no-console': 'off',
    
    // Enforce code quality
    'prefer-const': 'error',
    'no-var': 'error',
    'eqeqeq': ['error', 'always'],
    'curly': ['error', 'all'],
    'brace-style': ['error', '1tbs'],
    
    // GAS-specific: Allow function declarations (common in GAS)
    'no-inner-declarations': 'off',
    
    // GAS-specific: Non-null assertions sometimes needed
    '@typescript-eslint/no-non-null-assertion': 'warn',
    
    // GAS-specific: Allow requires (GAS doesn't support imports)
    '@typescript-eslint/no-var-requires': 'off',
    
    // Prevent common GAS mistakes
    'no-undef': 'error',
    'no-redeclare': 'error',
    'no-shadow': 'off', // Turned off in favor of TS version
    '@typescript-eslint/no-shadow': ['error', {
      ignoreTypeValueShadow: true,
      ignoreFunctionTypeParameterNameValueShadow: true
    }]
  },
  overrides: [
    {
      // Test files
      files: ['**/*.test.ts', '**/*.spec.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off'
      }
    },
    {
      // Script files
      files: ['scripts/**/*.ts'],
      env: {
        node: true
      },
      rules: {
        'no-console': 'off'
      }
    }
  ],
  ignorePatterns: [
    'dist/**/*',
    'node_modules/**/*',
    'coverage/**/*',
    '*.js',
    '!.eslintrc.js',
    '!eslint-config-gas.js'
  ]
};