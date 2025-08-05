module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
  ],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },
  rules: {
    // Reglas de estilo
    'indent': ['error', 2],
    'linebreak-style': ['error', 'unix'],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
    
    // Reglas de variables
    'no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
    'no-undef': 'error',
    
    // Reglas de funciones
    'no-empty-function': 'warn',
    'prefer-arrow-callback': 'warn',
    
    // Reglas de objetos
    'object-curly-spacing': ['error', 'always'],
    'array-bracket-spacing': ['error', 'never'],
    
    // Reglas de strings
    'prefer-template': 'warn',
    'template-curly-spacing': ['error', 'never'],
    
    // Reglas de comentarios
    'spaced-comment': ['error', 'always'],
    
    // Reglas de importaciones
    'no-duplicate-imports': 'error',
    
    // Reglas de Google Apps Script
    'no-global-assign': 'off', // Google Apps Script usa variables globales
    'no-undef': 'off', // Google Apps Script tiene variables globales como SpreadsheetApp
  },
  globals: {
    // Variables globales de Google Apps Script
    'SpreadsheetApp': 'readonly',
    'ContentService': 'readonly',
    'PropertiesService': 'readonly',
    'UrlFetchApp': 'readonly',
    'Utilities': 'readonly',
    'console': 'readonly',
  },
}; 